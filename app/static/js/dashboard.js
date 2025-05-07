// Initialize variables at the top
let currentPasswordId = null;
let shareModal;
let contextMenu;
let selectedRow = null;

// Function to copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showAlert('Copié dans le presse-papiers !', 'success');
    } catch (err) {
        console.error('Erreur lors de la copie:', err);
    }
}

// Function to share password
async function sharePassword(passwordId) {
    shareModal.show();
    currentPasswordId = passwordId;
}

// Function to confirm share
async function confirmShare() {
    try {
        const expirationDateTime = document.getElementById('expirationDateTime').value;
        if (!expirationDateTime) {
            showAlert('Veuillez sélectionner une date et heure d\'expiration', 'danger');
            return;
        }

        const maxViewsInput = document.getElementById('maxViews');
        const maxViews = maxViewsInput.value ? parseInt(maxViewsInput.value) : null;

        const response = await fetch(`/share_password/${currentPasswordId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({
                expires_at: expirationDateTime,
                max_views: maxViews
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors du partage');
        }

        const data = await response.json();

        // Update the share URL input
        document.getElementById('shareUrl').value = data.share_url;

        // Format the expiration date in Paris timezone
        const expiryDate = new Date(data.expires_at);
        document.getElementById('shareExpiry').textContent = expiryDate.toLocaleString('fr-FR', {
            timeZone: 'Europe/Paris',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        showAlert('Mot de passe partagé avec succès !', 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showAlert(error.message || 'Erreur lors du partage du mot de passe', 'danger');
    }
}

// Function to generate random password
function generateRandomPassword() {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}

// Function to toggle password visibility
function togglePasswordVisibility(input, button) {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    const icon = button.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

// Function to show alert
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}

// Icon grid functionality
let selectedIcon = 'fas fa-globe';
const icons = [
    'fas fa-globe', 'fas fa-user', 'fas fa-key', 'fas fa-credit-card',
    'fas fa-envelope', 'fas fa-lock', 'fas fa-shield-alt', 'fas fa-folder',
    'fas fa-heart', 'fas fa-camera', 'fas fa-music', 'fas fa-video',
    'fas fa-palette', 'fas fa-code', 'fas fa-database', 'fas fa-server',
    'fas fa-network-wired', 'fas fa-gamepad', 'fas fa-book', 'fas fa-newspaper',
    'fas fa-shopping-cart', 'fas fa-utensils', 'fas fa-car', 'fas fa-plane',
    'fas fa-train', 'fas fa-bus', 'fas fa-bicycle', 'fas fa-running',
    'fas fa-dumbbell', 'fas fa-swimming-pool', 'fas fa-hiking', 'fas fa-mountain',
    'fas fa-briefcase', 'fas fa-lightbulb', 'fas fa-cloud', 'fas fa-cogs',
    'fas fa-wrench', 'fas fa-bell', 'fas fa-comments', 'fas fa-gift',
    'fas fa-home', 'fas fa-building', 'fas fa-calendar-alt', 'fas fa-check-circle',
    'fas fa-exclamation-circle', 'fas fa-info-circle', 'fas fa-question-circle',
    'fas fa-search', 'fas fa-star', 'fas fa-tag', 'fas fa-thumbs-up',
    'fas fa-trash', 'fas fa-upload', 'fas fa-download', 'fas fa-wifi',
    'fas fa-paperclip', 'fas fa-map-marker-alt', 'fas fa-phone', 'fas fa-print',
    'fas fa-rocket', 'fas fa-trophy', 'fas fa-medkit', 'fas fa-flask',
    'fas fa-coffee', 'fas fa-tree', 'fas fa-fire', 'fas fa-sun',
    'fas fa-moon', 'fas fa-snowflake', 'fas fa-smile', 'fas fa-frown'
];

// Populate icon grid
function populateIconGrid(filter = '') {
    const iconGrid = document.getElementById('iconGrid');
    iconGrid.innerHTML = '';
    icons
        .filter(icon => icon.toLowerCase().includes(filter.toLowerCase()))
        .forEach(icon => {
            const col = document.createElement('div');
            col.className = 'col-3';
            col.innerHTML = `
                <div class="icon-item ${selectedIcon === icon ? 'selected' : ''}" data-icon="${icon}">
                    <i class="${icon}"></i>
                </div>
            `;
            iconGrid.appendChild(col);
        });

    // Add click handlers
    document.querySelectorAll('.icon-item').forEach(item => {
        item.addEventListener('click', () => {
            selectedIcon = item.dataset.icon;
            document.querySelectorAll('.icon-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
        });
    });
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize modals and other elements
    shareModal = new bootstrap.Modal(document.getElementById('sharePasswordModal'));
    contextMenu = document.getElementById('contextMenu');

    // Add right-click event listeners to table rows
    document.querySelectorAll('tbody tr').forEach(row => {
        row.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            selectedRow = this;
            currentPasswordId = this.querySelector('.view-password').dataset.id;

            // Position the context menu
            contextMenu.style.display = 'block';
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = e.pageY + 'px';
        });
    });

    // Add click event listener for context menu items
    contextMenu.addEventListener('click', async function (e) {
        const action = e.target.closest('.context-menu-item')?.dataset.action;
        if (!action || !selectedRow) return;

        try {
            const response = await fetch(`/get_password/${currentPasswordId}`);
            const data = await response.json();

            if (data.success) {
                if (action === 'copy-username') {
                    await copyToClipboard(data.password.username);
                } else if (action === 'copy-password') {
                    await copyToClipboard(data.password.password);
                } else if (action === 'copy-notes') {
                    await copyToClipboard(data.password.notes || '');
                } else if (action === 'share-password') {
                    await sharePassword(currentPasswordId);
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
        }

        contextMenu.style.display = 'none';
    });

    // Close context menu when clicking outside
    document.addEventListener('click', function (e) {
        if (!contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }
    });

    // Add event listener for confirm share button
    document.getElementById('confirmShare').addEventListener('click', confirmShare);

    // Add event listeners for password generation buttons
    document.getElementById('generatePassword').addEventListener('click', function () {
        document.getElementById('password').value = generateRandomPassword();
    });

    document.getElementById('generateEditPassword').addEventListener('click', function () {
        document.getElementById('edit_password').value = generateRandomPassword();
    });

    // Add event listener for search input
    document.getElementById('searchInput').addEventListener('keyup', function () {
        const searchText = this.value.toLowerCase();
        const rows = document.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const title = row.cells[0].textContent.toLowerCase();
            const username = row.cells[1].textContent.toLowerCase();
            const category = row.cells[2].textContent.toLowerCase();

            if (title.includes(searchText) || username.includes(searchText) || category.includes(searchText)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });

    // Add event listener for save password button
    document.getElementById('savePassword').addEventListener('click', function () {
        const form = document.getElementById('addPasswordForm');
        const formData = new FormData(form);

        fetch('/add_password', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Mot de passe ajouté avec succès', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    showAlert('Erreur lors de l\'ajout du mot de passe', 'danger');
                }
            });
    });

    // Add event listener for delete password buttons
    document.addEventListener('click', function (e) {
        if (e.target.closest('.delete-password')) {
            const button = e.target.closest('.delete-password');
            const id = button.dataset.id;

            if (confirm('Êtes-vous sûr de vouloir supprimer ce mot de passe ?')) {
                fetch(`/delete_password/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
                    }
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Remove the row from the table
                            const row = button.closest('tr');
                            row.remove();

                            // Show success alert
                            showAlert('Mot de passe supprimé avec succès', 'success');
                        } else {
                            showAlert('Erreur lors de la suppression du mot de passe', 'danger');
                        }
                    })
                    .catch(error => {
                        console.error('Erreur:', error);
                        showAlert('Erreur lors de la suppression du mot de passe', 'danger');
                    });
            }
        }
    });

    // Add event listeners for edit password buttons
    document.querySelectorAll('.edit-password').forEach(button => {
        button.addEventListener('click', function () {
            const id = this.dataset.id;
            // Get password data
            fetch(`/get_password/${id}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        document.getElementById('edit_id').value = data.password.id;
                        document.getElementById('edit_title').value = data.password.title;
                        document.getElementById('edit_username').value = data.password.username;
                        document.getElementById('edit_category').value = data.password.category || '';
                        document.getElementById('edit_notes').value = data.password.notes || '';

                        const editModal = new bootstrap.Modal(document.getElementById('editPasswordModal'));
                        editModal.show();
                    }
                });
        });
    });

    // Add event listener for update password button
    document.getElementById('updatePassword').addEventListener('click', function () {
        const form = document.getElementById('editPasswordForm');
        const formData = new FormData(form);

        fetch('/update_password', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Mot de passe mis à jour avec succès', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    showAlert('Erreur lors de la mise à jour du mot de passe', 'danger');
                }
            });
    });

    // Add event listeners for password visibility toggle buttons
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function () {
            const input = this.previousElementSibling;
            togglePasswordVisibility(input, this);
        });
    });

    // Add event listener for view password buttons
    document.addEventListener('click', function (e) {
        if (e.target.closest('.view-password')) {
            const button = e.target.closest('.view-password');
            const id = button.dataset.id;

            // Get password data
            fetch(`/get_password/${id}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        document.getElementById('view_title').textContent = data.password.title;
                        document.getElementById('view_username').textContent = data.password.username;
                        document.getElementById('view_password').value = data.password.password;
                        document.getElementById('view_category').textContent = data.password.category ? data.password.category.name : 'Non catégorisé';
                        document.getElementById('view_notes').textContent = data.password.notes || '';

                        const viewModal = new bootstrap.Modal(document.getElementById('viewPasswordModal'));
                        viewModal.show();
                    } else {
                        showAlert('Erreur lors de la récupération du mot de passe', 'danger');
                    }
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    showAlert('Erreur lors de la récupération du mot de passe', 'danger');
                });
        }
    });

    // Add event listener for category filter links
    document.querySelectorAll('.category-filter').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Update active class
            document.querySelectorAll('.category-filter').forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            const category = this.dataset.category;
            const rows = document.querySelectorAll('tbody tr');

            rows.forEach(row => {
                if (category === '' || row.dataset.category === category) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

    // Add event listener for copy share URL button
    document.getElementById('copyShareUrl').addEventListener('click', function () {
        const shareUrl = document.getElementById('shareUrl');
        shareUrl.select();
        document.execCommand('copy');

        // Show notification
        showAlert('Lien copié !', 'success');
    });

    // Category management
    // Add category button click handler
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    addCategoryBtn.addEventListener('click', function () {
        const categoryId = this.dataset.categoryId;
        if (categoryId) {
            updateCategory(categoryId);
        } else {
            addCategory();
        }
    });

    // Delete category
    document.addEventListener('click', async function (e) {
        if (e.target.closest('.delete-category')) {
            const categoryId = e.target.closest('.delete-category').dataset.categoryId;
            const categoryName = e.target.closest('.list-group-item').querySelector('div').textContent.trim();

            if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Les mots de passe de cette catégorie seront marqués comme non catégorisés.')) {
                return;
            }

            try {
                const response = await fetch(`/delete_category/${categoryId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
                    }
                });

                const data = await response.json();

                if (data.success) {
                    // Remove category from the sidebar list
                    const sidebarCategory = document.querySelector(`.sidebar .list-group a[href="/dashboard?category=${categoryId}"]`);
                    if (sidebarCategory) {
                        sidebarCategory.remove();
                    }

                    // Remove category from the categories list in the modal
                    const categoryElement = document.querySelector(`[data-category-id="${categoryId}"]`);
                    if (categoryElement) {
                        categoryElement.remove();
                    }

                    // Remove category from select elements
                    const selects = document.querySelectorAll('select[name="category_id"]');
                    selects.forEach(select => {
                        const option = select.querySelector(`option[value="${categoryId}"]`);
                        if (option) option.remove();
                    });

                    // Update passwords in the table that had this category
                    const rows = document.querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        const categoryCell = row.querySelector('td:nth-child(3) .badge');
                        if (categoryCell && categoryCell.textContent.trim() === categoryName) {
                            categoryCell.textContent = 'Non catégorisé';
                            categoryCell.classList.remove('bg-secondary');
                            categoryCell.classList.add('bg-secondary');
                            row.dataset.category = ''; // Update the row's data-category attribute
                        }
                    });

                    showAlert('Catégorie supprimée avec succès', 'success');
                } else {
                    throw new Error(data.error || 'Erreur lors de la suppression de la catégorie');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showAlert(error.message || 'Erreur lors de la suppression de la catégorie', 'danger');
            }
        }
    });

    // Add edit category functionality
    document.addEventListener('click', async function (e) {
        if (e.target.closest('.edit-category')) {
            const button = e.target.closest('.edit-category');
            const categoryId = button.dataset.categoryId;
            const categoryName = button.dataset.categoryName;
            const categoryIcon = button.dataset.categoryIcon;

            // Set the form values
            document.getElementById('categoryName').value = categoryName;
            selectedIcon = categoryIcon;
            populateIconGrid();

            // Change the add button to update
            const addButton = document.getElementById('addCategoryBtn');
            addButton.textContent = 'Mettre à jour';
            addButton.dataset.categoryId = categoryId;

            // Scroll to the form
            document.getElementById('categoryName').scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Add event listener for icon search
    const iconSearch = document.getElementById('iconSearch');
    iconSearch.addEventListener('input', (e) => {
        populateIconGrid(e.target.value);
    });

    // Initialize icon grid
    populateIconGrid();

    // Add event listeners for view history buttons
    document.querySelectorAll('.view-history').forEach(button => {
        button.addEventListener('click', function () {
            const passwordId = this.dataset.id;
            fetch(`/get_password_history/${passwordId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const tbody = document.getElementById('historyTableBody');
                        tbody.innerHTML = '';
                        data.history.forEach(entry => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${new Date(entry.modified_at).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</td>
                                <td>${entry.title}</td>
                                <td>${entry.username}</td>
                                <td><input type="password" class="form-control form-control-sm history-password" value="${entry.password}" readonly></td>
                                <td>${entry.category ? entry.category.name : 'Non catégorisé'}</td>
                                <td>${entry.notes || ''}</td>
                                <td>${entry.modified_by}</td>
                            `;
                            tbody.appendChild(row);
                        });

                        // Add event listener for the global toggle button
                        const toggleBtn = document.getElementById('toggleAllPasswords');
                        const passwordInputs = document.querySelectorAll('.history-password');
                        let allVisible = false;

                        toggleBtn.addEventListener('click', () => {
                            allVisible = !allVisible;
                            passwordInputs.forEach(input => {
                                input.type = allVisible ? 'text' : 'password';
                            });
                            toggleBtn.innerHTML = allVisible ?
                                '<i class="fas fa-eye-slash"></i>' :
                                '<i class="fas fa-eye"></i>';
                        });

                        const historyModal = new bootstrap.Modal(document.getElementById('historyModal'));
                        historyModal.show();
                    } else {
                        showAlert('Erreur lors de la récupération de l\'historique', 'danger');
                    }
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    showAlert('Erreur lors de la récupération de l\'historique', 'danger');
                });
        });
    });

    // Gestion de l'import/export
    const exportPasswordsBtn = document.getElementById('exportPasswords');
    const importPasswordsBtn = document.getElementById('importPasswords');
    const confirmActionBtn = document.getElementById('confirmAction');
    const importFileInput = document.getElementById('importFile');
    const passwordConfirmModal = document.getElementById('passwordConfirmModal');

    if (exportPasswordsBtn && passwordConfirmModal) {
        exportPasswordsBtn.addEventListener('click', () => {
            const actionTypeInput = document.getElementById('actionType');
            if (actionTypeInput) actionTypeInput.value = 'export';
            const modal = new bootstrap.Modal(passwordConfirmModal);
            modal.show();
        });
    }

    if (importPasswordsBtn && passwordConfirmModal) {
        importPasswordsBtn.addEventListener('click', () => {
            const actionTypeInput = document.getElementById('actionType');
            if (actionTypeInput) actionTypeInput.value = 'import';
            const modal = new bootstrap.Modal(passwordConfirmModal);
            modal.show();
        });
    }

    if (confirmActionBtn) {
        confirmActionBtn.addEventListener('click', async () => {
            const actionTypeInput = document.getElementById('actionType');
            const accountPasswordInput = document.getElementById('accountPassword');
            const passwordConfirmForm = document.getElementById('passwordConfirmForm');

            if (!actionTypeInput || !accountPasswordInput || !passwordConfirmForm) return;

            const actionType = actionTypeInput.value;
            const password = accountPasswordInput.value;
            const formData = new FormData(passwordConfirmForm);

            if (actionType === 'export') {
                try {
                    const response = await fetch('/export-passwords', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'passwords.enc';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);

                        // Fermer le modal
                        if (passwordConfirmModal) {
                            const modal = bootstrap.Modal.getInstance(passwordConfirmModal);
                            if (modal) modal.hide();
                        }
                        passwordConfirmForm.reset();
                    } else {
                        const data = await response.json();
                        showAlert(data.error || 'Erreur lors de l\'exportation', 'danger');
                    }
                } catch (error) {
                    console.error('Erreur:', error);
                    showAlert('Erreur lors de l\'exportation', 'danger');
                }
            } else if (actionType === 'import' && importFileInput) {
                importFileInput.click();
            }
        });
    }

    if (importFileInput) {
        importFileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const passwordConfirmForm = document.getElementById('passwordConfirmForm');
            if (!passwordConfirmForm) return;

            const formData = new FormData(passwordConfirmForm);
            formData.append('file', file);

            try {
                const response = await fetch('/import-passwords', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    showAlert(data.message || 'Import réussi', 'success');
                    window.location.reload();
                } else {
                    const data = await response.json();
                    showAlert(data.error || 'Erreur lors de l\'importation', 'danger');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showAlert('Erreur lors de l\'importation', 'danger');
            } finally {
                // Réinitialiser le formulaire et fermer le modal
                passwordConfirmForm.reset();
                importFileInput.value = '';
                if (passwordConfirmModal) {
                    const modal = bootstrap.Modal.getInstance(passwordConfirmModal);
                    if (modal) modal.hide();
                }
            }
        });
    }
});

// Function to update category
async function updateCategory(categoryId) {
    const name = document.getElementById('categoryName').value;

    if (!name) {
        showAlert('Veuillez entrer un nom de catégorie', 'danger');
        return;
    }

    try {
        const response = await fetch(`/update_category/${categoryId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({
                name: name,
                icon: selectedIcon
            })
        });

        const data = await response.json();

        if (data.success) {
            // Update the category in the sidebar
            const sidebarCategory = document.querySelector(`.sidebar .list-group a[href="/dashboard?category=${categoryId}"]`);
            if (sidebarCategory) {
                sidebarCategory.innerHTML = `
                    <span><i class="${selectedIcon} me-2"></i>${name}</span>
                    <span class="badge bg-primary rounded-pill">0</span>
                `;
            }

            // Update the category in the modal list
            const categoryElement = document.querySelector(`[data-category-id="${categoryId}"]`);
            if (categoryElement) {
                categoryElement.querySelector('div').innerHTML = `
                    <i class="${selectedIcon} me-2"></i>
                    ${name}
                `;
            }

            // Update the category in all select elements
            const selects = document.querySelectorAll('select[name="category_id"]');
            selects.forEach(select => {
                const option = select.querySelector(`option[value="${categoryId}"]`);
                if (option) {
                    option.innerHTML = `<i class="${selectedIcon}"></i> ${name}`;
                }
            });

            // Reset the form and button
            document.getElementById('categoryName').value = '';
            selectedIcon = 'fas fa-globe';
            populateIconGrid();

            const addButton = document.getElementById('addCategoryBtn');
            addButton.textContent = 'Ajouter';
            addButton.onclick = addCategory;

            showAlert('Catégorie mise à jour avec succès', 'success');
        } else {
            throw new Error(data.error || 'Erreur lors de la mise à jour de la catégorie');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert(error.message || 'Erreur lors de la mise à jour de la catégorie', 'danger');
    }
}

// Function to add category
function addCategory() {
    const form = document.getElementById('addCategoryForm');
    const formData = new FormData();

    // Get the category name and icon
    const name = document.getElementById('categoryName').value;

    if (!name) {
        showAlert('Veuillez entrer un nom de catégorie', 'danger');
        return;
    }

    // Add the form data
    formData.append('name', name);
    formData.append('icon', selectedIcon);
    formData.append('csrf_token', document.querySelector('meta[name="csrf-token"]').content);

    fetch('/add_category', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur réseau');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Add the new category to the sidebar list
                const categoriesList = document.querySelector('.sidebar .list-group');
                const newCategory = document.createElement('a');
                newCategory.href = `/dashboard?category=${data.category.id}`;
                newCategory.className = 'list-group-item list-group-item-action bg-dark text-white d-flex justify-content-between align-items-center';
                newCategory.innerHTML = `
                <span><i class="${data.category.icon} me-2"></i>${data.category.name}</span>
                <span class="badge bg-primary rounded-pill">0</span>
            `;
                categoriesList.appendChild(newCategory);

                // Add the new category to the categories list in the modal
                const modalCategoriesList = document.getElementById('categoriesList');
                const newModalCategory = document.createElement('div');
                newModalCategory.className = 'list-group-item d-flex justify-content-between align-items-center';
                newModalCategory.setAttribute('data-category-id', data.category.id);
                newModalCategory.innerHTML = `
                <div>
                    <i class="${data.category.icon} me-2"></i>
                    ${data.category.name}
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary edit-category" data-category-id="${data.category.id}" data-category-name="${data.category.name}" data-category-icon="${data.category.icon}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-category" data-category-id="${data.category.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
                modalCategoriesList.appendChild(newModalCategory);

                // Add the new category to all category select elements
                const selects = document.querySelectorAll('select[name="category_id"]');
                const option = document.createElement('option');
                option.value = data.category.id;
                option.innerHTML = `<i class="${data.category.icon}"></i> ${data.category.name}`;

                selects.forEach(select => {
                    select.appendChild(option.cloneNode(true));
                });

                // Reset the form and icon selection
                form.reset();
                selectedIcon = 'fas fa-globe';
                populateIconGrid();

                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('categoryModal'));
                modal.hide();

                // Show success message
                showAlert('Catégorie ajoutée avec succès', 'success');
            } else {
                throw new Error(data.error || 'Erreur lors de l\'ajout de la catégorie');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert(error.message || 'Erreur lors de l\'ajout de la catégorie', 'danger');
        });
}
