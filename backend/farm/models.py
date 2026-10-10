from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.utils import timezone

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('farmer', 'Farmer'),
        ('officer', 'Agricultural Officer'),
        ('admin', 'Administrator'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    registration_id = models.CharField(max_length=50, blank=True, null=True, unique=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    sector = models.CharField(max_length=100, blank=True, null=True)
    cell = models.CharField(max_length=100, blank=True, null=True)
    village = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class Farm(models.Model):
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='farms')
    name = models.CharField(max_length=100)
    size_hectares = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0.01)])
    location = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Field(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='fields')
    name = models.CharField(max_length=100)
    size_hectares = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0.01)])
    crop_type = models.CharField(max_length=50)
    variety = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.crop_type})"

class Season(models.Model):
    name = models.CharField(max_length=50)
    start_month = models.IntegerField()
    end_month = models.IntegerField()
    year = models.IntegerField()

    class Meta:
        unique_together = ('name', 'year')

    def __str__(self):
        return f"{self.name} {self.year}"

class CropSeason(models.Model):
    PLANTING_METHOD_CHOICES = [
        ('DIRECT_SEEDING', 'Direct Seeding'),
        ('TRANSPLANTING', 'Transplanting'),
    ]
    field = models.ForeignKey(Field, on_delete=models.CASCADE, related_name='crop_seasons')
    season = models.ForeignKey(Season, on_delete=models.CASCADE, blank=True, null=True)
    planting_date = models.DateField()
    expected_harvest_date = models.DateField(blank=True, null=True)
    actual_harvest_date = models.DateField(blank=True, null=True)
    planting_method = models.CharField(max_length=20, choices=PLANTING_METHOD_CHOICES, default='DIRECT_SEEDING')
    planted_area_hectares = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)], blank=True, null=True)
    expected_growing_duration_days = models.PositiveIntegerField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=[
        ('planned', 'Planned'),
        ('active', 'Active'),
        ('harvested', 'Harvested'),
        ('failed', 'Failed'),
    ], default='planned')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.field} - {self.season if self.season else 'No season'}"

class Activity(models.Model):
    ACTIVITY_TYPES = [
        ('land_preparation', 'Land Preparation'),
        ('fertilizer_application', 'Fertilizer Application'),
        ('weeding', 'Weeding'),
        ('pesticide_application', 'Pesticide Application'),
        ('irrigation', 'Irrigation'),
        ('harvesting', 'Harvesting'),
        ('other', 'Other'),
    ]
    crop_season = models.ForeignKey(CropSeason, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    description = models.TextField(blank=True, null=True)
    date_performed = models.DateField()
    cost = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], blank=True, null=True)
    payment_method = models.CharField(max_length=30, blank=True, null=True)
    reference = models.CharField(max_length=100, blank=True, null=True)
    recorded_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='recorded_activities')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.activity_type} on {self.date_performed}"

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    crop_season = models.ForeignKey(CropSeason, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    completed = models.BooleanField(default=False)
    completed_date = models.DateField(blank=True, null=True)
    created_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='created_tasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class HarvestRecord(models.Model):
    crop_season = models.ForeignKey(CropSeason, on_delete=models.CASCADE, related_name='harvest_records')
    harvest_date = models.DateField()
    quantity_kg = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    grade = models.CharField(max_length=20, blank=True, null=True)
    plot_name = models.CharField(max_length=100, blank=True, null=True)
    area_hectares = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)], blank=True, null=True)
    moisture_content_percent = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)], blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='recorded_harvests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.crop_season} - {self.quantity_kg} kg on {self.harvest_date}"

class InputRequest(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    INPUT_TYPES = [
        ('seed', 'Seed'),
        ('fertilizer', 'Fertilizer'),
        ('pesticide', 'Pesticide'),
        ('other', 'Other'),
    ]
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='input_requests')
    input_type = models.CharField(max_length=20, choices=INPUT_TYPES)
    description = models.TextField()
    quantity_details = models.CharField(max_length=200)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    submitted_at = models.DateTimeField(blank=True, null=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='reviewed_input_requests')
    admin_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.input_type} request - {self.status}"

