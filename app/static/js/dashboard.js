// Initialize variables at the top
let currentPasswordId = null;
let shareModal;
let contextMenu;
let selectedRow = null;

// Function to copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'alert alert-success position-fixed top-0 end-0 m-3';
        notification.style.zIndex = '9999';
        notification.textContent = 'Copié dans le presse-papiers !';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    } catch (err) {
        console.error('Erreur lors de la copie:', err);
    }
}

// Function to share password
async function sharePassword(passwordId) {
    // Show the modal first
    shareModal.show();
    
    // Store the password ID for later use
    currentPasswordId = passwordId;
}

// Function to confirm share
async function confirmShare() {
    try {
        const expirationDateTime = document.getElementById('expirationDateTime').value;
        if (!expirationDateTime) {
            alert('Veuillez sélectionner une date et heure d\'expiration');
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
        
        // Show success message
        const notification = document.createElement('div');
        notification.className = 'alert alert-success position-fixed top-0 end-0 m-3';
        notification.style.zIndex = '9999';
        notification.textContent = 'Mot de passe partagé avec succès !';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    } catch (error) {
        console.error('Erreur:', error);
        alert(error.message || 'Erreur lors du partage du mot de passe');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize modals and other elements
    shareModal = new bootstrap.Modal(document.getElementById('sharePasswordModal'));
    contextMenu = document.getElementById('contextMenu');
    
    // Set minimum datetime to current time in Paris timezone
    const now = new Date();
    const parisOffset = 120; // Paris is UTC+2
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + parisOffset);
    document.getElementById('expirationDateTime').min = now.toISOString().slice(0, 16);
    
    // Add right-click event listeners to table rows
    document.querySelectorAll('tbody tr').forEach(row => {
        row.addEventListener('contextmenu', function(e) {
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
    contextMenu.addEventListener('click', async function(e) {
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
    document.addEventListener('click', function(e) {
        if (!contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }
    });

    // Add event listener for confirm share button
    document.getElementById('confirmShare').addEventListener('click', confirmShare);

    // ... rest of your existing DOMContentLoaded code ...
});

// Fonction pour générer un mot de passe aléatoire
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

// Gestionnaire pour le bouton de génération de mot de passe
document.getElementById('generatePassword').addEventListener('click', function() {
    document.getElementById('password').value = generateRandomPassword();
});

document.getElementById('generateEditPassword').addEventListener('click', function() {
    document.getElementById('edit_password').value = generateRandomPassword();
});

// Gestionnaire pour la recherche
document.getElementById('searchInput').addEventListener('keyup', function() {
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

// Gestionnaire pour l'ajout de mot de passe
document.getElementById('savePassword').addEventListener('click', function() {
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
            location.reload();
        } else {
            alert('Erreur lors de l\'ajout du mot de passe');
        }
    });
});

// Gestionnaire pour la suppression de mot de passe
document.addEventListener('click', function(e) {
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
                    // Supprimer la ligne du tableau
                    const row = button.closest('tr');
                    row.remove();
                    
                    // Afficher l'alerte de succès
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

// Gestionnaire pour l'édition de mot de passe
document.querySelectorAll('.edit-password').forEach(button => {
    button.addEventListener('click', function() {
        const id = this.dataset.id;
        // Récupérer les données du mot de passe
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

// Gestionnaire pour la mise à jour du mot de passe
document.getElementById('updatePassword').addEventListener('click', function() {
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
            location.reload();
        } else {
            alert('Erreur lors de la mise à jour du mot de passe');
        }
    });
});

// Fonction pour basculer la visibilité du mot de passe
function togglePasswordVisibility(input, button) {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    const icon = button.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

// Ajouter les gestionnaires d'événements pour les boutons de visibilité
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const input = this.previousElementSibling;
        togglePasswordVisibility(input, this);
    });
});

// Gestionnaire pour le bouton voir
document.addEventListener('click', function(e) {
    if (e.target.closest('.view-password')) {
        const button = e.target.closest('.view-password');
        const id = button.dataset.id;
        
        // Récupérer les données du mot de passe
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
                alert('Erreur lors de la récupération du mot de passe');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors de la récupération du mot de passe');
        });
    }
});

// Gestionnaire pour le filtrage par catégorie
document.querySelectorAll('.category-filter').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Mettre à jour la classe active
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

// Add this to handle copying the share URL
document.getElementById('copyShareUrl').addEventListener('click', function() {
    const shareUrl = document.getElementById('shareUrl');
    shareUrl.select();
    document.execCommand('copy');
    
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'alert alert-success position-fixed top-0 end-0 m-3';
    notification.style.zIndex = '9999';
    notification.textContent = 'Lien copié !';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
});

// Category management
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...

    // Add category button click handler
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    addCategoryBtn.addEventListener('click', function() {
        const categoryId = this.dataset.categoryId;
        if (categoryId) {
            updateCategory(categoryId);
        } else {
            addCategory();
        }
    });

    // Delete category
    document.addEventListener('click', async function(e) {
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
    document.addEventListener('click', async function(e) {
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
});

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

// Add this function if it doesn't exist
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}

// Icon grid functionality
const iconGrid = document.getElementById('iconGrid');
const iconSearch = document.getElementById('iconSearch');
let selectedIcon = 'fas fa-globe';

// List of available icons
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

// Search functionality
iconSearch.addEventListener('input', (e) => {
    populateIconGrid(e.target.value);
});

// Initialize icon grid
populateIconGrid();

// Update form submission to use selected ico
document.getElementById('addCategoryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.set('categoryIcon', selectedIcon);
});