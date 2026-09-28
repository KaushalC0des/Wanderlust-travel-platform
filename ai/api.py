from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from pathlib import Path
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage


from rag import search_hotels, search_hotels_by_names

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
print("NVIDIA KEY LOADED:", bool(os.getenv("NVIDIA_API_KEY")))

app = FastAPI()


class ChatRequest(BaseModel):
    message: str
    session_id: str


model = ChatOpenAI(
    model="meta/muse-glimmer-30b",
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("NVIDIA_API_KEY")
)

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

If the user asks about previously mentioned hotels,
return their exact names, one per line.

If the user introduces a new price, location, category,
or other search constraint, preserve that constraint
in the rewritten query.

Do not add explanations, comparison instructions,
quotes, or extra words.

Do not answer the question.

Conversation History:
{history}

Latest Question:
{question}
"""

rewrite_prompt = ChatPromptTemplate.from_template(rewrite_template)

rewrite_chain = rewrite_prompt | model

def extract_hotel_names(search_query):

    return [
        line.strip()
        for line in search_query.split("\n")
        if line.strip()
    ]


# -----------------------------
# Answer Generator
# -----------------------------

template = """
You are an AI travel assistant for WanderLust.

Answer the user's question using ONLY the hotel information provided below.

You may compare the provided hotels and make a recommendation when the user asks which option is better or which one they should prefer.

When recommending a hotel, compare the available information such as:
- price
- location
- category
- description
- review information, if available

Explain briefly why you recommend the option.

Base your recommendation ONLY on information present in the provided hotel information.

If the available information is not enough to determine a clear winner,
say that there is no clear winner and explain the available differences.

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

def is_casual_message(question):
    casual_message = [
        "hii",
        "hi",
        "hiii",
        "hello",
        "hey",
        "thanks",
        "thak you"
    ]

    return question.lower().strip() in casual_message

@app.get("/")
def home():
    return {"message": "WanderLust AI is running"}


@app.post("/chat")
def chat(request: ChatRequest):

    question = request.message
    session_id = request.session_id

    if is_casual_message(question):
        return {
            "response": "Hi! 👋 I'm WanderLust AI. I can help you find hotels based on price, location, category, and other details."
        }

    if session_id not in conversation_histories:
        conversation_histories[session_id] = []

    history = conversation_histories[session_id]
    
    # Rewrite follow-up questions
    if history:
      print("Calling rewriter model...")
      rewritten = rewrite_chain.invoke({
          "history": history,
          "question": question
      })
      print("Rewrite model finished");
      print("Rewrite response:", rewritten.content)
      search_query = rewritten.content
    else:
        search_query = question

    print("\nOriginal Question", question)
    print("ReWritten Search Query:", search_query)

    # Search ChromaDB
    if history:
        hotel_names = extract_hotel_names(search_query)
        documents = search_hotels_by_names(hotel_names)
    else :
          documents = search_hotels(search_query)

    hotel_context = format_hotels(documents)

    # Generate final AI response
    def generate_response():

        full_response = ""

        for chunk in chain.stream({
            "history": history,
            "hotels": hotel_context,
            "question": question
        }):

            content = chunk.content

            if content:
                full_response += content
                yield content

        history.append(HumanMessage(content=question))
        history.append(AIMessage(content=full_response))


    return StreamingResponse(
        generate_response(),
        media_type="text/plain"
    )