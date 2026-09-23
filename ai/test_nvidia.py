from dotenv import load_dotenv
from pathlib import Path
from openai import OpenAI
import os

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

api_key = os.getenv("NVIDIA_API_KEY")

print("Key loaded:", bool(api_key))
print("Starts with nvapi:", api_key.startswith("nvapi-") if api_key else False)

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=api_key,
    timeout=30.0
)

try:
    print("Calling NVIDIA API...")

    response =  client.chat.completions.create(
        model="meta/muse-glimmer-30b",
        messages=[{"role":"user",
                   "content":"Which number is larger, 9.11 or 9.8?"}],
        temperature=1,
        top_p=0.95,
        max_tokens=512,
        stream=False
    )

    print("NVIDIA RESPONSE OBJECT:")
    print(response.choices[0].message)

    print("\nCONTENT:")
    print(response.choices[0].message.content)

    print("\nREASONING:")
    print(getattr(response.choices[0].message, "reasoning_content", None))

except Exception as e:
    print("NVIDIA ERROR:")
    print(type(e).__name__)
    print(e)