class Order(models.Model):
    input_request = models.OneToOneField(InputRequest, on_delete=models.CASCADE, related_name='order')
    order_number = models.CharField(max_length=50, unique=True)
    order_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ], default='pending')
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.order_number}"

class Payment(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    payment_date = models.DateTimeField()
    method = models.CharField(max_length=50)
    transaction_id = models.CharField(max_length=100)
    payer_name = models.CharField(max_length=100)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Payment of {self.amount} for {self.order}"


class InputCatalogBase(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    supported_crops = models.JSONField(default=list, blank=True)
    unit = models.CharField(max_length=20, default='KG')
    price_per_unit = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    available_quantity = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['name']


class Fertilizer(InputCatalogBase):
    fertilizer_type = models.CharField(max_length=80, blank=True)

    def __str__(self):
        return self.name


class Seed(InputCatalogBase):
    crop = models.CharField(max_length=80)
    variety = models.CharField(max_length=120, blank=True)

    def __str__(self):
        return f"{self.name} ({self.crop})"


class AgriculturalInputApplication(models.Model):
    INPUT_TYPES = [('fertilizer', 'Fertilizer'), ('seed', 'Seed')]
    STATUS_CHOICES = [
        ('pending_review', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('ready_for_collection', 'Ready for Collection/Delivery'),
        ('collected', 'Collected'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_STATUSES = [
        ('unpaid', 'Unpaid'),
        ('pending_verification', 'Pending Verification'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    application_number = models.CharField(max_length=40, unique=True, editable=False)
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='agricultural_input_applications')
    farm = models.ForeignKey(Farm, on_delete=models.PROTECT, related_name='input_applications')
    field = models.ForeignKey(Field, on_delete=models.PROTECT, related_name='input_applications')
    crop = models.CharField(max_length=80)
    input_type = models.CharField(max_length=20, choices=INPUT_TYPES)
    fertilizer = models.ForeignKey(Fertilizer, on_delete=models.PROTECT, blank=True, null=True, related_name='applications')
    seed = models.ForeignKey(Seed, on_delete=models.PROTECT, blank=True, null=True, related_name='applications')
    quantity = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0.01)])
    unit = models.CharField(max_length=20)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    purpose = models.TextField(blank=True)
    preferred_date = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending_review')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUSES, default='unpaid')
    admin_comments = models.TextField(blank=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.application_number:
            self.application_number = f"AGI-{timezone.now():%Y%m%d%H%M%S}-{self.farmer_id}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.application_number


class InputPayment(models.Model):
    application = models.OneToOneField(AgriculturalInputApplication, on_delete=models.CASCADE, related_name='payment')
    method = models.CharField(max_length=50)
    reference = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20, choices=[
        ('pending_verification', 'Pending Verification'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ], default='pending_verification')
    is_sandbox = models.BooleanField(default=False)
    provider_transaction_id = models.CharField(max_length=100, blank=True, null=True)
    provider_reference = models.CharField(max_length=100, blank=True, null=True)
    proof_file = models.CharField(max_length=255, blank=True, null=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    verified_at = models.DateTimeField(blank=True, null=True)
    verified_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='verified_payments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.reference


class InputReceipt(models.Model):
    payment = models.OneToOneField(InputPayment, on_delete=models.CASCADE, related_name='receipt')
    receipt_number = models.CharField(max_length=50, unique=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.receipt_number


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('info', 'Info'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    ]
    recipient = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='info')
    related_entity_type = models.CharField(max_length=30, blank=True, null=True)
    related_entity_id = models.CharField(max_length=40, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.recipient}"


class PaymentAuditLog(models.Model):
    payment = models.ForeignKey(InputPayment, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=50)
    old_status = models.CharField(max_length=20, blank=True, null=True)
    new_status = models.CharField(max_length=20, blank=True, null=True)
    notes = models.TextField(blank=True)
    performed_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='payment_audit_logs')
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} - {self.payment} at {self.created_at}"

class GrowthObservation(models.Model):
    crop_season = models.ForeignKey(CropSeason, on_delete=models.CASCADE, related_name='growth_observations')
    observation_date = models.DateField()
    growth_stage = models.CharField(max_length=50)
    notes = models.TextField(blank=True, null=True)
    photos = models.JSONField(default=list, blank=True)
    recorded_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='recorded_growth_observations')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.crop_season} - {self.growth_stage} on {self.observation_date}"

class AgriculturalOfficerAdvice(models.Model):
    crop_season = models.ForeignKey(CropSeason, on_delete=models.CASCADE, related_name='officer_advice')
    officer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='given_advice')
    advice_date = models.DateField()
    advice_text = models.TextField()
    related_observation = models.ForeignKey(GrowthObservation, on_delete=models.SET_NULL, blank=True, null=True, related_name='related_advice')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Advice for {self.crop_season} by {self.officer} on {self.advice_date}"

