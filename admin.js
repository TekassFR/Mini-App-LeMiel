// Telegram WebApp initialization
const tg = window.Telegram.WebApp;

// Configuration
tg.ready();
tg.expand();

// Variables globales
let appConfig = {};
let currentUser = null;

// Chargement de la configuration
async function loadConfig() {
    try {
        const response = await fetch('./config.json');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        appConfig = await response.json();
        console.log('Configuration chargée avec succès');
        return true;
    } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        showMessage('Impossible de charger les données.', 'error');
        return false;
    }
}

// Vérification de l'authentification
async function checkAuth() {
    const authScreen = document.getElementById('auth-screen');
    const authMessage = document.getElementById('auth-message');
    const dashboard = document.getElementById('admin-dashboard');
    
    // Charger la config
    const loaded = await loadConfig();
    if (!loaded) {
        authMessage.textContent = '❌ Erreur de chargement de la configuration';
        return;
    }
    
    // Vérifier l'utilisateur Telegram
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        currentUser = tg.initDataUnsafe.user;
        const username = currentUser.username;
        
        // Vérifier si dans la whitelist
        const whitelist = appConfig.admins?.whitelist || [];
        
        if (whitelist.includes(username)) {
            // Authentification réussie
            authScreen.style.display = 'none';
            dashboard.style.display = 'block';
            document.getElementById('admin-username').textContent = `@${username}`;
            initializeDashboard();
        } else {
            authMessage.innerHTML = `❌ Accès refusé<br><br>Votre compte @${username} n'est pas autorisé.`;
        }
    } else {
        authMessage.textContent = '⚠️ Veuillez ouvrir cette page via Telegram';
    }
}

// Initialisation du dashboard
function initializeDashboard() {
    loadPlugsList();
    loadDepartmentsList();
    setupForms();
}

// Changement d'onglet
function switchTab(tabName) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    event.target.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Afficher un message
function showMessage(message, type = 'success') {
    const container = document.getElementById('message-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    container.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Configuration des formulaires
function setupForms() {
    // Formulaire d'ajout de plug
    document.getElementById('add-plug-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addPlug();
    });
    
    // Formulaire d'ajout de département
    document.getElementById('add-dept-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addDepartment();
    });
}

// Ajouter un plug
function addPlug() {
    const name = document.getElementById('plug-name').value;
    const departmentsStr = document.getElementById('plug-departments').value;
    const description = document.getElementById('plug-description').value;
    const telegram = document.getElementById('plug-telegram').value;
    const emoji = document.getElementById('plug-emoji').value || '📍';
    const image = document.getElementById('plug-image').value || 'https://i.ibb.co/mCTpqd9y/88f76eb4-a1ad-42ae-a853-2af312179d86-removebg-preview.png';
    const rating = parseFloat(document.getElementById('plug-rating').value) || 4.5;
    
    // Convertir les départements
    const departments = departmentsStr.split(',').map(d => d.trim());
    
    // Générer un ID unique
    let maxId = 0;
    Object.values(appConfig.plugs).forEach(deptPlugs => {
        deptPlugs.forEach(plug => {
            if (plug.id > maxId) maxId = plug.id;
        });
    });
    const newId = maxId + 1;
    
    // Créer le nouveau plug
    const newPlug = {
        id: newId,
        name: name,
        departments: departments,
        description: description,
        telegram: telegram,
        emoji: emoji,
        image: image,
        rating: rating,
        active: true
    };
    
    // Ajouter le plug à chaque département
    departments.forEach(dept => {
        if (!appConfig.plugs[dept]) {
            appConfig.plugs[dept] = [];
        }
        appConfig.plugs[dept].push(newPlug);
    });
    
    showMessage('✅ Plug ajouté avec succès!');
    document.getElementById('add-plug-form').reset();
    loadPlugsList();
}

