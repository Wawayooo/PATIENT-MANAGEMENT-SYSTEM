from django.shortcuts import render

# Create your views here.

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password, check_password

from django.shortcuts import render, redirect, get_object_or_404

from django.http import JsonResponse

from django.views.decorators.http import require_POST

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

        credentials_changed = False

        if username and username != user.username:
            user.username = username
            credentials_changed = True

        if fullname and fullname != user.fullname:
            user.fullname = fullname

        if password and not check_password(password, user.password):
            user.set_password(password)
            credentials_changed = True

        if profile_picture:
            user.profile_picture = profile_picture

        user.save()

        if credentials_changed:
            logout(request)
            return redirect('login')

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

        return redirect('list_patients')

    else:
        last_patient = Patient.objects.order_by('-id').first()
        next_number = (last_patient.id + 1) if last_patient else 1
        next_id = f"PT-2026{str(next_number).zfill(4)}"
        return render(request, 'dashboard.html', {'next_id': next_id})

@login_required
def delete_patient(request):
    if request.method == "POST":
        patient_id = request.POST.get("patient_id")
        patient = get_object_or_404(Patient, patient_id=patient_id)
        patient.delete()
        return JsonResponse({"status": "success", "message": "Patient deleted successfully"})
    return JsonResponse({"status": "error", "message": "Invalid request"}, status=400)

@login_required
def record_complaint(request):
    if request.method == 'POST':
        patient_id = request.POST.get('patient_id')
        patient = get_object_or_404(Patient, patient_id=patient_id)

        complaint = Complaint.objects.create(
            patient=patient,
            chief_complaint=request.POST.get('chief_complaint'),
            lab_examination=request.POST.get('lab_examination'),
            test_result=request.POST.get('test_result'),
            final_diagnosis=request.POST.get('final_diagnosis'),
            treatment=request.POST.get('treatment'),
        )

        return JsonResponse({
            "status": "success",
            "complaint_id": complaint.id,
            "patient_id": patient.patient_id
        })
    return JsonResponse({"error": "Invalid request"}, status=400)

@login_required
def get_complaints_json(request, patient_id):
    patient = get_object_or_404(Patient, patient_id=patient_id)
    complaints = patient.complaints.all().values(
        "id", "chief_complaint", "lab_examination",
        "test_result", "final_diagnosis", "treatment", "date_created"
    )
    return JsonResponse({"complaints": list(complaints)})

@login_required
def get_patients_json(request):
    patients = Patient.objects.all()
    patient_list = []

    for p in patients:
        patient_list.append({
            "patient_id": p.patient_id,
            "firstname": p.firstname,
            "middlename": p.middlename,
            "lastname": p.lastname,
            "contact_number": p.contact_number,
            "birthdate": p.birthdate,
            "age": p.age,
            "gender": p.gender,
            "address": p.address,
            "blood_pressure": p.blood_pressure,
            "weight": p.weight,
            "height": p.height,
            "profile_image": request.build_absolute_uri(p.profile_image.url) if p.profile_image else "/static/img/default.png"
        })

    return JsonResponse({"patients": patient_list})

@login_required
@require_POST
def update_patient(request):
    patient_id = request.POST.get("patient_id")
    patient = get_object_or_404(Patient, patient_id=patient_id)

    patient.firstname = request.POST.get("firstname")
    patient.middlename = request.POST.get("middlename")
    patient.lastname = request.POST.get("lastname")
    patient.contact_number = request.POST.get("contact_number")
    patient.birthdate = request.POST.get("birthdate")
    patient.age = request.POST.get("age")
    patient.gender = request.POST.get("gender")
    patient.address = request.POST.get("address")

    if "profile_image" in request.FILES:
        patient.profile_image = request.FILES["profile_image"]

    patient.save()

    return JsonResponse({"status": "success", "message": "Patient updated successfully."})

@login_required
def list_patients(request):
    patients = Patient.objects.all()
    return render(request, 'dashboard.html', {'patients': patients})

@login_required
def record_complaint(request):
    if request.method == 'POST':
        patient_id = request.POST.get('patient_id')
        patient = get_object_or_404(Patient, patient_id=patient_id)

        complaint = Complaint.objects.create(
            patient=patient,
            chief_complaint=request.POST.get('chief_complaint'),
            lab_examination=request.POST.get('lab_examination'),
            test_result=request.POST.get('test_result'),
            final_diagnosis=request.POST.get('final_diagnosis'),
            treatment=request.POST.get('treatment'),
        )

        return JsonResponse({"status": "success", "complaint_id": complaint.id})
    return JsonResponse({"error": "Invalid request"}, status=400)