class ExternalAgriculturalSource(models.Model):
    title = models.CharField(max_length=200)
    url = models.URLField()
    source_type = models.CharField(max_length=50, choices=[
        ('research_paper', 'Research Paper'),
        ('government_guideline', 'Government Guideline'),
        ('extension_service', 'Extension Service'),
        ('ngo_publication', 'NGO Publication'),
        ('other', 'Other'),
    ])
    publication_date = models.DateField(blank=True, null=True)
    retrieved_at = models.DateTimeField(auto_now_add=True)
    summary = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.title


# ==========================================
# BANANA FARMING MANAGEMENT EXTENSION
# ==========================================

class BananaPlantation(models.Model):
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='banana_plantations')
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='banana_plantations')
    field = models.ForeignKey(Field, on_delete=models.SET_NULL, null=True, blank=True, related_name='banana_plantations')
    name = models.CharField(max_length=150)
    land_size_hectares = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0.01)])
    planting_date = models.DateField()
    variety = models.CharField(max_length=100, default='FHIA-17')
    total_plants_planted = models.PositiveIntegerField(default=100)
    current_healthy_plants = models.PositiveIntegerField(default=100)
    current_affected_plants = models.PositiveIntegerField(default=0)
    spacing = models.CharField(max_length=50, default='3m x 3m')
    status = models.CharField(max_length=30, choices=[
        ('VEGETATIVE', 'Vegetative Growth'),
        ('FLOWERING_SHOOTING', 'Flowering / Shooting'),
        ('BUNCH_DEVELOPMENT', 'Bunch Development'),
        ('HARVESTING_READY', 'Ready for Harvest'),
        ('RATOONING', 'Ratoon Cycle'),
        ('DORMANT_RECOVERY', 'Recovery / Rejuvenation'),
    ], default='VEGETATIVE')
    photo_url = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.variety}) - {self.farmer}"


class BananaGrowthLog(models.Model):
    plantation = models.ForeignKey(BananaPlantation, on_delete=models.CASCADE, related_name='growth_records')
    recorded_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField(default=timezone.now)
    stage = models.CharField(max_length=50)
    average_height_meters = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    pseudostem_girth_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    healthy_plants = models.PositiveIntegerField()
    damaged_plants = models.PositiveIntegerField(default=0)
    canopy_condition = models.CharField(max_length=50, default='GOOD')
    general_observations = models.TextField(blank=True, null=True)
    photo_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.plantation.name} Growth Log - {self.date}"