// Supprimer un plug
function deletePlug(plugId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plug ?')) return;
    
    // Supprimer le plug de tous les départements
    Object.keys(appConfig.plugs).forEach(dept => {
        appConfig.plugs[dept] = appConfig.plugs[dept].filter(p => p.id !== plugId);
    });
    
    showMessage('✅ Plug supprimé avec succès!');
    loadPlugsList();
}

// Charger la liste des plugs
function loadPlugsList() {
    const list = document.getElementById('plugs-list');
    list.innerHTML = '';
    
    // Collecter tous les plugs uniques
    const plugsMap = new Map();
    Object.values(appConfig.plugs).forEach(deptPlugs => {
        deptPlugs.forEach(plug => {
            if (!plugsMap.has(plug.id)) {
                plugsMap.set(plug.id, plug);
            }
        });
    });
    
    plugsMap.forEach(plug => {
        const item = document.createElement('div');
        item.className = 'plug-item';
        item.innerHTML = `
            <div class="plug-info">
                <h3>${plug.emoji} ${plug.name}</h3>
                <p><strong>Départements:</strong> ${plug.departments?.join(', ') || plug.department || 'N/A'}</p>
                <p><strong>Description:</strong> ${plug.description}</p>
                <p><strong>Telegram:</strong> <a href="${plug.telegram}" target="_blank">${plug.telegram}</a></p>
                <p><strong>Note:</strong> ⭐ ${plug.rating}</p>
            </div>
            <div class="plug-actions">
                <button class="btn-danger" onclick="deletePlug(${plug.id})">🗑️ Supprimer</button>
            </div>
        `;
        list.appendChild(item);
    });
}

// Ajouter un département
function addDepartment() {
    const number = document.getElementById('dept-number').value;
    const name = document.getElementById('dept-name').value;
    const emoji = document.getElementById('dept-emoji').value || '📍';
    
    if (appConfig.departments[number]) {
        showMessage('⚠️ Ce département existe déjà!', 'error');
        return;
    }
    
    appConfig.departments[number] = {
        name: name,
        emoji: emoji
    };
    
    // Initialiser la liste de plugs vide pour ce département
    if (!appConfig.plugs[number]) {
        appConfig.plugs[number] = [];
    }
    
    showMessage('✅ Département ajouté avec succès!');
    document.getElementById('add-dept-form').reset();
    loadDepartmentsList();
}

// Supprimer un département
function deleteDepartment(deptNumber) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce département ? Les plugs associés ne seront pas supprimés.')) return;
    
    delete appConfig.departments[deptNumber];
    
    showMessage('✅ Département supprimé avec succès!');
    loadDepartmentsList();
}

// Charger la liste des départements
function loadDepartmentsList() {
    const list = document.getElementById('departments-list');
    list.innerHTML = '';
    
    Object.entries(appConfig.departments).forEach(([number, dept]) => {
        const item = document.createElement('div');
        item.className = 'dept-item';
        item.innerHTML = `
            <div class="plug-info">
                <h3>${dept.emoji} ${dept.name} (${number})</h3>
                <p><strong>Nombre de plugs:</strong> ${appConfig.plugs[number]?.length || 0}</p>
            </div>
            <div class="plug-actions">
                <button class="btn-danger" onclick="deleteDepartment('${number}')">🗑️ Supprimer</button>
            </div>
        `;
        list.appendChild(item);
    });
}

// Télécharger le config.json
function downloadConfig() {
    const dataStr = JSON.stringify(appConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'config.json';
    link.click();
    URL.revokeObjectURL(url);
    showMessage('✅ Fichier config.json téléchargé!');
}

// Changement de thème selon le thème du système Telegram
if (tg.setBackgroundColor) {
    tg.setBackgroundColor('#000000');
}

if (tg.setHeaderColor) {
    tg.setHeaderColor('#1a1a1a');
}

// Démarrage de l'application
document.addEventListener('DOMContentLoaded', checkAuth);