@login_required
def update_complaint(request):
    if request.method == "POST":
        complaint_id = request.POST.get("complaint_id")
        complaint = get_object_or_404(Complaint, id=complaint_id)

        complaint.chief_complaint = request.POST.get("chief_complaint")
        complaint.lab_examination = request.POST.get("lab_examination")
        complaint.test_result = request.POST.get("test_result")
        complaint.final_diagnosis = request.POST.get("final_diagnosis")
        complaint.treatment = request.POST.get("treatment")
        complaint.save()

        return JsonResponse({"status": "success", "patient_id": complaint.patient.patient_id})
    return JsonResponse({"error": "Invalid request"}, status=400)

@login_required
def delete_complaint(request, complaint_id):
    if request.method == "POST":
        complaint = get_object_or_404(Complaint, id=complaint_id)
        patient_id = complaint.patient.patient_id
        complaint.delete()
        return JsonResponse({"status": "success", "patient_id": patient_id})
    return JsonResponse({"error": "Invalid request"}, status=400)

@login_required
def get_complaints_json(request, patient_id):
    patient = get_object_or_404(Patient, patient_id=patient_id)
    complaints = patient.complaints.all()

    complaints_data = []
    for c in complaints:
        complaints_data.append({
            "id": c.id,
            "chief_complaint": c.chief_complaint,
            "lab_examination": c.lab_examination,
            "test_result": c.test_result,
            "final_diagnosis": c.final_diagnosis,
            "treatment": c.treatment,
            "date_created": c.date_created,
            "is_archived": hasattr(c, "archive"),
        })

    return JsonResponse({
        "patient": {
            "patient_id": patient.patient_id,
            "firstname": patient.firstname,
            "middlename": patient.middlename,
            "lastname": patient.lastname,
            "age": patient.age,
            "gender": patient.gender,
            "address": patient.address,
        },
        "complaints": complaints_data
    })

@login_required
def get_complaint_json(request, complaint_id):
    complaint = get_object_or_404(Complaint, id=complaint_id)
    return JsonResponse({
        "id": complaint.id,
        "chief_complaint": complaint.chief_complaint,
        "lab_examination": complaint.lab_examination,
        "test_result": complaint.test_result,
        "final_diagnosis": complaint.final_diagnosis,
        "treatment": complaint.treatment,
    })

@login_required
def archive_complaint(request, complaint_id):
    if request.method == "POST":
        complaint = get_object_or_404(Complaint, id=complaint_id)
        patient = complaint.patient

        PatientComplaintArchive.objects.create(
            complaint=complaint,
            patient_id=patient.patient_id,
            firstname=patient.firstname,
            middlename=patient.middlename,
            lastname=patient.lastname,
            address=patient.address,
            birthdate=patient.birthdate,
            age=patient.age,
            gender=patient.gender,
            contact_number=patient.contact_number,
            blood_pressure=patient.blood_pressure,
            weight=patient.weight,
            height=patient.height,
            profile_image=patient.profile_image.url if patient.profile_image else None,
            chief_complaint=complaint.chief_complaint,
            lab_examination=complaint.lab_examination,
            test_result=complaint.test_result,
            final_diagnosis=complaint.final_diagnosis,
            treatment=complaint.treatment,
        )

        return JsonResponse({"status": "success"})
    return JsonResponse({"error": "Invalid request"}, status=400)

@login_required
def get_archived_complaints(request):
    archives = PatientComplaintArchive.objects.all().order_by("-date_created")

    archives_data = []
    for a in archives:
        archives_data.append({
            "id": a.id,
            "complaint_id": a.complaint.id if a.complaint else None,
            "patient_id": a.patient_id,
            "firstname": a.firstname,
            "lastname": a.lastname,
            "gender": a.gender,
            "age": a.age,
            "address": a.address,
            "chief_complaint": a.chief_complaint,
            "lab_examination": a.lab_examination,
            "test_result": a.test_result,
            "final_diagnosis": a.final_diagnosis,
            "treatment": a.treatment,
            "date_created": a.date_created.isoformat(),
            "profile_image": a.profile_image if a.profile_image else None,
        })

    return JsonResponse({"archives": archives_data})

@login_required
@require_POST
def delete_archived_complaint(request, archive_id):
    archive = get_object_or_404(PatientComplaintArchive, pk=archive_id)
    archive.delete()
    return JsonResponse({
        "status": "success",
        "message": f"Archived complaint {archive_id} deleted successfully."
    })