class BananaDiseaseReport(models.Model):
    SEVERITY_CHOICES = [
        ('LOW', 'Low (Isolated symptoms)'),
        ('MEDIUM', 'Medium (Moderate spread)'),
        ('HIGH', 'High (Substantial plantation threat)'),
        ('CRITICAL', 'Critical (Urgent outbreak quarantine needed)'),
    ]
    STATUS_CHOICES = [
        ('REPORTED', 'Reported'),
        ('UNDER_REVIEW', 'Under Review'),
        ('IN_PROGRESS', 'Treatment In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]

    plantation = models.ForeignKey(BananaPlantation, on_delete=models.CASCADE, related_name='disease_reports')
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='banana_disease_reports')
    report_date = models.DateField(default=timezone.now)
    problem_type = models.CharField(max_length=100)
    description = models.TextField()
    affected_plants_count = models.PositiveIntegerField(default=1)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REPORTED')
    location_details = models.CharField(max_length=255, blank=True, null=True)
    photo_url = models.TextField(blank=True, null=True)
    additional_notes = models.TextField(blank=True, null=True)
    request_assistance = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-report_date', '-created_at']

    def __str__(self):
        return f"{self.problem_type} ({self.severity}) - {self.plantation.name}"


class BananaWeatherReport(models.Model):
    WEATHER_TYPES = [
        ('HEAVY_RAIN', 'Heavy Rain'),
        ('EXCESSIVE_RAINFALL', 'Too Much Rainfall (Waterlogging)'),
        ('LOW_RAINFALL', 'Low Rainfall'),
        ('DROUGHT', 'Severe Drought / Moisture Stress'),
        ('STRONG_WIND', 'Strong Wind / Pseudostem Lodging'),
        ('FLOODING', 'Flooding & Silt Deposition'),
        ('HAIL', 'Hail Storm Damage'),
        ('NORMAL_RAIN', 'Normal / Optimal Rainfall'),
        ('OTHER', 'Other Weather Anomaly'),
    ]
    DAMAGE_LEVELS = [
        ('NONE', 'No Damage'),
        ('MILD', 'Mild Leaf Tearing'),
        ('MODERATE', 'Moderate Root Stress / Tilted Mats'),
        ('SEVERE', 'Severe Pseudostem Snapping / Inundation'),
        ('CATASTROPHIC', 'Total Crop Loss'),
    ]

    plantation = models.ForeignKey(BananaPlantation, on_delete=models.CASCADE, related_name='weather_reports')
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='banana_weather_reports')
    date = models.DateField(default=timezone.now)
    weather_type = models.CharField(max_length=50, choices=WEATHER_TYPES)
    description = models.TextField()
    damage_level = models.CharField(max_length=20, choices=DAMAGE_LEVELS, default='MILD')
    affected_plants_estimate = models.PositiveIntegerField(default=0)
    photo_url = models.TextField(blank=True, null=True)
    request_assistance = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.weather_type} on {self.date} - {self.plantation.name}"


class BananaAssistanceRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('UNDER_REVIEW', 'Under Review'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('REJECTED', 'Rejected'),
    ]
    URGENCY_CHOICES = [
        ('NORMAL', 'Normal'),
        ('URGENT', 'Urgent'),
        ('EMERGENCY', 'Emergency'),
    ]

    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='banana_assistance_requests')
    plantation = models.ForeignKey(BananaPlantation, on_delete=models.CASCADE, related_name='assistance_requests')
    disease_report = models.ForeignKey(BananaDiseaseReport, on_delete=models.SET_NULL, null=True, blank=True, related_name='assistance_requests')
    weather_report = models.ForeignKey(BananaWeatherReport, on_delete=models.SET_NULL, null=True, blank=True, related_name='assistance_requests')
    assigned_officer = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_banana_requests')
    subject = models.CharField(max_length=200)
    category = models.CharField(max_length=50, default='DISEASE_OUTBREAK')
    description = models.TextField()
    urgency = models.CharField(max_length=20, choices=URGENCY_CHOICES, default='NORMAL')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.status}] {self.subject} - {self.farmer}"


