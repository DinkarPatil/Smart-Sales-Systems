import asyncio
import os
from dotenv import load_dotenv
from app.services.rag_service import generate_ai_answer
from datetime import datetime

# Load environment variables
load_dotenv()

async def test_rag_system():
    print("--- \ud83e\udd16 Starting RAG Model Test ---")
    
    if not os.getenv("GROQ_API_KEY"):
        print("\u274c ERROR: GROQ_API_KEY not found in .env!")
        return

    # 1. Sample Manual Content
    sample_manual = """
    Product: SmartRouter X1
    Troubleshooting Guide:
    1. Red Blinking Light: This means the internet connection is lost. Try unplugging the power for 30 seconds.
    2. Yellow Light: Firmware update in progress. Do not turn off.
    3. Password Reset: Hold the reset button for 10 seconds. The default password is 'admin123'.
    4. Support: Contact support@routercorp.com for further help.
    """

    # 2. Sample User Query
    user_query = "What does the red blinking light on my router mean?"
    
    print(f"\ud83d\udce5 Query: {user_query}")
    print("\u23f3 Generating AI Response (using Groq)...")

    # 3. Track resolution time (Performance logic)
    start_time = datetime.utcnow()
    
    try:
        # Generate Answer
        ai_response = await generate_ai_answer(user_query, sample_manual)
        
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        print("\n\u2705 AI RESPONSE RECEIVED:")
        print("-" * 50)
        print(ai_response)
        print("-" * 50)
        
        print(f"\n\u23f1\ufe0f Resolution Time: {round(duration, 2)} seconds")
        print("\u2b50 Performance tracking logic verified!")

    except Exception as e:
        print(f"\u274c ERROR during RAG generation: {e}")

if __name__ == "__main__":
    asyncio.run(test_rag_system())
