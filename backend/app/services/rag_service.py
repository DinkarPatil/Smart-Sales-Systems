from llama_index.llms.groq import Groq
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Document, VectorStoreIndex, Settings as LlamaSettings
from app.core.config import settings

# Global configuration for embeddings to avoid re-loading model per request
LlamaSettings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

async def generate_ai_answer(query_text: str, manual_content: str) -> str:
    """
    Generate a professional AI answer using RAG (Retrieval Augmented Generation) with Groq.
    Uses the product's manual content as the specialized knowledge base.
    """
    if not settings.GROQ_API_KEY:
        return (
            "Thank you for reaching out to our Sales Department.\n\n"
            "We have received your inquiry and our team is currently reviewing it. "
            "A representative will provide you with a detailed response shortly.\n\n"
            "Best regards,\nThe Sales Support Team"
        )

    try:
        # 1. Initialize LLM with Groq
        llm = Groq(model="llama3-70b-8192", api_key=settings.GROQ_API_KEY)
        
        # 2. Create index from product documentation
        # If no manual content is available, we provide a placeholder to the engine
        text_content = manual_content if (manual_content and len(manual_content.strip()) > 10) else "No detailed documentation available for this product yet. Assist the customer professionally."
        doc = Document(text=text_content)
        
        # Note: Constructing the index takes ~1-2 seconds with small docs.
        # For production scale, indices should be persisted or cached in memory.
        index = VectorStoreIndex.from_documents([doc])
        
        # 3. Create query engine
        query_engine = index.as_query_engine(llm=llm)
        
        # 4. Generate the response
        prompt = (
            "You are a professional Sales Support AI. "
            "Use the provided product documentation to answer the customer's question. "
            "If the answer isn't in the documentation, use your general knowledge but remain professional. "
            "Keep the response concise, helpful, and under 150 words.\n\n"
            f"Customer Inquiry: {query_text}"
        )
        
        # LlamaIndex query is synchronous in some versions, using aquery where possible
        response = await query_engine.aquery(prompt)
        
        return str(response)

    except Exception as e:
        # Fallback for API failures or configuration issues
        print(f"RAG Engine Critical Failure: {e}")
        return (
            f"Thank you for your inquiry: '{query_text}'.\n\n"
            "Our automated AI systems are undergoing maintenance. Your message has been "
            "escalated to our Sales Representatives who will respond to you personally "
            "as soon as possible.\n\n"
            "We appreciate your interest."
        )