class BananaOfficerAdvice(models.Model):
    request = models.ForeignKey(BananaAssistanceRequest, on_delete=models.CASCADE, related_name='officer_advices')
    officer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='given_banana_advices')
    diagnosis = models.TextField()
    recommendations = models.TextField()
    recommended_products = models.TextField(blank=True, null=True)
    action_taken = models.TextField(blank=True, null=True)
    follow_up_date = models.DateField(blank=True, null=True)
    status_update = models.CharField(max_length=20, choices=BananaAssistanceRequest.STATUS_CHOICES, default='IN_PROGRESS')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Advice by {self.officer} on {self.request.subject}"


# ==========================================
# LIVESTOCK & ANIMAL MANAGEMENT MODULE
# ==========================================

class LivestockAnimal(models.Model):
    ANIMAL_TYPES = [
        ('cow', 'Cow'),
        ('goat', 'Goat'),
        ('sheep', 'Sheep'),
        ('pig', 'Pig'),
        ('chicken', 'Chicken'),
        ('rabbit', 'Rabbit'),
        ('other', 'Other Animal'),
    ]
    HEALTH_STATUS_CHOICES = [
        ('HEALTHY', 'Healthy'),
        ('SICK', 'Sick'),
        ('UNDER_TREATMENT', 'Under Treatment'),
        ('QUARANTINED', 'Quarantined'),
        ('DECEASED', 'Deceased'),
    ]
    GENDER_CHOICES = [
        ('female', 'Female'),
        ('male', 'Male'),
        ('group', 'Group / Flock'),
    ]

    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='livestock_animals')
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='livestock', null=True, blank=True)
    animal_type = models.CharField(max_length=30, choices=ANIMAL_TYPES, default='cow')
    tag_id = models.CharField(max_length=100, help_text="Animal Name or Tag ID")
    breed = models.CharField(max_length=100, blank=True, null=True)
    quantity = models.PositiveIntegerField(default=1)
    dob_or_age = models.CharField(max_length=50, blank=True, null=True, help_text="e.g. 2 years or 2024-05-10")
    gender = models.CharField(max_length=15, choices=GENDER_CHOICES, default='female')
    health_status = models.CharField(max_length=20, choices=HEALTH_STATUS_CHOICES, default='HEALTHY')
    registration_date = models.DateField(default=timezone.now)
    location = models.CharField(max_length=150, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    photo_url = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.tag_id} ({self.animal_type}) - {self.farmer.user.username}"


class AnimalDiseaseReport(models.Model):
    URGENCY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('EMERGENCY', 'Emergency'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('UNDER_REVIEW', 'Under Review'),
        ('ASSISTANCE_PROVIDED', 'Assistance Provided'),
        ('RESOLVED', 'Resolved'),
    ]

    report_number = models.CharField(max_length=50, unique=True)
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='animal_disease_reports')
    animal = models.ForeignKey(LivestockAnimal, on_delete=models.SET_NULL, null=True, blank=True, related_name='disease_reports')
    assigned_officer = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_disease_reports')
    animal_type = models.CharField(max_length=50)
    animal_tag_id = models.CharField(max_length=100)
    symptoms = models.TextField()
    problem_start_date = models.DateField()
    number_affected = models.PositiveIntegerField(default=1)
    description = models.TextField()
    evidence_url = models.CharField(max_length=500, blank=True, null=True)
    location = models.CharField(max_length=200)
    urgency_level = models.CharField(max_length=20, choices=URGENCY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING')
    veterinary_recommendation = models.TextField(blank=True, null=True)
    recommend_farm_visit = models.BooleanField(default=False)
    farm_visit_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.report_number}] {self.animal_type} - {self.urgency_level}"


