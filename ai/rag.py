from langchain_chroma import Chroma
from langchain_core.embeddings import Embeddings
from dotenv import load_dotenv
from pathlib import Path
import requests
import os
import re

load_dotenv(
    Path(__file__).resolve().parent.parent / ".env"
)


class JinaEmbeddings(Embeddings):

    def __init__(self, api_key):
        self.api_key = api_key
        self.url = "https://api.jina.ai/v1/embeddings"
        self.model = "jina-embeddings-v3"

    def embed_query(self, text):
        response = requests.post(
            self.url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            },
            json={
                "model": self.model,
                "task": "retrieval.query",
                "input": [text]
            }
        )

        response.raise_for_status()

        return response.json()["data"][0]["embedding"]

    def embed_documents(self, texts):
        response = requests.post(
            self.url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            },
            json={
                "model": self.model,
                "task": "retrieval.passage",
                "input": texts
            }
        )

        response.raise_for_status()

        return [
            item["embedding"]
            for item in response.json()["data"]
        ]


embeddings = JinaEmbeddings(
    os.getenv("JINA_API_KEY")
)

vector_store = Chroma(
    collection_name="wanderlust_hotels",
    persist_directory="./chroma_db",
    embedding_function=embeddings
)

print(vector_store._collection.count())


def search_hotels(question):

    price_match = re.search(
        r"(?:below|under|less than)\s*[₹rs\.]*\s*(\d+)",
        question.lower()
    )

    if price_match:

        max_price = int(price_match.group(1))

        return vector_store.similarity_search(
            question,
            k=3,
            filter={
                "price": {
                    "$lt": max_price
                }
            }
        )

    return vector_store.similarity_search(
        question,
        k=3
    )

def search_hotels_by_names(names):

    results = []

    for name in names:

        documents = vector_store.similarity_search(
            name,
            k=1,
            filter={
                "hotel_name": name
            }
        )

        if documents:
            results.append(documents[0])
    return results

if __name__ == "__main__":

    names = [
        "Misty Mountain Cottage",
        "Infinity Blue Horizon Villa",
        "Blue Lagoon Oceanfront Stay"
    ]

    results = search_hotels_by_names(names)

    for doc in results:

        print("\n==============================")

        print(doc.page_content)

        print("\nMETADATA:")

        print(doc.metadata)