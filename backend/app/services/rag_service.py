import logging
from app.core.config import settings

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Defensive Imports for LlamaIndex/Groq
try:
    from llama_index.core import VectorStoreIndex, Document, Settings
    from llama_index.llms.groq import Groq
    HAS_LLAMA_INDEX = True
except ImportError:
    logger.warning("LlamaIndex or Groq libraries not found. Falling back to template mode.")
    HAS_LLAMA_INDEX = False

async def generate_ai_answer(query_text: str, manual_content: str) -> str:
    """
    Generate an intelligent AI response grounded in the provided manual content.
    Uses LlamaIndex for RAG and Groq (Llama-3) for high-fidelity reasoning.
    Falls back to a professional template if dependencies are missing.
    """
    
    # Check if RAG engine is available and content exists
    if not HAS_LLAMA_INDEX or not manual_content or len(manual_content.strip()) < 10:
        if not HAS_LLAMA_INDEX:
            logger.error("RAG libraries missing. Cannot process neural grounding.")
        return _get_fallback_template(query_text)

    try:
        # 1. Configure the LLM (Groq)
        llm = Groq(model="llama3-70b-8192", api_key=settings.GROQ_API_KEY)
        
        # 2. Setup Indexing
        document = Document(text=manual_content)
        index = VectorStoreIndex.from_documents([document])
        
        # 3. Create Query Engine
        query_engine = index.as_query_engine(llm=llm)
        
        # 4. Generate Response
        prompt = (
            f"You are a helpful and professional sales representative. "
            f"Using ONLY the provided documentation, answer the following customer query: '{query_text}'. "
            f"If the answer is not in the documentation, politely inform the customer that a human representative "
            f"will follow up with more details. Keep the tone premium and helpful."
        )
        
        response = query_engine.query(prompt)
        return str(response)

    except Exception as e:
        logger.error(f"RAG Pipeline Error: {str(e)}")
        return _get_fallback_template(query_text)

def _get_fallback_template(query_text: str) -> str:
    """Standard professional fallback when RAG fails or content is missing."""
    return (
        "Thank you for reaching out to our Sales Department regarding your inquiry.\n\n"
        "We have successfully received your request: '" + (query_text[:50] + "..." if len(query_text) > 50 else query_text) + "'.\n\n"
        "A dedicated representative is currently reviewing your message and will provide you with "
        "a detailed resolution shortly.\n\n"
        "Best regards,\n"
        "The Sales Support Team"
    )