class FeedShortageReport(models.Model):
    URGENCY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('EMERGENCY', 'Emergency'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('UNDER_REVIEW', 'Under Review'),
        ('ASSISTANCE_COORDINATED', 'Assistance Coordinated'),
        ('RESOLVED', 'Resolved'),
    ]

    report_number = models.CharField(max_length=50, unique=True)
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='feed_shortage_reports')
    assigned_officer = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_feed_shortages')
    animal_type = models.CharField(max_length=50)
    number_affected = models.PositiveIntegerField(default=1)
    feed_type_needed = models.CharField(max_length=100)
    description = models.TextField()
    estimated_quantity_required = models.CharField(max_length=100)
    shortage_start_date = models.DateField()
    location = models.CharField(max_length=200)
    evidence_url = models.CharField(max_length=500, blank=True, null=True)
    urgency_level = models.CharField(max_length=20, choices=URGENCY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING')
    officer_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.report_number}] Feed Shortage - {self.animal_type}"


class LivestockHealthRecord(models.Model):
    RECORD_TYPES = [
        ('VACCINATION', 'Vaccination'),
        ('VET_VISIT', 'Veterinary Visit'),
        ('TREATMENT', 'Prescribed Treatment'),
        ('FEEDING', 'Feeding Schedule'),
        ('BIRTH_DEATH', 'Birth or Death Event'),
        ('PURCHASE_SALE', 'Purchase or Sale'),
        ('PRODUCTION', 'Production (Milk, Eggs, etc.)'),
    ]

    animal = models.ForeignKey(LivestockAnimal, on_delete=models.CASCADE, related_name='health_records')
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='livestock_health_records')
    record_type = models.CharField(max_length=30, choices=RECORD_TYPES)
    date = models.DateField(default=timezone.now)
    title = models.CharField(max_length=200)
    details = models.TextField()
    veterinarian_name = models.CharField(max_length=100, blank=True, null=True)
    prescribed_medicine = models.CharField(max_length=200, blank=True, null=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    unit = models.CharField(max_length=30, blank=True, null=True)
    cost_rwf = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    next_due_date = models.DateField(blank=True, null=True)
    reminder_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.record_type}: {self.title} ({self.animal.tag_id})"


# ==========================================
# SALES & FINANCIAL RECORDS
# ==========================================

class Sale(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('MOBILE_MONEY', 'Mobile Money'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CREDIT', 'Credit'),
    ]
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='sales')
    crop_season = models.ForeignKey(CropSeason, on_delete=models.SET_NULL, blank=True, null=True, related_name='sales')
    buyer_name = models.CharField(max_length=200)
    quantity_kg = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=10, default='RWF')
    sale_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='CASH')
    payment_reference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='recorded_sales')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-sale_date', '-created_at']

    def __str__(self):
        return f"Sale of {self.quantity_kg} kg to {self.buyer_name}"


# ==========================================
# CROP PROBLEM REPORTS
# ==========================================

class CropProblemReport(models.Model):
    PROBLEM_TYPES = [
        ('PEST', 'Pest Infestation'),
        ('DISEASE', 'Disease'),
        ('WEED', 'Weed Pressure'),
        ('WATER', 'Water Shortage / Drought'),
        ('NUTRIENT', 'Nutrient Deficiency'),
        ('WEATHER', 'Weather Damage'),
        ('OTHER', 'Other'),
    ]
    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    STATUS_CHOICES = [
        ('REPORTED', 'Reported'),
        ('UNDER_REVIEW', 'Under Review'),
        ('ADVICE_GIVEN', 'Advice Given'),
        ('RESOLVED', 'Resolved'),
        ('ESCALATED', 'Escalated'),
    ]
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='crop_problem_reports')
    field = models.ForeignKey(Field, on_delete=models.SET_NULL, blank=True, null=True, related_name='problem_reports')
    crop_season = models.ForeignKey(CropSeason, on_delete=models.SET_NULL, blank=True, null=True, related_name='problem_reports')
    problem_type = models.CharField(max_length=20, choices=PROBLEM_TYPES, default='OTHER')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='MEDIUM')
    description = models.TextField()
    affected_area_hectares = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)], blank=True, null=True)
    photos = models.JSONField(default=list, blank=True)
    reported_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REPORTED')
    assigned_officer = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='assigned_crop_problems')
    officer_advice = models.TextField(blank=True, null=True)
    resolution_notes = models.TextField(blank=True, null=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    reported_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='reported_crop_problems')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-reported_date', '-created_at']

    def __str__(self):
        return f"[{self.problem_type}] {self.severity} - {self.field}"


