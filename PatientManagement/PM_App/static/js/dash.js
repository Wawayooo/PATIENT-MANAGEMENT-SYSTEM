function showLoading() {
    document.getElementById("globalLoadingModal").style.display = "flex";
}

function hideLoading() {
    document.getElementById("globalLoadingModal").style.display = "none";
}

document.addEventListener("DOMContentLoaded", function() {
    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
        logoutLink.addEventListener("click", function(event) {
            event.preventDefault();
            if (confirm("“Sign out now? You’ll be redirected to the login page?”")) {
                showLoading();
                window.location.href = logoutLink.href;
            }
        });
    }
});

function deletePatient(patientId) {
    if (!confirm("Are you sure you want to delete this patient?")) {
        return;
    }

    showLoading();

    const formData = new FormData();
    formData.append("patient_id", patientId);

    fetch("/patients/delete/", {
        method: "POST",
        body: formData,
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value
        }
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`Server error: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        if (data.status === "success") {
            showNotification(data.message, "success");

            const row = document.querySelector(`tr[data-patient-id="${patientId}"]`);
            if (row) {
                row.remove();
            }
        } else {
            showNotification(data.message || "Failed to delete patient", "error");
        }
    })
    .catch(err => {
        console.error(err);
        showNotification("Error deleting patient", "error");
    })
    .finally(() => {
        hideLoading();
    });
}

function loadPatientTable() {
    fetch('/patients/api/')
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector('#patientTable tbody');
            tbody.innerHTML = '';

            data.patients.forEach(p => {
                const tr = document.createElement('tr');

                tr.dataset.patientId = p.patient_id;
                tr.dataset.firstname = p.firstname;
                tr.dataset.middlename = p.middlename || '';
                tr.dataset.lastname = p.lastname;
                tr.dataset.birthdate = p.birthdate;
                tr.dataset.age = p.age;
                tr.dataset.gender = p.gender;
                tr.dataset.address = p.address;
                tr.dataset.contactNumber = p.contact_number;
                tr.dataset.bloodPressure = p.blood_pressure;
                tr.dataset.weight = p.weight;
                tr.dataset.height = p.height;
                tr.dataset.profile = p.profile_image;

                tr.innerHTML = `
                    <td>${p.patient_id}</td>
                    <td>${p.contact_number}</td>
                    <td>${p.firstname} ${p.middlename || ''} ${p.lastname}</td>
                    <td>${p.birthdate}</td>
                    <td>${p.age}</td>
                    <td>${p.gender}</td>
                    <td>${p.address}</td>
                    <td>${p.blood_pressure}</td>
                    <td>${p.weight}</td>
                    <td>${p.height}</td>
                    <td class="action-buttons">
                        <button onclick="openComplaintsModal('${p.patient_id}')" class="btn-action btn-info">📄 Complaints</button>
                        <button onclick="update_this_Patient('${p.patient_id}')" class="btn-action btn-edit">✏️ Update</button>
                        <button onclick="deletePatient('${ p.patient_id }')" class="btn-action btn-delete">🗑️ Delete</button>
                    </td>
                `;

                tbody.appendChild(tr);
            });

            filteredData = Array.from(tbody.querySelectorAll('tr'));
            currentPage = 0;
            updatePagination();
            displayTablePage();
        })
        .catch(err => console.error('Failed to load patients:', err));
}

function update_this_Patient(patientId) {
    showLoading();
    fetch(`/patients/api/`)
    .then(res => res.json())
    .then(data => {
        const patient = data.patients.find(p => p.patient_id === patientId);
        if (!patient) {
            showNotification("Patient not found", "error");
            return;
        }

        document.getElementById("modal_patient_id").value = patient.patient_id;
        document.getElementById("modal_firstname").value = patient.firstname;
        document.getElementById("modal_middlename").value = patient.middlename || "";
        document.getElementById("modal_lastname").value = patient.lastname;
        document.getElementById("modal_contact_number").value = patient.contact_number;
        document.getElementById("modal_birthdate").value = patient.birthdate;
        document.getElementById("modal_age").value = patient.age;
        document.getElementById("modal_gender").value = patient.gender;
        document.getElementById("modal_address").value = patient.address;

        document.getElementById("modal_profile_preview").src = patient.profile_image;

        document.getElementById("patientModal").style.display = "flex";
    })
    .catch(err => {
        console.error(err);
        showNotification("Error loading patient data", "error");
    })
    .finally(() => {
        hideLoading();
    });
}

function previewProfileImage(event) {
    const reader = new FileReader();
    reader.onload = function(){
        document.getElementById("modal_profile_preview").src = reader.result;
    };
    reader.readAsDataURL(event.target.files[0]);
}

function submitPatientUpdate() {
    showLoading();
    const form = document.getElementById("updatePatientForm");
    const formData = new FormData(form);

    fetch(`/patients/update/`, {
        method: "POST",
        headers: {
            "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            showNotification("Patient updated successfully!", "success");
            closePatientModal();
        } else {
            showNotification(data.message || "Update failed", "error");
        }
    })
    .catch(err => {
        console.error(err);
        showNotification("Error updating patient", "error");
    })
    .finally(() => {
        hideLoading();
    });
}

function closePatientModal() {
    document.getElementById("patientModal").style.display = "none";
}

document.addEventListener('DOMContentLoaded', loadPatientTable);

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

let currentPage = 0;
let entriesPerPage = 10;
let filteredData = [];

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const burger = document.querySelector('.burger');
    
    sidebar.classList.toggle('hidden');
    burger.textContent = sidebar.classList.contains('hidden') ? '☰' : '✖';
}

function showView(viewName) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const selectedView = document.getElementById(`${viewName}-view`);
    if (selectedView) {
        selectedView.classList.add('active');
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`[data-view="${viewName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    const titles = {
        'add-patient': 'Dashboard',
        'complaints': 'Patient Complaints',
        'list': 'Patient List',
        'archived': 'Archived Complaints'
    };
    
    document.getElementById('pageTitle').textContent = titles[viewName] || 'Dashboard';
    
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const burger = document.querySelector('.burger');
        sidebar.classList.add('hidden');
        burger.textContent = '☰';
    }
    
    if (viewName === 'list') {
        initializeTable();
    }

    if (viewName === 'archived') {
        showArchived();
    }
}

