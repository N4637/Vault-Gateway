import logging
from google import genai
from google.genai import types

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class GeminiClient:
    def __init__(self):
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._model = settings.gemini_model
        logger.info(f"Gemini client initialized with model: {self._model}")

    async def complete(self, prompt: str, system: str = "") -> str:
        logger.info(f"Sending masked prompt to Gemini ({self._model})")

        try:
            config = types.GenerateContentConfig(
                system_instruction=system or "You are a helpful assistant.",
                max_output_tokens=2048,
                temperature=0.7,
            )

            response = await self._client.aio.models.generate_content(
                model=self._model,
                contents=prompt,
                config=config,
            )

            result = response.text
            if not result:
                raise ValueError("Gemini returned an empty response")

            return result

        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise

llm_client = GeminiClient()