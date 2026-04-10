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

# 🔥 UPDATED PATTERNS (added direct API key detection)
CUSTOM_PATTERNS: list[dict] = [
    {
        "name": "OPENAI_KEY",
        "pattern": r"\bsk-[a-zA-Z0-9]{16,}\b",
        "entity_type": "API_KEY",
    },
    {
        "name": "GENERIC_API_KEY",
        "pattern": r"\b[A-Za-z0-9_\-]{20,}\b",
        "entity_type": "API_KEY",
    },
    {
        "name": "API_KEY_WITH_LABEL",
        "pattern": r"(?i)(api[_-]?key|apikey|access[_-]?token|secret[_-]?key)\s*[:=]\s*['\"]?([A-Za-z0-9\-_]{16,})['\"]?",
        "entity_type": "API_KEY",
    },
    {
        "name": "AWS_KEY",
        "pattern": r"AKIA[0-9A-Z]{16}",
        "entity_type": "API_KEY",
    },
    {
        "name": "DB_CONNECTION_STRING",
        "pattern": r"(?i)(mongodb|postgresql|mysql|redis|sqlite):\/\/[^\s]+",
        "entity_type": "DATABASE_CREDENTIAL",
    },
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


# 🔥 ENTROPY FUNCTIONS (NEW)
def shannon_entropy(text: str) -> float:
    prob = [n_x / len(text) for x, n_x in Counter(text).items()]
    return -sum(p * math.log2(p) for p in prob)


def is_high_entropy(text: str, threshold=3.5) -> bool:
    return len(text) >= 16 and shannon_entropy(text) > threshold


def _build_analyzer() -> AnalyzerEngine:
    try:
        nlp_config = {
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": "en_core_web_lg"}],
        }
        provider = NlpEngineProvider(nlp_configuration=nlp_config)
        nlp_engine = provider.create_engine()
        analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])
        logger.info("Presidio AnalyzerEngine initialized with en_core_web_lg")
    except Exception:
        logger.warning("Fallback to en_core_web_sm")
        nlp_config = {
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
        }
        provider = NlpEngineProvider(nlp_configuration=nlp_config)
        nlp_engine = provider.create_engine()
        analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])

    return analyzer


class PIIDetector:
    def __init__(self, score_threshold: float = 0.4):
        self.score_threshold = score_threshold
        self._analyzer = _build_analyzer()
        self._custom_patterns = [
            (p["entity_type"], re.compile(p["pattern"])) for p in CUSTOM_PATTERNS
        ]

    def detect(self, text: str) -> list[DetectionResult]:
        results: list[DetectionResult] = []

        # --- Presidio detection ---
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

        # --- Regex detection ---
        for entity_type, pattern in self._custom_patterns:
            for match in pattern.finditer(text):
                start = match.start(match.lastindex) if match.lastindex else match.start()
                end = match.end(match.lastindex) if match.lastindex else match.end()

                results.append(DetectionResult(
                    entity_type=entity_type,
                    start=start,
                    end=end,
                    score=0.95,
                    text=text[start:end],
                ))

        # --- 🔥 Entropy-based detection (NEW) ---
        words = re.findall(r"\b[\w\-]{16,}\b", text)

        for word in words:
            if is_high_entropy(word):
                start = text.find(word)
                end = start + len(word)

                results.append(DetectionResult(
                    entity_type="SECRET",
                    start=start,
                    end=end,
                    score=0.85,
                    text=word,
                ))

        results = _deduplicate(results)
        results.sort(key=lambda r: r.start)

        logger.info(f"Detected {len(results)} entities (including entropy-based)")
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