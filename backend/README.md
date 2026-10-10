# AgriTrack AI Backend

This is the Django backend for the AgriTrack AI assistant.

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Create a `.env` file based on `.env.example` and fill in the values.

4. Run migrations:
   ```
   python manage.py migrate
   ```

5. Create a superuser (optional, for admin access):
   ```
   python manage.py createsuperuser
   ```

6. Run the development server:
   ```
   python manage.py runserver
   ```

The API will be available at:
- Farm API: http://localhost:8000/api/farm/
- AI Assistant: http://localhost:8000/ai/assistant/

## Notes

- The frontend is configured to proxy `/api` and `/ai` requests to this backend during development (via vite.config.ts).
- The current frontend uses local demo authentication. In `DEBUG` mode, the AI endpoint accepts the signed-in demo user's username and role headers so the request can use the corresponding Django profile. Production requests must use a Django session.
- In production, you would need to configure your web server (e.g., Nginx) to serve the Django app and the frontend appropriately.
- The AI assistant uses OpenAI's GPT model if the `OPENAI_API_KEY` environment variable is set. Otherwise, it falls back to a rule-based response.
- An existing API key is not sufficient if the OpenAI project has exhausted its credits; in that case the endpoint logs the provider error and returns the rule-based response.