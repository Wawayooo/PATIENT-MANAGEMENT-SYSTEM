from .models import *

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
from reportlab.lib.utils import ImageReader
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from datetime import datetime
import os

from django.conf import settings


class PatientFormPDFGenerator:
    PRIMARY_COLOR   = colors.HexColor("#0097A7")
    SECONDARY_COLOR = colors.HexColor("#1E3A8A")
    ACCENT_COLOR    = colors.HexColor("#DD0909")
    HEADER_BG       = colors.HexColor("#F9FAFB")
    ALT_ROW_BG      = colors.HexColor("#F3F4F6")
    BORDER_COLOR    = colors.HexColor("#36CFEE")
    TEXT_DARK       = colors.HexColor("#111827")
    TEXT_LIGHT      = colors.HexColor("#6B7280")

    def __init__(self, response, pagesize=A4):
        self.canvas = canvas.Canvas(response, pagesize=pagesize)
        self.width, self.height = pagesize
        self.margin = 15 * mm
        self.top_margin = 15 * mm
        self.bottom_margin = 25 * mm
        self.current_y = self.height - self.top_margin
        self.page_number = 1
        self.first_page = True
        
    def check_new_page(self, required_height):
        if self.current_y - required_height < self.bottom_margin:
            self.finish_page()
            self.start_new_page()
            return True
        return False
    
    def finish_page(self):
        self.draw_footer(self.page_number)
        self.canvas.showPage()
        self.page_number += 1
        
    def start_new_page(self):
        self.current_y = self.height - self.top_margin
        self.first_page = False
        
        self.canvas.setFillColor(self.PRIMARY_COLOR)
        self.canvas.setFont("Helvetica-Bold", 10)
        self.canvas.drawString(self.margin, self.current_y, "Crown Med Asia - Patient Medical Record (Continued)")
        
        self.canvas.setStrokeColor(self.ACCENT_COLOR)
        self.canvas.setLineWidth(1)
        self.canvas.line(self.margin, self.current_y - 3 * mm,
                        self.width - self.margin, self.current_y - 3 * mm)
        
        self.current_y -= 10 * mm
        
    def draw_header(self, hospital_name="Medical Center", hospital_logo_path=None):
        header_height = 30 * mm
        header_y = self.height - header_height

        self.canvas.setFillColor(self.PRIMARY_COLOR)
        self.canvas.rect(0, header_y, self.width, header_height, fill=True, stroke=False)

        center_y = header_y + header_height / 2

        logo_width = 22 * mm
        logo_height = 22 * mm
        if hospital_logo_path and os.path.exists(hospital_logo_path):
            try:
                img = ImageReader(hospital_logo_path)
                self.canvas.drawImage(
                    img,
                    self.margin,
                    center_y - (logo_height / 2),
                    width=logo_width,
                    height=logo_height,
                    preserveAspectRatio=True,
                    mask='auto'
                )
            except:
                pass

        text_x = self.margin + logo_width + 10 * mm
        self.canvas.setFillColor(colors.white)

        self.canvas.setFont("Helvetica-Bold", 18)
        self.canvas.drawString(text_x, center_y + 5, hospital_name)

        self.canvas.setFont("Helvetica", 11)
        self.canvas.drawString(text_x, center_y - 10, "Patient Medical Record")

        self.canvas.setStrokeColor(self.ACCENT_COLOR)
        self.canvas.setLineWidth(1.5)
        self.canvas.line(self.margin, header_y - 2,
                        self.width - self.margin, header_y - 2)

        self.current_y = header_y - 8 * mm
        
    def draw_patient_info_header(self, photo_path=None, patient_name="", patient_id=""):
        photo_size = 40 * mm
        required_height = photo_size + 12 * mm
        
        self.check_new_page(required_height)
        
        y = self.current_y - photo_size

        photo_x = self.width - self.margin - photo_size
        self.canvas.setFillColor(self.HEADER_BG)
        self.canvas.setStrokeColor(self.BORDER_COLOR)
        self.canvas.setLineWidth(1)
        self.canvas.roundRect(photo_x, y, photo_size, photo_size, 3 * mm, fill=True, stroke=True)

        if photo_path and os.path.exists(photo_path):
            try:
                img = ImageReader(photo_path)
                self.canvas.drawImage(
                    img,
                    photo_x + 2 * mm,
                    y + 2 * mm,
                    width=photo_size - 4 * mm,
                    height=photo_size - 4 * mm,
                    preserveAspectRatio=True,
                    mask='auto'
                )
            except:
                self._draw_photo_placeholder(photo_x, y, photo_size, patient_name)
        else:
            self._draw_photo_placeholder(photo_x, y, photo_size, patient_name)

        info_x = self.margin
        center_y = y + (photo_size / 2)

        self.canvas.setFillColor(self.TEXT_DARK)
        self.canvas.setFont("Helvetica-Bold", 20)
        self.canvas.drawString(info_x, center_y + 6, patient_name)

        self.canvas.setFont("Helvetica", 14)
        self.canvas.setFillColor(self.TEXT_LIGHT)
        self.canvas.drawString(info_x, center_y - 10, f"Patient ID: {patient_id}")

        self.current_y = y - 12 * mm

    def _draw_photo_placeholder(self, x, y, size, name):
        self.canvas.setFillColor(self.SECONDARY_COLOR)
        center_x = x + size / 2
        center_y = y + size / 2
        
        self.canvas.circle(center_x, center_y + 5 * mm, 12 * mm, fill=True, stroke=False)
        
        initials = ''.join([word[0].upper() for word in name.split()[:2]])
        self.canvas.setFillColor(colors.white)
        self.canvas.setFont("Helvetica-Bold", 20)
        text_width = self.canvas.stringWidth(initials, "Helvetica-Bold", 20)
        self.canvas.drawString(center_x - text_width / 2, center_y + 2 * mm, initials)
        
    def draw_section_header(self, title, icon=None):
        required_height = 18 * mm
        self.check_new_page(required_height)
        
        self.current_y -= 8 * mm
        
        self.canvas.setFillColor(self.HEADER_BG)
        self.canvas.roundRect(self.margin, self.current_y - 7 * mm, 
                             self.width - 2 * self.margin, 7 * mm, 
                             2 * mm, fill=True, stroke=False)
        
        self.canvas.setFillColor(self.PRIMARY_COLOR)
        self.canvas.setFont("Helvetica-Bold", 12)
        self.canvas.drawString(self.margin + 3 * mm, self.current_y - 5 * mm, title)
        
        self.current_y -= 10 * mm
        
    def draw_info_table(self, data, col_widths=None, wrap_col=None):
        if not col_widths:
            col_widths = [(self.width - 2 * self.margin) / 2] * 2
        
        if wrap_col is not None:
            from reportlab.platypus import Paragraph
            from reportlab.lib.styles import getSampleStyleSheet
            styles = getSampleStyleSheet()
            style = styles['Normal']
            style.fontSize = 9
            style.fontName = 'Helvetica'
            
            processed_data = []
            for i, row in enumerate(data):
                new_row = list(row)
                for col_idx in (wrap_col if isinstance(wrap_col, list) else [wrap_col]):
                    if col_idx < len(new_row) and i > 0:
                        new_row[col_idx] = Paragraph(str(new_row[col_idx]), style)
                processed_data.append(new_row)
            data = processed_data
        
        header = data[0]
        body_rows = data[1:]
        
        avg_row_height = 15 * mm 
        
        current_chunk = [header]
        
        for row in body_rows:
            temp_table = Table(current_chunk + [row], colWidths=col_widths)
            temp_table.setStyle(self._get_table_style(len(current_chunk)))
            
            table_width, table_height = temp_table.wrap(self.width - 2 * self.margin, self.height)
            
            if self.current_y - table_height < self.bottom_margin and len(current_chunk) > 1:
                self._draw_table_chunk(current_chunk, col_widths)
                current_chunk = [header, row]
            else:
                current_chunk.append(row)
        
        if len(current_chunk) > 1:
            self._draw_table_chunk(current_chunk, col_widths)
    
    def _draw_table_chunk(self, data, col_widths):
        table = Table(data, colWidths=col_widths)
        table.setStyle(self._get_table_style(len(data)))
        
        table_width, table_height = table.wrap(self.width - 2 * self.margin, self.height)
        
        if self.check_new_page(table_height + 5 * mm):
            pass
        
        table.drawOn(self.canvas, self.margin, self.current_y - table_height)
        self.current_y -= (table_height + 5 * mm)
    
    def _get_table_style(self, num_rows):
        return TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.PRIMARY_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 10),
            ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
            ('PADDING', (0, 0), (-1, 0), 8),
            ('FONT', (0, 1), (-1, -1), 'Helvetica', 9),
            ('TEXTCOLOR', (0, 1), (-1, -1), self.TEXT_DARK),
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('PADDING', (0, 1), (-1, -1), 6),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, self.ALT_ROW_BG]),
            ('GRID', (0, 0), (-1, -1), 0.5, self.BORDER_COLOR),
            ('BOX', (0, 0), (-1, -1), 1, self.BORDER_COLOR),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ])
        
    def draw_text_area(self, title, content, height=30 * mm):
        title_height = 5 * mm
        total_height = title_height + height + 5 * mm
        
        self.check_new_page(total_height)
        
        self.canvas.setFillColor(self.TEXT_DARK)
        self.canvas.setFont("Helvetica-Bold", 10)
        self.canvas.drawString(self.margin, self.current_y, title)
        self.current_y -= title_height
        
        self.canvas.setFillColor(colors.white)
        self.canvas.setStrokeColor(self.BORDER_COLOR)
        self.canvas.setLineWidth(1)
        self.canvas.roundRect(self.margin, self.current_y - height, 
                             self.width - 2 * self.margin, height, 
                             2 * mm, fill=True, stroke=True)
        
        self.canvas.setFillColor(self.TEXT_DARK)
        self.canvas.setFont("Helvetica", 9)
        
        max_width = self.width - 2 * self.margin - 10 * mm
        words = content.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            if self.canvas.stringWidth(test_line, "Helvetica", 9) <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
        
        if current_line:
            lines.append(' '.join(current_line))
        
        text_y = self.current_y - 8 * mm
        for line in lines[:int(height / (4 * mm))]:
            self.canvas.drawString(self.margin + 5 * mm, text_y, line)
            text_y -= 4 * mm
            
        self.current_y -= (height + 5 * mm)
        
    def draw_footer(self, page_num):
        footer_y = 15 * mm
        
        self.canvas.setStrokeColor(self.BORDER_COLOR)
        self.canvas.setLineWidth(0.5)
        self.canvas.line(self.margin, footer_y + 10 * mm, 
                        self.width - self.margin, footer_y + 10 * mm)
        
        self.canvas.setFillColor(self.TEXT_LIGHT)
        self.canvas.setFont("Helvetica", 7)
        disclaimer = "CONFIDENTIAL MEDICAL RECORD - For authorized personnel only. Unauthorized access or disclosure is prohibited."
        self.canvas.drawCentredString(self.width / 2, footer_y + 6 * mm, disclaimer)
        
        self.canvas.setFont("Helvetica", 8)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.canvas.drawString(self.margin, footer_y, f"Page {page_num}")
        self.canvas.drawRightString(self.width - self.margin, footer_y, 
                                   f"Generated: {timestamp}")