function showArchived() {
    showLoading();

    fetch(`/archived/`, {
        method: "GET",
        headers: { "X-Requested-With": "XMLHttpRequest" }
    })
    .then(res => res.json())
    .then(data => {
        const archivedDiv = document.getElementById("archivedContent");
        archivedDiv.innerHTML = "";

        console.log("Archives array:", data.archives);

        if (!data.archives || data.archives.length === 0) {
            archivedDiv.innerHTML = "<p>No archived complaints available.</p>";
        } else {
            const list = document.createElement("ul");
            list.classList.add("archived-list");

            data.archives.forEach(a => {
                const item = document.createElement("li");
                item.innerHTML = `
                <div class="box_Holder">
                    <div class="patient_card">
                        <div class="img-card">
                            <img src="${a.profile_image || '/static/img/default.png'}" alt="Profile" class="profile-thumb">
                        </div>
                        <div class="info-box">
                            <h4>Patient: ${a.firstname} ${a.lastname} (${a.patient_id})</h4>
                            <p><em>Gender:</em> ${a.gender}, <em>Age:</em> ${a.age}</p>
                            <p><em>Address:</em> ${a.address}</p>
                        </div>
                    </div>
                    <div class="complaint-card">
                        <p>COMPLAINT: <strong style="color:#008080;">${a.chief_complaint}</strong></p>
                        <p>Lab: <strong style="color:#008080;">${a.lab_examination || "N/A"}</strong></p>
                        <p>Result: <strong style="color:#008080;">${a.test_result || "N/A"}</strong></p>
                        <p>Diagnosis: <strong style="color:#008080;">${a.final_diagnosis || "N/A"}</strong></p>
                        <p>Treatment: <strong style="color:#008080;">${a.treatment || "N/A"}</strong></p>
                        <p>Archived On: <strong style="color:#008080;">${new Date(a.date_created).toLocaleString()}</strong></p>
                        
                        <div class="action-btn">
                            <button onclick="exportArchivedToPDF(${a.id})" class="btn-action btn-info">📄 Export to PDF</button>
                            <button onclick="deleteArchived(${a.id})" class="btn-action btn-danger">🗑️ Delete</button>
                        </div>
                    </div>
                </div>
            `;

                list.appendChild(item);
            });

            archivedDiv.appendChild(list);
        }
    })
    .catch(err => {
        console.error(err);
        showNotification("Error loading archived complaints", "error");
    })
    .finally(() => {
        hideLoading();
    });
}

