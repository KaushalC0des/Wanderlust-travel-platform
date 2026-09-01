from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
import re

embeddings = OllamaEmbeddings(
    model="mxbai-embed-large"
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

def search_hotels_by_name(names):

    results = []

    for name in names:

        documents = vector_store.similarity_search(
            name,
            k=1
        )

        if documents:
            results.append(documents[0])
    return results

# if __name__ == "__main__":

#     while True:

#         question = input("Ask a question (q to quit): ")

#         if question.lower() == "q":
#             break

#         results = search_hotels(question)

#         print(results)

if __name__ == "__main__":

    results = vector_store.similarity_search(
        "Misty Mountain Cottage",
        k=1
    )

    for doc in results:
        print("CONTENT:")
        print(doc.page_content)

        print("\nMETADATA:")
        print(doc.metadata)