# ==========================================
# WATER / IRRIGATION RECORDS
# ==========================================

class WaterRecord(models.Model):
    WATER_CONDITION_CHOICES = [
        ('FLOODED', 'Flooded'),
        ('SATURATED', 'Saturated'),
        ('MOIST', 'Moist'),
        ('DRY', 'Dry'),
        ('DRAINED', 'Drained'),
    ]
    crop_season = models.ForeignKey(CropSeason, on_delete=models.CASCADE, related_name='water_records')
    record_date = models.DateField(default=timezone.now)
    water_depth_cm = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)], blank=True, null=True)
    water_condition = models.CharField(max_length=20, choices=WATER_CONDITION_CHOICES, default='MOIST')
    notes = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='recorded_water_records')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-record_date', '-created_at']

    def __str__(self):
        return f"Water record {self.water_condition} on {self.record_date}"


# ==============================================================
# 12. OFFICER-GENERATED ATTENDANCE & ADMINISTRATOR MODIFICATION
# ==============================================================

class Meeting(models.Model):
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('REGISTER_GENERATED', 'Register Generated'),
        ('IN_PROGRESS', 'In Progress'),
        ('FINALIZED', 'Finalized'),
        ('CANCELLED', 'Cancelled'),
    ]
    CATEGORY_CHOICES = [
        ('SEASON_PREPARATION', 'Season Preparation & Planning'),
        ('INPUT_DISTRIBUTION', 'Input Distribution & Subsidies'),
        ('PEST_DISEASE_TRAINING', 'Pest & Disease Management Training'),
        ('IRRIGATION_WATER', 'Irrigation & Water Management'),
        ('COOPERATIVE_GENERAL', 'Cooperative General Assembly'),
        ('HARVEST_POSTHARVEST', 'Harvest & Post-Harvest Handling'),
        ('OTHER', 'General Farmer Meeting'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    meeting_date = models.DateField()
    start_time = models.CharField(max_length=20, default='09:00')
    end_time = models.CharField(max_length=20, blank=True, default='11:30')
    venue = models.CharField(max_length=200)
    district = models.CharField(max_length=100, blank=True, default='')
    sector = models.CharField(max_length=100, blank=True, default='')
    agenda = models.TextField(blank=True, default='')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='SEASON_PREPARATION')
    created_by_officer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='created_meetings')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='SCHEDULED')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-meeting_date', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.meeting_date})"