function deleteArchived(archiveId) {
    showLoading();

    fetch(`/archived/${archiveId}/delete/`, {
        method: "POST",
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            showNotification(data.message, "success");
            showArchived();
        } else {
            showNotification(data.message, "error");
        }
    })
    .catch(err => {
        console.error(err);
        showNotification("Error deleting archived complaint", "error");
    })
    .finally(() => {
        hideLoading();
    });
}

function toggleDropdown() {
    const dropdown = document.getElementById('dropdown');
    dropdown.classList.toggle('show');
}

document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('dropdown');
    const userMenu = document.querySelector('.user-menu');
    
    if (userMenu && !userMenu.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const updateBtn = document.getElementById("updateProfileBtn");
    const form = document.querySelector("form");

    if (updateBtn && form) {
        updateBtn.addEventListener("click", function(event) {
            const usernameField = document.querySelector('input[name="username"]');
            const passwordField = document.querySelector('input[name="password"]');

            const newUsername = usernameField.value.trim();
            const newPassword = passwordField.value.trim();

            const originalUsername = form.dataset.originalUsername || "";
            const originalPassword = form.dataset.originalPassword || "";

            const usernameChanged = newUsername !== originalUsername;
            const passwordChanged = newPassword !== "" && newPassword !== originalPassword;

            if (usernameChanged || passwordChanged) {
                const confirmLogout = confirm(
                    "Are you sure you want to update your profile?"
                );

                if (!confirmLogout) {
                    event.preventDefault(); 
                }
            }
        });
    }
});

function showProfileForm() {
    const modal = document.getElementById('profileModal');
    modal.classList.add('show');
    document.getElementById('dropdown').classList.remove('show');
}

function closeProfileForm() {
    const modal = document.getElementById('profileModal');
    modal.classList.remove('show');
}

document.getElementById('profileModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeProfileForm();
    }
});

function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const output = document.getElementById('profilePreview');
        if (output) {
            output.src = e.target.result;
        }
    };
    reader.readAsDataURL(file);
}

function previewPatientImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const output = document.getElementById('patientPreview');
        if (output) {
            output.src = e.target.result;
        }
    };
    reader.readAsDataURL(file);
}

async function verifyPatient() {
    const patientId = document.getElementById('verifyPatientId').value.trim();
    if (!patientId) {
        showNotification('Please enter a Patient ID', 'error');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`/api/patients/${patientId}/`);
        if (!response.ok) throw new Error();

        const data = await response.json();
        const p = data.patient;

        document.getElementById('complaintFirstname').value = p.firstname;
        document.getElementById('complaintMiddlename').value = p.middlename;
        document.getElementById('complaintLastname').value = p.lastname;
        document.getElementById('complaintAddress').value = p.address;
        document.getElementById('complaintBirthdate').value = p.birthdate;
        document.getElementById('complaintAge').value = p.age;
        document.getElementById('complaintGender').value = p.gender;
        document.getElementById('complaintContact').value = p.contact_number;
        document.getElementById('complaintBP').value = p.blood_pressure;
        document.getElementById('complaintWeight').value = p.weight;
        document.getElementById('complaintHeight').value = p.height;

        const img = document.getElementById('complaintPatientPreview');
        if (img && p.profile_image) img.src = p.profile_image;

        let hidden = document.querySelector('#complaintForm input[name="patient_id"]');
        if (!hidden) {
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = 'patient_id';
            document.getElementById('complaintForm').appendChild(hidden);
        }
        hidden.value = p.patient_id;

        showNotification('Patient verified successfully', 'success');

    } catch {
        resetComplaintForm();
        showNotification('Patient not found', 'error');
    } finally {
        hideLoading();
    }
}

function resetComplaintForm() {
    document.getElementById('complaintForm').reset();
    const img = document.getElementById('complaintPatientPreview');
    if (img) img.src = '/static/img/default.png';
}

