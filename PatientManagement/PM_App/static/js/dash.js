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

function loadPatientTable() {
    fetch('/patients/api/')
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector('#patientTable tbody');
            tbody.innerHTML = ''; // clear old rows

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
                        <button onclick="showComplaints('${p.patient_id}')" class="btn-action btn-info">📄 Complaints</button>
                        <button onclick="updatePatient('${p.patient_id}')" class="btn-action btn-edit">✏️ Update</button>
                    </td>
                `;

                tbody.appendChild(tr);
            });

            // Initialize pagination or search if needed
            filteredData = Array.from(tbody.querySelectorAll('tr'));
            currentPage = 0;
            updatePagination();
            displayTablePage();
        })
        .catch(err => console.error('Failed to load patients:', err));
}

// Load table on page load
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
    // Hide all views
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected view
    const selectedView = document.getElementById(`${viewName}-view`);
    if (selectedView) {
        selectedView.classList.add('active');
    }
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`[data-view="${viewName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Update page title
    const titles = {
        'add-patient': 'Dashboard',
        'complaints': 'Patient Complaints',
        'list': 'Patient List'
    };
    document.getElementById('pageTitle').textContent = titles[viewName] || 'Dashboard';
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const burger = document.querySelector('.burger');
        sidebar.classList.add('hidden');
        burger.textContent = '☰';
    }
    
    // Initialize table if showing list view
    if (viewName === 'list') {
        initializeTable();
    }
}

// ===== DROPDOWN FUNCTIONS =====
function toggleDropdown() {
    const dropdown = document.getElementById('dropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('dropdown');
    const userMenu = document.querySelector('.user-menu');
    
    if (userMenu && !userMenu.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// ===== PROFILE FORM FUNCTIONS =====
function showProfileForm() {
    const modal = document.getElementById('profileModal');
    modal.classList.add('show');
    document.getElementById('dropdown').classList.remove('show');
}

function closeProfileForm() {
    const modal = document.getElementById('profileModal');
    modal.classList.remove('show');
}

// Close modal when clicking outside
document.getElementById('profileModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeProfileForm();
    }
});

// ===== IMAGE PREVIEW FUNCTIONS =====
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

// ===== AJAX SUBMIT FOR COMPLAINT FORM =====
document.getElementById('complaintForm').addEventListener('submit', function(e) {
    showLoading();
    e.preventDefault();

    const form = this;
    const formData = new FormData(form);

    // Add the verified patient ID from the input
    const patientIdInput = document.getElementById('verifyPatientId');
    if (!patientIdInput.value.trim()) {
        showNotification('Please enter a Patient ID first', 'error');
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
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification('Complaint recorded successfully!', 'success');
            
            // Optional: reset form after submission
            form.reset();
            document.getElementById('complaintPatientPreview').src = '/static/images/default-avatar.png';
        } else {
            showNotification(data.error || 'Failed to save complaint', 'error');
        }
        hideLoading();
        loadPatientTable();
    })
    .catch(err => {
        console.error(err);
        showNotification('Error saving complaint', 'error');
    });
});

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
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
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#87CEEB'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== TABLE FUNCTIONS =====
function initializeTable() {
    const table = document.getElementById('patientTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Store original data
    filteredData = rows;
    
    // Update pagination
    updatePagination();
    displayTablePage();
}

function searchTable() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const table = document.getElementById('patientTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Filter rows
    filteredData = rows.filter(row => {
        const text = row.textContent.toLowerCase();
        return text.includes(searchTerm);
    });
    
    // Reset to first page
    currentPage = 0;
    
    // Update display
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
    
    // Hide all rows
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    allRows.forEach(row => row.style.display = 'none');
    
    // Show current page rows
    const start = currentPage * entriesPerPage;
    const end = start + entriesPerPage;
    const pageRows = filteredData.slice(start, end);
    
    pageRows.forEach(row => row.style.display = '');
    
    // Update pagination info
    updatePaginationInfo();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const pageNumbers = document.getElementById('pageNumbers');
    
    if (!pageNumbers) return;
    
    pageNumbers.innerHTML = '';
    
    // Create page number buttons
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
    
    // Update active page number
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

function showComplaints(patientId) {
    showView('complaints');
    document.getElementById('verifyPatientId').value = patientId;
    verifyPatient();
}

// ===== UPDATE PATIENT FORM =====
function updatePatient(patientId) {
    showView('add-patient'); // Switch to Add Patient view

    // Find row by patient ID using data attributes
    const row = document.querySelector(`#patientTable tbody tr[data-patient-id="${patientId}"]`);
    if (!row) return;

    const form = document.getElementById('addPatientForm');

    // Fill the form using dataset
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

    // Update profile preview
    const preview = document.getElementById('patientPreview');
    if (preview && row.dataset.profileImage) {
        preview.src = row.dataset.profileImage;
    }

    showNotification('Editing patient record', 'info');
}

// ===== AJAX FORM SUBMIT =====
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

            // Check if patient already exists in table
            let row = tableBody.querySelector(`tr[data-patient-id="${patient.patient_id}"]`);

            if (row) {
                // Update existing row
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
                // Add new row
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

            // Reset form
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

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize table if on list view
    initializeTable();
    
    // Set initial responsive state
    handleResize();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key closes modals
        if (e.key === 'Escape') {
            closeProfileForm();
        }
    });
    
    // Smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Add loading animation to forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>⏳</span> Processing...';
                showLoading();
                
                // Re-enable after 2 seconds (for demo purposes)
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

// ===== UTILITY FUNCTIONS =====
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

// Auto-calculate age from birthdate
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

// Add CSS animations dynamically
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