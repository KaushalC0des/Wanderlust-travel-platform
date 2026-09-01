from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage
from rag import search_hotels

model = OllamaLLM(model="llama3.2")

rewrite_template = """
You are a query rewriting assistant for a hotel search system.

Rewrite the user's latest question into a standalone search query.

Use the conversation history to resolve references such as:
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
include the names of those hotels in the rewritten query.

Do not answer the question.
Only return the rewritten search query.

Conversation History:
{history}

Latest Question:
{question}
"""

rewrite_prompt = ChatPromptTemplate.from_template(rewrite_template)

rewrite_chain = rewrite_prompt | model

template = """
You are an AI travel assistant for WanderLust.

Answer the user's question using ONLY the hotel information provided below.

If the answer cannot be found in the provided hotels, politely say that you don't have enough information.

{history}

Relevant Hotels:

{hotels}

User Question:

{question}
"""

prompt = ChatPromptTemplate.from_template(template)

chain = prompt | model

def format_hotels(documents):
    hotel_text = ""

    for doc in documents:
        hotel_text += doc.page_content
        hotel_text += "\n\n"
        hotel_text += "-"*50
        hotel_text += "\n\n"
    return hotel_text

history = []

while True:
    question = input("\nAsk your question (q to quit): ")

    if question.lower() == "q":
        break

    if history :
        search_query = rewrite_chain.invoke({
            "history": history,
            "question": question
        })
    else:
        search_query = question

    documents = search_hotels(search_query)

    print("\nSearch Query:", search_query)

    hotel_context = format_hotels(documents)

    response = chain.invoke({
        "history": history,
        "hotels": hotel_context,
        "question": question
    })

    print("\nAI Response:\n")
    print(response)
    history.append(HumanMessage(content=question))
    history.append(AIMessage(content=response))