document.getElementById('complaintForm').addEventListener('submit', function(e) {
    showLoading();
    e.preventDefault();

    const form = this;
    const formData = new FormData(form);

    const patientIdInput = document.getElementById('verifyPatientId');
    if (!patientIdInput.value.trim()) {
        showNotification('Please enter a Patient ID first', 'error');
        hideLoading();
        return;
    }
    formData.append('patient_id', patientIdInput.value.trim());

    fetch('/complaints/add/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`Server error: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        if (data.status === "success") {
            showNotification('Complaint recorded successfully!', 'success');
            
            form.reset();

            const previewImg = document.getElementById('complaintPatientPreview');
            if (previewImg) {
                previewImg.src = '/static/images/default-avatar.png';
            }
            
            loadPatientTable();
        } else {
            showNotification(data.error || 'Failed to save complaint', 'error');
        }
    })
    .catch(err => {
        console.error(err);
        showNotification('Error saving complaint', 'error');
    })
    .finally(() => {
        hideLoading();
    });
});

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '16px 24px',
        borderRadius: '12px',
        color: 'white',
        fontWeight: '600',
        zIndex: '9999',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        animation: 'slideIn 0.3s ease',
        maxWidth: '400px'
    });
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#87CEEB'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function initializeTable() {
    const table = document.getElementById('patientTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    filteredData = rows;
    
    updatePagination();
    displayTablePage();
}

function searchTable() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const table = document.getElementById('patientTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    filteredData = rows.filter(row => {
        const text = row.textContent.toLowerCase();
        return text.includes(searchTerm);
    });
    
    currentPage = 0;
    
    updatePagination();
    displayTablePage();
}

function changeEntries() {
    const select = document.getElementById('entriesSelect');
    entriesPerPage = parseInt(select.value);
    currentPage = 0;
    
    updatePagination();
    displayTablePage();
}

function displayTablePage() {
    const table = document.getElementById('patientTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    allRows.forEach(row => row.style.display = 'none');
    
    const start = currentPage * entriesPerPage;
    const end = start + entriesPerPage;
    const pageRows = filteredData.slice(start, end);
    
    pageRows.forEach(row => row.style.display = '');

    updatePaginationInfo();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const pageNumbers = document.getElementById('pageNumbers');
    
    if (!pageNumbers) return;
    
    pageNumbers.innerHTML = '';
    
    for (let i = 0; i < totalPages; i++) {
        const pageBtn = document.createElement('div');
        pageBtn.className = 'page-number';
        pageBtn.textContent = i + 1;
        
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            displayTablePage();
            updatePaginationButtons();
        });
        
        pageNumbers.appendChild(pageBtn);
    }
    
    updatePaginationButtons();
}

function updatePaginationButtons() {
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages - 1;
    }
    
    document.querySelectorAll('.page-number').forEach((btn, index) => {
        btn.classList.toggle('active', index === currentPage);
    });
}

function updatePaginationInfo() {
    const start = currentPage * entriesPerPage + 1;
    const end = Math.min((currentPage + 1) * entriesPerPage, filteredData.length);
    const total = filteredData.length;
    
    const startSpan = document.getElementById('showingStart');
    const endSpan = document.getElementById('showingEnd');
    const totalSpan = document.getElementById('totalEntries');
    
    if (startSpan) startSpan.textContent = filteredData.length > 0 ? start : 0;
    if (endSpan) endSpan.textContent = end;
    if (totalSpan) totalSpan.textContent = total;
}

