from llama_index.llms.groq import Groq
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Document, VectorStoreIndex, Settings as LlamaSettings
from app.core.config import settings

# Global configuration for embeddings to avoid re-loading model per request
LlamaSettings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

async def generate_ai_answer(query_text: str, manual_content: str) -> str:
    """
    Generate a professional AI answer using RAG.
    Primary Engine: Ollama (llava:13b)
    Secondary Engine / Fallback: Groq (Llama-3)
    """
    
    # 1. Prepare Product Documentation
    text_content = manual_content if (manual_content and len(manual_content.strip()) > 10) else "No detailed documentation available. Provide general professional sales assistance."
    doc = Document(text=text_content)
    index = VectorStoreIndex.from_documents([doc])
    
    # 2. Try Primary Engine: Ollama (llava:13b)
    try:
        ollama_llm = Ollama(
            model=settings.OLLAMA_MODEL, 
            base_url=settings.OLLAMA_BASE_URL,
            request_timeout=30.0
        )
        
        query_engine = index.as_query_engine(llm=ollama_llm)
        
        prompt = (
            "You are a sales assistant. Use the provided documentation to answer. "
            "IMPORTANT: If you are not 100% sure about the facts, "
            "begin your response with the phrase [LOW_CONFIDENCE]. "
            "Otherwise, respond normally and concisely.\n\n"
            f"Question: {query_text}"
        )
        
        response = await query_engine.aquery(prompt)
        response_text = str(response).strip()
        
        # 3. Evaluate Confidence and Switch to Fallback if needed
        is_low_confidence = "[LOW_CONFIDENCE]" in response_text.upper()
        is_too_short = len(response_text) < 15
        
        if not is_low_confidence and not is_too_short:
            return response_text.replace("[LOW_CONFIDENCE]", "").strip()
            
    except Exception as e:
        print(f"Ollama Primary Engine Failure: {e}")

    # 4. Fallback Engine: Groq (High Confidence)
    print("Switching to Groq Fallback...")
    if not settings.GROQ_API_KEY:
        return "Thank you for yours inquiry. Our sales team will get back to you shortly."

    try:
        groq_llm = Groq(model="llama3-70b-8192", api_key=settings.GROQ_API_KEY)
        query_engine = index.as_query_engine(llm=groq_llm)
        
        fallback_prompt = (
            "An earlier AI model was unsure. Provide a high-confidence, professional "
            "answer based on this documentation:\n\n"
            f"Question: {query_text}"
        )
        
        response = await query_engine.aquery(fallback_prompt)
        return str(response)

    except Exception as e:
        print(f"Critical Fallback Failure: {e}")
        return "Inquiry received. A representative will contact you personally."
