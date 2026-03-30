import asyncio
import os
from dotenv import load_dotenv
from app.services.email_service import send_response_email

# Load environment variables
load_dotenv()

async def main():
    # Random yopmail ID for testing
    test_email = "sales-test-agent@yopmail.com"
    
    print(f"--- Sending Test Email to {test_email} ---")
    
    if not os.getenv("RESEND_API_KEY"):
        print("ERROR: RESEND_API_KEY not found in .env file!")
        return

    success = await send_response_email(
        email_to=test_email,
        subject="Test: Sales RAG Resolution System",
        body="<h1>Test Successful!</h1><p>This is an automated test from your Sales RAG Chatbot. 30 Minutes SLA is working.</p>"
    )

    if success:
        print("\u2705 SUCCESS: Email sent successfully!")
        print(f"Go to https://yopmail.com/?{test_email.split('@')[0]} to check it out!")
    else:
        print("\u274c FAILED: Could not send email. Check your API key and 'from' address.")

if __name__ == "__main__":
    asyncio.run(main())