def export_archived_pdf(request, archive_id):
    archive = get_object_or_404(PatientComplaintArchive, pk=archive_id)
    
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="patient_archive_{archive_id}.pdf"'
    
    pdf = PatientFormPDFGenerator(response)
    
    pdf.draw_header(
        "Crown Med Asia",
        hospital_logo_path=r"C:\Users\buddy\OneDrive\Desktop\JAY-AR\PatientManagement\PM_App\Logo.png"
    )
    
    patient_full_name = f"{archive.firstname} {archive.middlename or ''} {archive.lastname}".strip().replace('  ', ' ')
    
    photo_path = None
    if archive.profile_image:
        photo_path = os.path.join(settings.BASE_DIR, archive.profile_image.lstrip("/"))
    
    pdf.draw_patient_info_header(
        patient_name=patient_full_name,
        patient_id=str(archive.patient_id),
        photo_path=photo_path
    )
    
    pdf.draw_section_header("Personal Information")
    personal_data = [
        ['Field', 'Value'],
        ['Date of Birth', str(archive.birthdate)],
        ['Age', str(archive.age)],
        ['Gender', archive.gender],
        ['Contact Number', archive.contact_number],
        ['Address', archive.address],
    ]
    pdf.draw_info_table(personal_data)
    
    pdf.draw_section_header("Medical Information")
    medical_data = [
        ['Parameter', 'Value'],
        ['Blood Pressure', archive.blood_pressure or 'N/A'],
        ['Weight', f"{archive.weight} kg" if archive.weight else 'N/A'],
        ['Height', f"{archive.height} cm" if archive.height else 'N/A'],
    ]
    pdf.draw_info_table(medical_data)
    
    pdf.draw_section_header("Complaint Details")
    complaint_data = [
        ['Field', 'Information'],
        ['Chief Complaint', archive.chief_complaint],
        ['Lab Examination', archive.lab_examination or 'N/A'],
        ['Test Result', archive.test_result or 'N/A'],
        ['Final Diagnosis', archive.final_diagnosis or 'N/A'],
        ['Treatment', archive.treatment or 'N/A'],
    ]
    pdf.draw_info_table(complaint_data, wrap_col=1)
    
    pdf.finish_page()
    pdf.canvas.save()
    
    return response


