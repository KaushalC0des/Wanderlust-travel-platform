from fastapi import FastAPI
from pydantic import BaseModel

from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage

from rag import search_hotels


app = FastAPI()


class ChatRequest(BaseModel):
    message: str
    session_id: str



model = OllamaLLM(model="llama3.2")


# -----------------------------
# Query Rewriter
# -----------------------------

rewrite_template = """
You are a query rewriting assistant for a hotel search system.

Rewrite the user's latest question into a standalone search query.

Use the conversation history to understand references such as:
- it
- they
- that
- which one
- the cheaper one
- the better one

Preserve the user's original intent.

Do NOT invent prices, filters, locations, or requirements
that were not stated by the user.

If the user asks to compare previously mentioned hotels,
return ONLY the names of those hotels, one per line.

Do not add words such as:
"hotel comparison"
"price comparison"
"best hotel"
or any other instructions.

Example:

Misty Mountain Cottage
Infinity Blue Horizon Villa
Blue Lagoon Oceanfront Stay

Do not answer the question.
Only return the rewritten search query.

Conversation History:
{history}

Latest Question:
{question}
"""

rewrite_prompt = ChatPromptTemplate.from_template(rewrite_template)

rewrite_chain = rewrite_prompt | model


# -----------------------------
# Answer Generator
# -----------------------------

template = """
You are an AI travel assistant for WanderLust.

Answer the user's question using ONLY the hotel information provided below.

You may compare the provided hotels and make a recommendation when the user asks which option is better or which one they should prefer.

Base your recommendation only on information present in the provided hotel information.

Do NOT invent:
- amenities
- ratings
- reviews
- locations
- prices
- activities
- facilities
- any other information

If the provided hotel information is insufficient to answer the question,
politely say that you don't have enough information.

Conversation History:

{history}

Relevant Hotels:

{hotels}

User Question:

{question}
"""

prompt = ChatPromptTemplate.from_template(template)

chain = prompt | model


# -----------------------------
# Format hotel documents
# -----------------------------

def format_hotels(documents):
    hotel_text = ""

    for doc in documents:
        hotel_text += doc.page_content
        hotel_text += "\n\n"
        hotel_text += "-" * 50
        hotel_text += "\n\n"

    return hotel_text


# -----------------------------
# Conversation memory
# -----------------------------

conversation_histories = {}


# -----------------------------
# Routes
# -----------------------------

@app.get("/")
def home():
    return {"message": "WanderLust AI is running"}


@app.post("/chat")
def chat(request: ChatRequest):

    question = request.message
    session_id = request.session_id

    if session_id not in conversation_histories:
        conversation_histories[session_id] = []

    history = conversation_histories[session_id]
    
    # Rewrite follow-up questions
    if history:
        search_query = rewrite_chain.invoke({
            "history": history,
            "question": question
        })
    else:
        search_query = question

    print("\nOriginal Question", question)
    print("ReWritten Search Query:", search_query)

    # Search ChromaDB
    documents = search_hotels(search_query)

    # Convert documents into clean text
    hotel_context = format_hotels(documents)

    # Generate final AI response
    response = chain.invoke({
        "history": history,
        "hotels": hotel_context,
        "question": question
    })

    # Save conversation
    history.append(HumanMessage(content=question))
    history.append(AIMessage(content=response))

    return {
        "response": response
    }