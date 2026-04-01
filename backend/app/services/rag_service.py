# Standard RAG Service - Simple Response Mode
# (Switched to hardcoded messages as requested)

async def generate_ai_answer(query_text: str, manual_content: str) -> str:
    """
    Generate a professional hardcoded response for sales inquiries.
    Bypasses Groq/LlamaIndex for immediate, reliable template-based messaging.
    """
    
    # Returning a professional sales response template
    return (
        "Thank you for reaching out to our Sales Department regarding your inquiry.\n\n"
        "We have successfully received your request: '" + (query_text[:50] + "..." if len(query_text) > 50 else query_text) + "'.\n\n"
        "Our team is currently reviewing your message and a dedicated representative "
        "will provide you with a detailed resolution shortly (typically within 30 minutes).\n\n"
        "In the meantime, please feel free to browse our offerings. We appreciate your patience.\n\n"
        "Best regards,\n"
        "The Sales Support Team"
    )