function prevPage() {
    if (currentPage > 0) {
        currentPage--;
        displayTablePage();
        updatePaginationButtons();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    if (currentPage < totalPages - 1) {
        currentPage++;
        displayTablePage();
        updatePaginationButtons();
    }
}

function openComplaintsModal(patientId) {
    const modal = document.getElementById("complaintsModal");
    modal.style.display = "flex";
    showComplaints(patientId); 
}

function closeComplaintsModal() {
    const modal = document.getElementById("complaintsModal");
    modal.style.display = "none";
}

function showComplaints(patientId) {
    showLoading();

    fetch(`/patients/${patientId}/complaints/`, {
        method: "GET",
        headers: { "X-Requested-With": "XMLHttpRequest" }
    })
    .then(res => res.json())
    .then(data => {
        const complaintsDiv = document.getElementById("complaintsContent");
        complaintsDiv.innerHTML = "";
    
        const patientInfo = `
            <h4>Patient: ${data.patient.firstname} ${data.patient.lastname} (${data.patient.patient_id})</h4>
            <p><em>Gender:</em> ${data.patient.gender}, <em>Age:</em> ${data.patient.age}</p>
            <p><em>Address:</em> ${data.patient.address}</p>
            <hr>
        `;
        complaintsDiv.innerHTML = patientInfo;
    
        if (data.complaints.length === 0) {
            complaintsDiv.innerHTML += "<p>No complaints recorded for this patient.</p>";
        } else {
            const list = document.createElement("ul");
            list.classList.add("complaints-list");
    
            data.complaints.forEach(c => {
                const item = document.createElement("li");
                let actionButton = "";

                if (c.is_archived) {
                    actionButton = `<button onclick="exportComplaintToPDF(${c.id})" class="btn-action btn-info">📄 Export to PDF</button>`;
                } else {
                    actionButton = `<button id="archive-btn-${c.id}" onclick="archiveComplaint(${c.id})" class="btn-action btn-info">📦 Archive</button>`;
                }
                
                item.innerHTML = `
                    <p style="margin:6px 0; font-size:1rem; color:#222;">
                        Complaint: <strong style="color:#000;">${c.chief_complaint}</strong>
                    </p>
                    <p style="margin:6px 0; font-size:0.95rem; color:#444;">
                        Lab: <strong style="color:#000;">${c.lab_examination || "N/A"}</strong>
                    </p>
                    <p style="margin:6px 0; font-size:0.95rem; color:#444;">
                        Result: <strong style="color:#000;">${c.test_result || "N/A"}</strong>
                    </p>
                    <p style="margin:6px 0; font-size:0.95rem; color:#444;">
                        Diagnosis: <strong style="color:#000;">${c.final_diagnosis || "N/A"}</strong>
                    </p>
                    <p style="margin:6px 0; font-size:0.95rem; color:#444;">
                        Treatment: <strong style="color:#000;">${c.treatment || "N/A"}</strong>
                    </p>
                    <p style="margin:6px 0; font-size:0.85rem; color:#666;">
                        Date: <strong style="color:#000;">${new Date(c.date_created).toLocaleString()}</strong>
                    </p>
                    <div style="margin-top:8px; display: flex; flex-wrap: wrap; justify-content: center;">
                        <button onclick="editComplaint(${c.id})" 
                            style="background:#ffc107; color:#333; border:none; border-radius:4px; padding:6px 12px; margin-right:6px; cursor:pointer; width: 45%;">
                            ✏️ Edit
                        </button>
                        <button onclick="deleteComplaint(${c.id})" 
                            style="background:#dc3545; color:#fff; border:none; border-radius:4px; padding:6px 12px; margin-right:6px; cursor:pointer; width: 45%;">
                            🗑️ Delete
                        </button>
                        ${actionButton}
                    </div>
                `;

                list.appendChild(item);
            });
            
            complaintsDiv.appendChild(list);
        }
    })    
    .catch(err => {
        console.error(err);
        showNotification("Error loading complaints", "error");
    })
    .finally(() => {
        hideLoading();
    });
}

function exportComplaintToPDF(complaintId) {
    showLoading();
    
    fetch(`/complaints/${complaintId}/export/pdf/`, {
        method: "GET",
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    })
    .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `complaint_${complaintId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        showNotification("Complaint exported to PDF successfully!", "success");
    })
    .catch(err => {
        console.error(err);
        showNotification("Error exporting complaint to PDF", "error");
    })
    .finally(() => {
        hideLoading();
    });
}

function archiveComplaint(complaintId) {
    showLoading();

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    if (!csrfToken) {
        showNotification("CSRF token missing", "error");
        hideLoading();
        return;
    }

    const btn = document.getElementById(`archive-btn-${complaintId}`);
    if (btn) btn.disabled = true;

    fetch(`/complaints/${complaintId}/archive/`, {
        method: "POST",
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": csrfToken.value
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            showNotification("Complaint archived successfully!", "success");

            if (btn) {
                btn.disabled = false;
                btn.innerText = "📄 Export to PDF";
                btn.onclick = function() {
                    exportComplaintToPDF(complaintId);
                };
            }
        } else {
            showNotification(data.error || "Failed to archive complaint", "error");
            if (btn) btn.disabled = false;
        }
    })
    .catch(err => {
        console.error(err);
        showNotification("Error archiving complaint", "error");
        if (btn) btn.disabled = false;
    })
    .finally(() => {
        hideLoading();
    });
}

function exportArchivedToPDF(archiveId) {
    showLoading();

    fetch(`/archived/${archiveId}/export/pdf/`, {
        method: "GET",
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    })
    .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `archive_${archiveId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        showNotification("Archived complaint exported to PDF successfully!", "success");
    })
    .catch(err => {
        console.error(err);
        showNotification("Error exporting archived complaint to PDF", "error");
    })
    .finally(() => {
        hideLoading();
    });
}