class MeetingSubmission(models.Model):
    """Committed meeting response used to safely repeat a timed-out submission."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    key = models.UUIDField()
    request_hash = models.CharField(max_length=64)
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE)
    response = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['user', 'key'], name='unique_meeting_submission')]


class MeetingInvitation(models.Model):
    INVITATION_STATUS_CHOICES = [
        ('INVITED', 'Invited'),
        ('ACCEPTED', 'Accepted'),
        ('DECLINED', 'Declined'),
        ('TENTATIVE', 'Tentative'),
    ]

    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='invitations')
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='meeting_invitations')
    invited_at = models.DateTimeField(auto_now_add=True)
    invitation_status = models.CharField(max_length=20, choices=INVITATION_STATUS_CHOICES, default='INVITED')
    notes = models.TextField(blank=True, default='')

    class Meta:
        unique_together = ('meeting', 'farmer')
        ordering = ['farmer__user__first_name', 'farmer__user__last_name']

    def __str__(self):
        return f"{self.farmer.user.get_full_name() or self.farmer.user.username} invited to {self.meeting.title}"


class MeetingAttendanceRegister(models.Model):
    meeting = models.OneToOneField(Meeting, on_delete=models.CASCADE, related_name='attendance_register')
    generated_by_officer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='generated_attendance_registers')
    generated_at = models.DateTimeField(auto_now_add=True)
    is_finalized = models.BooleanField(default=False)
    finalized_at = models.DateTimeField(blank=True, null=True)
    finalized_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='finalized_attendance_registers')
    notes = models.TextField(blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f"Register for {self.meeting.title} (by {self.generated_by_officer.user.username})"


class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('EXCUSED', 'Excused'),
        ('UNRECORDED', 'Unrecorded'),
    ]

    register = models.ForeignKey(MeetingAttendanceRegister, on_delete=models.CASCADE, related_name='records')
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='attendance_records')
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='attendance_records')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UNRECORDED')
    recorded_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='recorded_attendances')
    recorded_at = models.DateTimeField(blank=True, null=True)
    officer_remarks = models.TextField(blank=True, default='')
    last_modified_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='modified_attendances')
    last_modified_role = models.CharField(max_length=20, blank=True, default='')
    admin_remarks = models.TextField(blank=True, default='')
    is_modified_by_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('register', 'farmer')
        ordering = ['farmer__user__first_name', 'farmer__user__last_name']

    def __str__(self):
        return f"{self.farmer.user.username} - {self.status} at {self.meeting.title}"


class FarmerEvaluation(models.Model):
    """A farmer's independent, officer-attributed evaluation for a meeting."""
    attendance_record = models.OneToOneField(AttendanceRecord, on_delete=models.CASCADE, related_name='evaluation')
    attendance_marks = models.DecimalField(max_digits=6, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    attendance_max = models.DecimalField(max_digits=6, decimal_places=2, default=20, validators=[MinValueValidator(0)])
    participation_marks = models.DecimalField(max_digits=6, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    participation_max = models.DecimalField(max_digits=6, decimal_places=2, default=30, validators=[MinValueValidator(0)])
    activity_marks = models.DecimalField(max_digits=6, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    activity_max = models.DecimalField(max_digits=6, decimal_places=2, default=50, validators=[MinValueValidator(0)])
    practical_marks = models.DecimalField(max_digits=6, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    practical_max = models.DecimalField(max_digits=6, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    remarks = models.TextField(blank=True, default='')
    evaluated_by = models.ForeignKey(UserProfile, on_delete=models.PROTECT, related_name='farmer_evaluations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['attendance_record'], name='unique_meeting_farmer_evaluation')]


class AttendanceGradingRule(models.Model):
    """Editable grade thresholds maintained by administrators in Django admin."""
    label = models.CharField(max_length=40, unique=True)
    minimum_percent = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)])
    maximum_percent = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)])
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order', '-minimum_percent']

    def __str__(self):
        return f"{self.label} ({self.minimum_percent}–{self.maximum_percent}%)"


class AttendanceModificationHistory(models.Model):
    attendance_record = models.ForeignKey(AttendanceRecord, on_delete=models.CASCADE, related_name='audit_history', blank=True, null=True)
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='attendance_audits')
    meeting_title = models.CharField(max_length=255)
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='attendance_audit_logs')
    farmer_name = models.CharField(max_length=255)
    farmer_registration_id = models.CharField(max_length=100, blank=True, default='')
    previous_status = models.CharField(max_length=30)
    new_status = models.CharField(max_length=30)
    modified_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='attendance_modifications_made')
    modifier_name = models.CharField(max_length=255)
    modifier_role = models.CharField(max_length=50, default='ADMIN')
    reason = models.TextField(blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Correction on {self.farmer_name} in {self.meeting_title}: {self.previous_status} -> {self.new_status} by {self.modifier_name}"
