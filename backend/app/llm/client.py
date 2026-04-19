import logging
import os
import asyncio
from openai import OpenAI

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class HFClient:
    def __init__(self):
        self._client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key=settings.hf_token or os.environ.get("HF_TOKEN"),
        )

        # You can move this to config if needed
        self._model = "meta-llama/Llama-3.1-8B-Instruct:novita"

        logger.info(f"HuggingFace client initialized with model: {self._model}")

    async def complete(self, prompt: str, system: str = "") -> str:
        logger.info(f"Sending prompt to HuggingFace model ({self._model})")

        try:
            messages = [
                {
                    "role": "system",
                    "content": system or "You are a helpful assistant.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ]

            # Run blocking call in async-safe way
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self._client.chat.completions.create(
                    model=self._model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=2048,
                ),
            )

            result = response.choices[0].message.content

            if not result:
                raise ValueError("HuggingFace returned an empty response")

            return result

        except Exception as e:
            logger.error(f"HuggingFace API error: {e}")
            raise


llm_client = HFClient()