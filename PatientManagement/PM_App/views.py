from django.shortcuts import render

# Create your views here.

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password

from django.shortcuts import render, redirect, get_object_or_404

from django.http import JsonResponse

from .models import *

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('dashboard')
        else:
            return render(request, 'login.html', {'error': 'Invalid credentials'})
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    return redirect('login')


@login_required
def dashboard_view(request):
    user = request.user
    if request.method == 'POST':
        username = request.POST.get('username')
        fullname = request.POST.get('fullname')
        password = request.POST.get('password')
        profile_picture = request.FILES.get('profile_picture')

        if username:
            user.username = username
        if fullname:
            user.fullname = fullname
        if password:
            user.password = make_password(password)
        if profile_picture:
            user.profile_picture = profile_picture

        user.save()
        return redirect('dashboard')

    return render(request, 'dashboard.html', {'user': user})

@login_required
def verify_patient_api(request, patient_id):
    try:
        patient = Patient.objects.get(patient_id=patient_id)
        return JsonResponse({
            "success": True,
            "patient": {
                "patient_id": patient.patient_id,
                "firstname": patient.firstname,
                "middlename": patient.middlename or "",
                "lastname": patient.lastname,
                "address": patient.address,
                "birthdate": patient.birthdate,
                "age": patient.age,
                "gender": patient.gender,
                "contact_number": patient.contact_number,
                "blood_pressure": patient.blood_pressure,
                "weight": patient.weight,
                "height": patient.height,
                "profile_image": patient.profile_image.url if patient.profile_image else ""
            }
        })
    except Patient.DoesNotExist:
        return JsonResponse({"success": False}, status=404)

@login_required
def add_patient(request):
    if request.method == 'POST':
        patient_id = request.POST.get('patient_id')

        # Update existing patient or create new
        patient, created = Patient.objects.update_or_create(
            patient_id=patient_id,
            defaults={
                'profile_image': request.FILES.get('profile_image'),
                'firstname': request.POST.get('firstname'),
                'middlename': request.POST.get('middlename'),
                'lastname': request.POST.get('lastname'),
                'address': request.POST.get('address'),
                'birthdate': request.POST.get('birthdate'),
                'age': request.POST.get('age'),
                'gender': request.POST.get('gender'),
                'contact_number': request.POST.get('contact_number'),
                'blood_pressure': request.POST.get('blood_pressure'),
                'weight': request.POST.get('weight'),
                'height': request.POST.get('height'),
            }
        )

        # If AJAX request, return JSON
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'patient': {
                    'patient_id': patient.patient_id,
                    'firstname': patient.firstname,
                    'middlename': patient.middlename,
                    'lastname': patient.lastname,
                    'contact_number': patient.contact_number,
                    'birthdate': str(patient.birthdate),
                    'age': patient.age,
                    'gender': patient.gender,
                    'address': patient.address,
                    'blood_pressure': patient.blood_pressure,
                    'weight': patient.weight,
                    'height': patient.height,
                    'profile_image': patient.profile_image.url if patient.profile_image else ''
                }
            })

        # Normal redirect for non-AJAX
        return redirect('list_patients')

    else:
        # Generate next patient ID
        last_patient = Patient.objects.order_by('-id').first()
        next_number = (last_patient.id + 1) if last_patient else 1
        next_id = f"PT-2026{str(next_number).zfill(4)}"
        return render(request, 'dashboard.html', {'next_id': next_id})

@login_required
def record_complaint(request):
    if request.method == 'POST':
        patient_id = request.POST.get('patient_id')
        patient = get_object_or_404(Patient, patient_id=patient_id)

        Complaint.objects.create(
            patient=patient,
            chief_complaint=request.POST.get('chief_complaint'),
            lab_examination=request.POST.get('lab_examination'),
            test_result=request.POST.get('test_result'),
            final_diagnosis=request.POST.get('final_diagnosis'),
            treatment=request.POST.get('treatment'),
        )
        return redirect('list_patients')
    return render(request, 'dashboard.html')

from django.http import JsonResponse

@login_required
def get_patients_json(request):
    patients = Patient.objects.all().values(
        'patient_id', 'firstname', 'middlename', 'lastname',
        'contact_number', 'birthdate', 'age', 'gender',
        'address', 'blood_pressure', 'weight', 'height',
        'profile_image'
    )
    
    # Convert QuerySet to list
    patient_list = list(patients)
    
    # Add profile URL if exists
    for p in patient_list:
        if p['profile_image']:
            p['profile_image'] = request.build_absolute_uri(p['profile_image'])
        else:
            p['profile_image'] = '/static/img/default.png'
    
    return JsonResponse({'patients': patient_list})


@login_required
def list_patients(request):
    patients = Patient.objects.all()
    return render(request, 'dashboard.html', {'patients': patients})