function deleteArchived(archiveId) {
    if (!confirm("Are you sure you want to delete this archived complaint?")) return;

    showLoading();

    fetch(`/archived/${archiveId}/delete/`, {
        method: "POST",
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            showNotification(data.message, "success");
            showArchived();
        } else {
            showNotification(data.message || "Failed to delete archived complaint", "error");
        }
    })
    .catch(err => {
        console.error(err);
        showNotification("Error deleting archived complaint", "error");
    })
    .finally(() => {
        hideLoading();
    });
}

window.onclick = function(event) {
    const modal = document.getElementById("complaintsModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

function deleteComplaint(complaintId) {
    if (!confirm("Are you sure you want to delete this complaint?")) return;

    fetch(`/complaints/${complaintId}/delete/`, {
        method: "POST",
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            showNotification("Complaint deleted successfully!", "success");
            showComplaints(data.patient_id);
        } else {
            showNotification(data.error || "Failed to delete complaint", "error");
        }
    })
    .catch(err => {
        console.error(err);
        showNotification("Error deleting complaint", "error");
    });
}

function editComplaint(complaintId) {
    fetch(`/complaints/${complaintId}/json/`, {
        method: "GET",
        headers: { "X-Requested-With": "XMLHttpRequest" }
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("edit_complaint_id").value = data.id;
        document.getElementById("edit_chief_complaint").value = data.chief_complaint || "";
        document.getElementById("edit_lab_examination").value = data.lab_examination || "";
        document.getElementById("edit_test_result").value = data.test_result || "";
        document.getElementById("edit_final_diagnosis").value = data.final_diagnosis || "";
        document.getElementById("edit_treatment").value = data.treatment || "";

        document.getElementById("editComplaintModal").style.display = "flex";
        showNotification("Editing complaint record", "info");
    })
    .catch(err => {
        console.error(err);
        showNotification("Error loading complaint for edit", "error");
    });
}

function closeEditComplaintModal() {
    document.getElementById("editComplaintModal").style.display = "none";
}

document.getElementById("editComplaintForm").addEventListener("submit", function(e) {
    e.preventDefault();
    showLoading();

    const formData = new FormData(this);

    fetch("/complaints/update/", {
        method: "POST",
        body: formData,
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            showNotification("Complaint updated successfully!", "success");
            closeEditComplaintModal();
            showComplaints(data.patient_id);
        } else {
            showNotification(data.error || "Failed to update complaint", "error");
        }
    })
    .catch(err => {
        console.error(err);
        showNotification("Error updating complaint", "error");
    })
    .finally(() => {
        hideLoading();
    });
});

function exportComplaintsToPDF() {
    window.location.href = "/export/complaints/pdf/";
}

function updatePatient(patientId) {
    showView('add-patient');

    const row = document.querySelector(`#patientTable tbody tr[data-patient-id="${patientId}"]`);
    if (!row) return;

    const form = document.getElementById('addPatientForm');

    form.profile_image.value = row.dataset.profileImage;
    form.patient_id.value = row.dataset.patientId;
    form.firstname.value = row.dataset.firstname;
    form.middlename.value = row.dataset.middlename || '';
    form.lastname.value = row.dataset.lastname;
    form.birthdate.value = row.dataset.birthdate;
    form.age.value = row.dataset.age;
    form.gender.value = row.dataset.gender;
    form.address.value = row.dataset.address;
    form.contact_number.value = row.dataset.contactNumber;
    form.blood_pressure.value = row.dataset.bloodPressure;
    form.weight.value = row.dataset.weight;
    form.height.value = row.dataset.height;

    const preview = document.getElementById('patientPreview');
    if (preview && row.dataset.profileImage) {
        preview.src = row.dataset.profileImage;
    }

    showNotification('Editing patient record', 'info');
}

