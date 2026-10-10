from django.db import models
from django.contrib.auth.models import User
from farm.models import UserProfile

class AIConversation(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='ai_conversations')
    user_message = models.TextField()
    assistant_response = models.TextField()
    # We can store the type of response: rule-based, AI-generated, etc.
    response_type = models.CharField(max_length=20, choices=[
        ('rule_based', 'Rule Based'),
        ('ai_generated', 'AI Generated'),
        ('external_source', 'External Source'),
    ], default='rule_based')
    # We can store the context records used (as a JSON string or we can create a separate model)
    context_records_used = models.TextField(blank=True, null=True)  # JSON list of record descriptions
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Conversation {self.id} for {self.user.user.username} at {self.created_at}"