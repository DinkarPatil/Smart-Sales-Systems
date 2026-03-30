import resend
from app.core.config import settings

# Configure Resend API Key
resend.api_key = settings.RESEND_API_KEY

async def send_response_email(email_to: str, subject: str, body: str):
    try:
        params = {
            "from": settings.MAIL_FROM,
            "to": [email_to],
            "subject": subject,
            "html": f"<div>{body}</div>",
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Error sending email via Resend: {e}")
        return False
