from llama_index.core import VectorStoreIndex, Document, Settings
from llama_index.llms.groq import Groq
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from app.core.config import settings

# Global configuration for LlamaIndex
def setup_llama_index():
    llm = Groq(model="llama3-70b-8192", api_key=settings.GROQ_API_KEY)
    embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
    
    Settings.llm = llm
    Settings.embed_model = embed_model
    Settings.chunk_size = 512

setup_llama_index()

async def generate_ai_answer(query_text: str, manual_content: str) -> str:
    if not manual_content:
        return "Manual content not available for this company."
    
    document = Document(text=manual_content)
    index = VectorStoreIndex.from_documents([document])
    query_engine = index.as_query_engine()
    
    prompt = (
        f"You are a sales support assistant. Use the following manual to answer the user's query.\n"
        f"Manual:\n{manual_content}\n\n"
        f"User Query: {query_text}\n\n"
        f"Provide a polite and helpful answer. Mention that a solution will be provided within 30 minutes. "
        f"Format the answer clearly so it can be sent via email."
    )
    
    response = query_engine.query(prompt)
    return str(response)
