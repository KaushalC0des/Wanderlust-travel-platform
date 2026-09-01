from dotenv import load_dotenv
from pymongo import MongoClient
from pathlib import Path
from langchain_core.documents import Document 
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
import os


load_dotenv(Path(__file__).resolve().parent.parent / ".env")

uri = os.getenv("ATLASDB_URL")

client = MongoClient(uri)

db = client["test"]

print("Connected to database:", db.name)

listings_collection = db["listings"]
review_collection = db["reviews"]

documents = []

embeddings = OllamaEmbeddings (
    model="mxbai-embed-large"
)



for listing in listings_collection.find():

    hotel_text = f"""
    Hotel Name: {listing.get("title")}

    Location: {listing.get("location")}

    Country: {listing.get("country")}

    Price: ₹{listing.get("price")}

    Category: {listing.get("category")}

    Description:
    {listing.get("description")}

    Reviews:
    """

    review_ids = listing.get("reviews", [])


    for review_id in review_ids:
        review = review_collection.find_one({"_id": review_id})

        if review:
            hotel_text += f"\n⭐ {review['rating']}/5 - {review['comment']}"

    document = Document(
        page_content = hotel_text,
        metadata = {
            "hotel_name": listing.get("title"),
            "hotel_id" : str(listing["_id"]),
            "location" : listing.get("location"),
            "country" : listing.get("country"),
            "category" : listing.get("category"),
            "price" : listing.get("price")
        }
    )
    documents.append(document) 

    print(hotel_text)
    print("="*50)

print("\nTotal Documents:", len(documents))

print("\nFirst LangChain Document:\n")
print(documents[0]) 

vector_store = Chroma(
    collection_name="wanderlust_hotels",
    persist_directory="./chroma_db",
    embedding_function=embeddings
) 

vector_store.delete_collection()

vector_store = Chroma(
    collection_name="wanderlust_hotels",
    persist_directory="./chroma_db",
    embedding_function=embeddings
)

vector_store.add_documents(documents)

print("Documents added:", vector_store._collection.count())