def export_complaint_pdf(request, complaint_id):
    complaint = get_object_or_404(Complaint, pk=complaint_id)
    patient = complaint.patient
    
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="patient_complaint_{complaint_id}.pdf"'
    
    pdf = PatientFormPDFGenerator(response)
    
    pdf.draw_header(
        "Crown Med Asia",
        hospital_logo_path=r"C:\Users\buddy\OneDrive\Desktop\JAY-AR\PatientManagement\PM_App\Logo.png"
    )
    
    patient_full_name = f"{patient.firstname} {patient.middlename or ''} {patient.lastname}".strip().replace('  ', ' ')
    
    photo_path = None
    if patient.profile_image:
        photo_path = patient.profile_image.path
    
    pdf.draw_patient_info_header(
        patient_name=patient_full_name,
        patient_id=str(patient.patient_id),
        photo_path=photo_path
    )
    
    pdf.draw_section_header("Personal Information")
    personal_data = [
        ['Field', 'Value'],
        ['Date of Birth', str(patient.birthdate)],
        ['Age', str(patient.age)],
        ['Gender', patient.gender],
        ['Contact Number', patient.contact_number],
        ['Address', patient.address],
    ]
    pdf.draw_info_table(personal_data)
    
    pdf.draw_section_header("Medical Information")
    medical_data = [
        ['Parameter', 'Value'],
        ['Blood Pressure', patient.blood_pressure or 'N/A'],
        ['Weight', f"{patient.weight} kg" if patient.weight else 'N/A'],
        ['Height', f"{patient.height} cm" if patient.height else 'N/A'],
    ]
    pdf.draw_info_table(medical_data)
    
    pdf.draw_section_header("Current Complaint")
    complaint_data = [
        ['Field', 'Information'],
        ['Chief Complaint', complaint.chief_complaint],
        ['Lab Examination', complaint.lab_examination or 'N/A'],
        ['Test Result', complaint.test_result or 'N/A'],
        ['Final Diagnosis', complaint.final_diagnosis or 'N/A'],
        ['Treatment', complaint.treatment or 'N/A'],
    ]
    pdf.draw_info_table(complaint_data, wrap_col=1)
    
    pdf.finish_page()
    pdf.canvas.save()
    
    return response