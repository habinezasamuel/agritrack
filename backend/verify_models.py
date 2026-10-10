import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agritrack.settings')
django.setup()

from farm.models import AgriculturalInputApplication, InputPayment, Notification, PaymentAuditLog

print('=== Model Verification ===')
print()
print('AgriculturalInputApplication STATUS_CHOICES:')
for code, name in AgriculturalInputApplication.STATUS_CHOICES:
    print(f'  {code}: {name}')

print()
print('AgriculturalInputApplication PAYMENT_STATUSES:')
for code, name in AgriculturalInputApplication.PAYMENT_STATUSES:
    print(f'  {code}: {name}')

print()
print('InputPayment status field choices:')
status_field = InputPayment._meta.get_field('status')
for code, name in status_field.choices:
    print(f'  {code}: {name}')

print()
print('Notification model fields:')
for f in Notification._meta.get_fields():
    if f.name not in ('id', 'created_at', 'updated_at'):
        print(f'  {f.name}: {f.get_internal_type()}')

print()
print('PaymentAuditLog model fields:')
for f in PaymentAuditLog._meta.get_fields():
    if f.name not in ('id', 'created_at', 'updated_at'):
        print(f'  {f.name}: {f.get_internal_type()}')

print()
print('=== Verification Complete ===')