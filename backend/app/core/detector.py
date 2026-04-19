"""
detector.py — PII detection using Microsoft Presidio + spaCy + custom rules.

Fixes applied:
  - Phone numbers: regex fallback for unformatted digit strings (7-15 digits)
  - API keys: lowered min length to 6 chars, added special-char mixed pattern
  - Entropy: works on any printable chars including specials, threshold lowered
  - SECRET entity for high-entropy tokens not caught by other rules
"""

import re
import logging
import math
from collections import Counter
from dataclasses import dataclass

from presidio_analyzer import AnalyzerEngine, RecognizerResult
from presidio_analyzer.nlp_engine import NlpEngineProvider

logger = logging.getLogger(__name__)

ENTITIES_TO_DETECT = [
    "PERSON",
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "CREDIT_CARD",
    "IBAN_CODE",
    "IP_ADDRESS",
    "URL",
    "US_SSN",
    "CRYPTO",
    "LOCATION",
    "NRP",
    "MEDICAL_LICENSE",
    "DATE_TIME",
]

CUSTOM_PATTERNS: list[dict] = [
    # IP address: full (192.168.1.1) AND partial/malformed (192.12.12)
    # Catches 2-4 dot-separated numeric octets — covers both valid and truncated IPs
    {
        "name": "IP_ADDRESS_CUSTOM",
        "pattern": r"(?<!\d)(\d{1,3}\.\d{1,3}\.\d{1,3}(?:\.\d{1,3})?)(?!\d)",
        "entity_type": "IP_ADDRESS",
    },
    # Phone: plain digit strings 7-15 digits (catches 971123234)
    # Negative lookahead (?!\.) excludes IP-like patterns (192.168.x.x)
    {
        "name": "PHONE_RAW_DIGITS",
        "pattern": r"(?<!\d)(\+?[0-9]{7,15})(?!\d)(?!\.)",
        "entity_type": "PHONE_NUMBER",
    },
    # Phone: formatted with dashes/parens but NOT IP-like (no dot-separated groups)
    # Requires at least one non-dot separator (dash, space, paren)
    {
        "name": "PHONE_FORMATTED",
        "pattern": r"(\+?(?:\d[\s\-()]){3,}\d{2,})",
        "entity_type": "PHONE_NUMBER",
    },
    # OpenAI-style key
    {
        "name": "OPENAI_KEY",
        "pattern": r"\bsk-[a-zA-Z0-9]{16,}\b",
        "entity_type": "API_KEY",
    },
    # Labeled key: api_key=, secret=, token=, password=, etc.
    {
        "name": "API_KEY_WITH_LABEL",
        "pattern": r"(?i)(api[_-]?key|apikey|access[_-]?token|secret[_-]?key|secret|password|passwd|token)\s*[:=]\s*['\"]?([^\s'\"]{6,})['\"]?",
        "entity_type": "API_KEY",
    },
    # AWS access key
    {
        "name": "AWS_KEY",
        "pattern": r"AKIA[0-9A-Z]{16}",
        "entity_type": "API_KEY",
    },
    # Short mixed special-char secrets like 67$3@#kaesf
    {
        "name": "MIXED_SPECIAL_SECRET",
        "pattern": r"(?<!\w)([A-Za-z0-9]{1,8}[@#$%^&*!][A-Za-z0-9@#$%^&*!]{2,})(?!\w)",
        "entity_type": "API_KEY",
    },
    # Generic long alphanumeric token >=20 chars
    {
        "name": "GENERIC_LONG_TOKEN",
        "pattern": r"\b[A-Za-z0-9_\-]{20,}\b",
        "entity_type": "API_KEY",
    },
    # DB connection strings
    {
        "name": "DB_CONNECTION_STRING",
        "pattern": r"(?i)(mongodb|postgresql|mysql|redis|sqlite):\/\/[^\s]+",
        "entity_type": "DATABASE_CREDENTIAL",
    },
    # PEM private key header
    {
        "name": "PRIVATE_KEY_HEADER",
        "pattern": r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----",
        "entity_type": "API_KEY",
    },
]


@dataclass
class DetectionResult:
    entity_type: str
    start: int
    end: int
    score: float
    text: str


