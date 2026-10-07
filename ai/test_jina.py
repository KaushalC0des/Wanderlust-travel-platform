import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(
    Path(__file__).resolve().parent.parent / ".env"
)

api_key = os.getenv("JINA_API_KEY")

url = "https://api.jina.ai/v1/embeddings"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}

data = {
    "model": "jina-embeddings-v3",
    "task": "retrieval.query",
    "input": [
        "peaceful hotel in the mountains"
    ]
}

response = requests.post(
    url,
    headers=headers,
    json=data
)

print("Status:", response.status_code)
print(response.json())