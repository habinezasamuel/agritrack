"""One small live request; no farm records or credentials are printed."""
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agritrack.settings')

from ai_assistant.provider import generate_answer

answer, status = generate_answer('Reply with a short greeting.', '{}')
if answer:
    print('Live AI verification passed: a nonempty generated response was received.')
else:
    print('Live AI verification failed: ' + status['code'])
    print(status['message'])
    raise SystemExit(1)