def shannon_entropy(text: str) -> float:
    if not text:
        return 0.0
    prob = [n / len(text) for n in Counter(text).values()]
    return -sum(p * math.log2(p) for p in prob)


def is_high_entropy_secret(text: str, min_len: int = 8, threshold: float = 3.2) -> bool:
    return len(text) >= min_len and shannon_entropy(text) > threshold


def _build_analyzer() -> AnalyzerEngine:
    for model in ("en_core_web_lg", "en_core_web_sm"):
        try:
            nlp_config = {
                "nlp_engine_name": "spacy",
                "models": [{"lang_code": "en", "model_name": model}],
            }
            provider = NlpEngineProvider(nlp_configuration=nlp_config)
            nlp_engine = provider.create_engine()
            analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])
            logger.info(f"Presidio initialized with {model}")
            return analyzer
        except Exception as e:
            logger.warning(f"{model} failed: {e}")
    raise RuntimeError("No spaCy model available")


class PIIDetector:
    def __init__(self, score_threshold: float = 0.4):
        self.score_threshold = score_threshold
        self._analyzer = _build_analyzer()
        self._custom_patterns = [
            (p["entity_type"], re.compile(p["pattern"])) for p in CUSTOM_PATTERNS
        ]

    def detect(self, text: str) -> list[DetectionResult]:
        results: list[DetectionResult] = []

        # 1. Presidio NLP-based detection
        try:
            presidio_results: list[RecognizerResult] = self._analyzer.analyze(
                text=text,
                entities=ENTITIES_TO_DETECT,
                language="en",
                score_threshold=self.score_threshold,
            )
            for r in presidio_results:
                results.append(DetectionResult(
                    entity_type=r.entity_type,
                    start=r.start,
                    end=r.end,
                    score=r.score,
                    text=text[r.start:r.end],
                ))
        except Exception as e:
            logger.error(f"Presidio failed: {e}")

        # 2. Custom regex patterns
        for entity_type, pattern in self._custom_patterns:
            for match in pattern.finditer(text):
                if match.lastindex:
                    start = match.start(match.lastindex)
                    end   = match.end(match.lastindex)
                else:
                    start = match.start()
                    end   = match.end()
                matched_text = text[start:end].strip()
                if not matched_text:
                    continue
                results.append(DetectionResult(
                    entity_type=entity_type,
                    start=start,
                    end=end,
                    score=0.92,
                    text=matched_text,
                ))

        # 3. Entropy-based scan — catches random-looking tokens
        for match in re.finditer(r"[^\s,;:\"'()\[\]{}]+", text):
            token = match.group()
            if is_high_entropy_secret(token):
                already_covered = any(
                    r.start <= match.start() and r.end >= match.end()
                    for r in results
                )
                if not already_covered:
                    results.append(DetectionResult(
                        entity_type="SECRET",
                        start=match.start(),
                        end=match.end(),
                        score=0.80,
                        text=token,
                    ))

        results = _deduplicate(results)

        # Remove phone detections that are actually IPs (e.g. 192.12.12 matched as digits)
        ip_pattern = re.compile(r"^\d{1,3}(\.\d{1,3}){1,3}$")
        results = [
            r for r in results
            if not (r.entity_type == "PHONE_NUMBER" and ip_pattern.match(r.text.strip()))
        ]

        results.sort(key=lambda r: r.start)
        logger.info(f"Detected {len(results)} PII entities")
        return results

    def get_entity_summary(self, results: list[DetectionResult]) -> dict[str, int]:
        summary: dict[str, int] = {}
        for r in results:
            summary[r.entity_type] = summary.get(r.entity_type, 0) + 1
        return summary


def _deduplicate(results: list[DetectionResult]) -> list[DetectionResult]:
    if not results:
        return results
    results.sort(key=lambda r: (r.start, -r.score))
    deduped: list[DetectionResult] = []
    last_end = -1
    for r in results:
        if r.start >= last_end:
            deduped.append(r)
            last_end = r.end
        else:
            if deduped and r.score > deduped[-1].score:
                deduped[-1] = r
                last_end = r.end
    return deduped