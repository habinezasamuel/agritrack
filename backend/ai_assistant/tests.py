import json
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import RequestFactory, TestCase, override_settings

from farm.models import UserProfile
from .models import AIConversation
from .provider import classify_error, generate_answer
from .views import ai_assistant, get_data_for_question, format_rule_based_response


@override_settings(OPENAI_API_KEY='test-key-not-a-real-secret', OPENAI_MODEL='gpt-3.5-turbo')
class AssistantTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user('assistant-farmer')
        UserProfile.objects.create(user=self.user, role='farmer')
        self.factory = RequestFactory()

    def request(self, message):
        request = self.factory.post('/ai/assistant/', json.dumps({'message': message}), content_type='application/json')
        request.user = self.user
        return ai_assistant(request)

    def test_quota_and_temporary_rate_limit_are_different(self):
        error = Exception('Do not echo this raw error')
        error.status_code = 429
        error.code = 'insufficient_quota'
        self.assertEqual(classify_error(error)[0], 'quota_exhausted')
        error.code = 'rate_limit_exceeded'
        self.assertEqual(classify_error(error)[0], 'rate_limited')

    @patch('ai_assistant.provider.OpenAI')
    def test_live_response_is_labeled_correctly_and_saved(self, client):
        client.return_value.chat.completions.create.return_value = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content='Hello, how can I help?'))])
        response = self.request('hello')
        body = json.loads(response.content)
        self.assertEqual(body['response_type'], 'AI-generated')
        self.assertIsNone(body['provider_status'])
        self.assertEqual(AIConversation.objects.get().response_type, 'ai_generated')
        self.assertEqual(client.call_args.kwargs['max_retries'], 0)

    @patch('ai_assistant.provider.OpenAI')
    def test_quota_uses_useful_fallback_without_retry_loop(self, client):
        error = Exception('sensitive provider exception')
        error.status_code = 429
        error.code = 'credit_balance_exhausted'
        client.return_value.chat.completions.create.side_effect = error
        first = json.loads(self.request('Show my banana fields').content)
        self.assertEqual(first['provider_status']['code'], 'quota_exhausted')
        self.assertIn('Banana mats planted: 0', first['response'])
        self.assertNotIn('sensitive', json.dumps(first))
        self.request('hello')
        self.assertEqual(client.return_value.chat.completions.create.call_count, 1)
        self.assertEqual(AIConversation.objects.first().response_type, 'rule_based')

    def test_svg_asks_for_clarification_without_fake_context(self):
        data, context = get_data_for_question(self.user, 'svg')
        self.assertIn('SVG', format_rule_based_response(data))
        self.assertEqual(context, [])

    @override_settings(OPENAI_API_KEY='')
    def test_missing_key_reports_configuration_and_uses_records(self):
        response = json.loads(self.request('Summarize my farm').content)
        self.assertEqual(response['provider_status']['code'], 'not_configured')
        self.assertTrue(response['context_records'])

    def test_non_text_message_returns_400(self):
        self.assertEqual(self.request(['bad']).status_code, 400)