document.getElementById('addPatientForm').addEventListener('submit', function(e) {
    showLoading();

    e.preventDefault();

    const form = this;
    const formData = new FormData(form);

    fetch('/patients/add/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification('Patient saved successfully!', 'success');

            const patient = data.patient;
            const tableBody = document.querySelector('#patientTable tbody');

            let row = tableBody.querySelector(`tr[data-patient-id="${patient.patient_id}"]`);

            if (row) {
                row.dataset.firstname = patient.firstname;
                row.dataset.middlename = patient.middlename;
                row.dataset.lastname = patient.lastname;
                row.dataset.birthdate = patient.birthdate;
                row.dataset.age = patient.age;
                row.dataset.gender = patient.gender;
                row.dataset.address = patient.address;
                row.dataset.contactNumber = patient.contact_number;
                row.dataset.bloodPressure = patient.blood_pressure;
                row.dataset.weight = patient.weight;
                row.dataset.height = patient.height;
                row.dataset.profileImage = patient.profile_image;

                row.innerHTML = `
                    <td>${patient.patient_id}</td>
                    <td>${patient.contact_number}</td>
                    <td>${patient.firstname} ${patient.middlename || ''} ${patient.lastname}</td>
                    <td>${patient.birthdate}</td>
                    <td>${patient.age}</td>
                    <td>${patient.gender}</td>
                    <td>${patient.address}</td>
                    <td>${patient.blood_pressure || ''}</td>
                    <td>${patient.weight || ''}</td>
                    <td>${patient.height || ''}</td>
                    <td class="action-buttons">
                        <button onclick="showComplaints('${patient.patient_id}')" class="btn-action btn-info">📄 Complaints</button>
                        <button onclick="updatePatient('${patient.patient_id}')" class="btn-action btn-edit">✏️ Update</button>
                    </td>
                `;
            } else {
                const newRow = document.createElement('tr');
                newRow.dataset.patientId = patient.patient_id;
                newRow.dataset.firstname = patient.firstname;
                newRow.dataset.middlename = patient.middlename;
                newRow.dataset.lastname = patient.lastname;
                newRow.dataset.birthdate = patient.birthdate;
                newRow.dataset.age = patient.age;
                newRow.dataset.gender = patient.gender;
                newRow.dataset.address = patient.address;
                newRow.dataset.contactNumber = patient.contact_number;
                newRow.dataset.bloodPressure = patient.blood_pressure;
                newRow.dataset.weight = patient.weight;
                newRow.dataset.height = patient.height;
                newRow.dataset.profileImage = patient.profile_image;

                newRow.innerHTML = `
                    <td>${patient.patient_id}</td>
                    <td>${patient.contact_number}</td>
                    <td>${patient.firstname} ${patient.middlename || ''} ${patient.lastname}</td>
                    <td>${patient.birthdate}</td>
                    <td>${patient.age}</td>
                    <td>${patient.gender}</td>
                    <td>${patient.address}</td>
                    <td>${patient.blood_pressure || ''}</td>
                    <td>${patient.weight || ''}</td>
                    <td>${patient.height || ''}</td>
                    <td class="action-buttons">
                        <button onclick="showComplaints('${patient.patient_id}')" class="btn-action btn-info">📄 Complaints</button>
                        <button onclick="updatePatient('${patient.patient_id}')" class="btn-action btn-edit">✏️ Update</button>
                    </td>
                `;
                tableBody.appendChild(newRow);
            }

            form.reset();
            document.getElementById('patientPreview').src = '/static/img/default.png';
            hideLoading();
            loadPatientTable();
        }
    })
    .catch(err => {
        console.error(err);
        showNotification('Error saving patient', 'error');
    });
});


function handleResize() {
    if (window.innerWidth > 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('hidden');
            document.querySelector('.burger').textContent = '✖';
        }
    }
}

window.addEventListener('resize', handleResize);

document.addEventListener('DOMContentLoaded', function() {
    initializeTable();
    
    handleResize();
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeProfileForm();
        }
    });
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>⏳</span> Processing...';
                showLoading();
                
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>💾</span> Submit';
                    hideLoading();
                }, 2000);
            }
        });
    });
    
    console.log('Dashboard initialized successfully');
});

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function calculateAge(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

const birthdateInputs = document.querySelectorAll('input[name="birthdate"]');
birthdateInputs.forEach(input => {
    input.addEventListener('change', function() {
        const age = calculateAge(this.value);
        const ageInput = this.closest('form').querySelector('input[name="age"]');
        if (ageInput) {
            ageInput.value = age;
        }
    });
});

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);