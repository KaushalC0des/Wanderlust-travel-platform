from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("NVIDIA_API_KEY")
)

print("Starting NVIDIA streaming test...\n")

stream = client.chat.completions.create(
    model="meta/muse-glimmer-30b",
    messages=[
        {
            "role": "user",
            "content": "Explain what a hotel is in 3 short sentences."
        }
    ],
    temperature=0.7,
    max_tokens=1000,
    stream=True
)

full_response = ""

for chunk in stream:
    delta = chunk.choices[0].delta

    if delta.content:
        print("ANSWER:", delta.content, end="", flush=True)

    reasoning = getattr(delta, "reasoning_content", None)

    if reasoning:
        print("REASONING:", reasoning, end="", flush=True)
    
print("\n\nStreaming finished.")