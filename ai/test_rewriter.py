from dotenv import load_dotenv
from pathlib import Path
import os

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

model = ChatOpenAI(
    model="meta/muse-glimmer-30b",
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("NVIDIA_API_KEY")
)

rewrite_template = """
You are a query rewriting assistant for a hotel search system.

Rewrite the user's latest question into a standalone search query.

Conversation History:
{history}

Latest Question:
{question}
"""

rewrite_prompt = ChatPromptTemplate.from_template(rewrite_template)

rewrite_chain = rewrite_prompt | model

history = [
    HumanMessage(content="give me hotels below 15000"),
    AIMessage(content="Here are some hotels below 15000.")
]

response = rewrite_chain.invoke({
    "history": history,
    "question": "which one is better?"
})

print("CONTENT:")
print(response.content)

print("\nFULL RESPONSE:")
print(response)