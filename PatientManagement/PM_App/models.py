from django.db import models

# Create your models here.

from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    fullname = models.CharField(max_length=255, null=True, blank=True, default="No name provided")
    profile_picture = models.ImageField(
        upload_to='profile_pics/',
        null=True,
        blank=True,
        default='static/img/default.png'
    )

    def __str__(self):
        return self.username

class Patient(models.Model):
    patient_id = models.CharField(max_length=20, unique=True, editable=False)
    firstname = models.CharField(max_length=100)
    middlename = models.CharField(max_length=100, null=True, blank=True)
    lastname = models.CharField(max_length=100)
    address = models.TextField()
    birthdate = models.DateField()
    age = models.IntegerField()
    gender = models.CharField(max_length=10)
    contact_number = models.CharField(max_length=15)
    blood_pressure = models.CharField(max_length=10, null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    height = models.FloatField(null=True, blank=True)
    
    profile_image = models.ImageField(blank=True, null=True, upload_to='patient_profiles/', default='static/img/default.png')

    def save(self, *args, **kwargs):
        if not self.patient_id:
            last_patient = Patient.objects.order_by('-id').first()
            next_number = (last_patient.id + 1) if last_patient else 1
            self.patient_id = f"PT-2026{str(next_number).zfill(4)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.firstname} {self.lastname} ({self.patient_id})"

class Complaint(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="complaints")
    chief_complaint = models.TextField()  # e.g., "Chest pain and shortness of breath"
    lab_examination = models.TextField(null=True, blank=True)  # e.g., "ECG, Chest X-Ray"
    test_result = models.TextField(null=True, blank=True)  # e.g., "ECG shows arrhythmia, X-Ray normal"
    final_diagnosis = models.TextField(null=True, blank=True)  # e.g., "Cardiac arrhythmia"
    treatment = models.TextField(null=True, blank=True)  # e.g., "Medication, lifestyle modification"
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Complaint for {self.patient.patient_id} - {self.chief_complaint}"

