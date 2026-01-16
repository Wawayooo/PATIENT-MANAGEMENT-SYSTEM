from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('logout/', views.logout_view, name='logout'),
    
    path('patients/add/', views.add_patient, name='add_patient'),
    path('complaints/add/', views.record_complaint, name='record_complaint'),
    path('patients/', views.list_patients, name='list_patients'),
    
    path('api/patients/<str:patient_id>/', views.verify_patient_api),
    
    path('patients/api/', views.get_patients_json, name='patients_api'),
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

