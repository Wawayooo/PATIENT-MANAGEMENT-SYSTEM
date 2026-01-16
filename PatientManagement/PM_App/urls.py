from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from . import views
from . import export_views

urlpatterns = [
    path('', views.login_view, name='login'),

    path('dashboard/', views.dashboard_view, name='dashboard'),

    path('logout/', views.logout_view, name='logout'),
    
    path('patients/add/', views.add_patient, name='add_patient'),

    path('complaints/add/', views.record_complaint, name='record_complaint'),

    path('patients/', views.list_patients, name='list_patients'),
    
    path('api/patients/<str:patient_id>/', views.verify_patient_api),
    
    path('patients/api/', views.get_patients_json, name='patients_api'),

    path("patients/delete/", views.delete_patient, name="delete_patient"),

    path("patients/<str:patient_id>/complaints/", views.get_complaints_json, name="get_complaints_json"),
    
    path("patients/update/", views.update_patient, name="update_patient"),

    path("complaints/<int:complaint_id>/delete/", views.delete_complaint, name="delete_complaint"),

    path("complaints/update/", views.update_complaint, name="update_complaint"),

    path("patients/<str:patient_id>/complaints/", views.get_complaints_json, name="get_complaints_json"),

    path("complaints/<int:complaint_id>/json/", views.get_complaint_json, name="get_complaint_json"),
    
    
    path("complaints/<int:complaint_id>/archive/", views.archive_complaint, name="archive_complaint"),

    path("archived/<int:archive_id>/delete/", views.delete_archived_complaint, name="delete_archived_complaint"),

    path("archived/", views.get_archived_complaints, name="get_archived_complaints"),

    path("complaints/<int:complaint_id>/export/pdf/", export_views.export_complaint_pdf, name="export_complaint_pdf"),
    path("archived/<int:archive_id>/export/pdf/", export_views.export_archived_pdf, name="export_archived_pdf"),
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


