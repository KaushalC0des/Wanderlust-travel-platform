from dotenv import load_dotenv
from pathlib import Path
import os

from langchain_openai import ChatOpenAI

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

model = ChatOpenAI(
    model="meta/muse-glimmer-30b",
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("NVIDIA_API_KEY")
)

response = model.invoke("Say hello")

print("CONTENT:", response.content)
print("RESPONSE:", response)