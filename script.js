// Telegram WebApp initialization
const tg = window.Telegram.WebApp;

// Configuration
tg.ready();
tg.expand();

// Variables globales
let appConfig = {};
let plugsData = {};
let currentPlugId = null;
let currentDepartmentFilter = 'all';

// Chargement de la configuration
async function loadConfig() {
    try {
        const response = await fetch('./config.json');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        appConfig = await response.json();
        plugsData = appConfig.plugs;
        console.log('Configuration chargée avec succès');
        initializeApp();
    } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        showError('Impossible de charger les données. Veuillez rafraîchir.');
    }
}

// Initialisation de l'app
function initializeApp() {
    displayPlugsGrid('all');
    setupCategoryButtons();
    displayUserInfo();
}

// Affichage des informations utilisateur
function displayUserInfo() {
    const userInfo = document.getElementById('user-info');
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userInfo.textContent = `Bienvenue, ${user.first_name || 'Ami'} 👋`;
    }
}

// Configuration du sélecteur de départements
function setupCategoryButtons() {
    const select = document.getElementById('department-select');
    select.addEventListener('change', function() {
        const dept = this.value;
        currentDepartmentFilter = dept;
        displayPlugsGrid(dept);
    });
}

// Affichage de la grille des plugs
function displayPlugsGrid(department) {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';

    let plugsToDisplay = [];

    if (department === 'all') {
        // Tous les plugs
        Object.values(plugsData).forEach(departmentPlugs => {
            plugsToDisplay = plugsToDisplay.concat(departmentPlugs);
        });
    } else {
        // Plugs d'un département spécifique
        plugsToDisplay = plugsData[department] || [];
    }

    if (plugsToDisplay.length === 0) {
        grid.innerHTML = '<div class="no-results">Aucun plug trouvé dans cette région.</div>';
        return;
    }

    plugsToDisplay.forEach(plug => {
        const plugCard = createPlugCard(plug);
        grid.appendChild(plugCard);
    });
}

// Création d'une carte de plug
function createPlugCard(plug) {
    const card = document.createElement('div');
    card.className = 'menu-item';
    card.style.cursor = 'pointer';
    card.onclick = () => openTelegram(plug.telegram);
    
    const ratingStars = '⭐'.repeat(Math.floor(plug.rating)) + (plug.rating % 1 !== 0 ? '✨' : '');
    
    // Gérer plusieurs départements
    const departments = plug.departments || [plug.department];
    const deptBadges = departments.map(dept => {
        const deptInfo = appConfig.departments[dept];
        return `${deptInfo?.emoji || ''} ${dept}`;
    }).join(' ');
    
    card.innerHTML = `
        <div class="menu-item-image">
            <img src="${plug.image}" alt="${plug.name}" class="product-img">
            <div class="product-emoji">${plug.emoji}</div>
            <div class="product-badge">
                ${deptBadges}
            </div>
        </div>
        <div class="menu-item-content">
            <h3 class="product-name">${plug.name}</h3>
            <p class="product-description">${plug.description}</p>
            <div class="product-footer">
                <div class="product-price">
                    <span class="rating">${ratingStars} ${plug.rating}</span>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Affichage du détail d'un plug
function showPlugDetail(plugId) {
    // Rechercher le plug dans tous les départements
    let plug = null;
    for (let dept in plugsData) {
        const found = plugsData[dept].find(p => p.id === plugId);
        if (found) {
            plug = found;
            break;
        }
    }

    if (!plug) return;

    currentPlugId = plug.id;
    const detailPage = document.getElementById('product-detail-page');
    
    // Remplir les informations
    document.getElementById('detail-product-name').textContent = plug.name;
    document.getElementById('detail-product-description').textContent = plug.description;
    document.getElementById('detail-product-img').src = plug.image;
    document.getElementById('detail-product-emoji').textContent = plug.emoji;
    
    // Afficher la note
    const ratingStars = '⭐'.repeat(Math.floor(plug.rating)) + (plug.rating % 1 !== 0 ? '✨' : '');
    const ratingDiv = document.getElementById('detail-rating');
    ratingDiv.innerHTML = `<strong>Note:</strong> ${ratingStars} ${plug.rating}/5`;
    
    // Afficher le département
    const deptName = appConfig.departments[plug.department]?.name || 'Inconnu';
    const deptDiv = document.getElementById('detail-department');
    deptDiv.innerHTML = `<strong>Localisation:</strong> ${appConfig.departments[plug.department]?.emoji || ''} ${deptName}`;
    
    // Afficher le lien Telegram
    const telegramLinkDiv = document.getElementById('plug-telegram-link');
    const telegramUsername = plug.telegram.replace('https://t.me/', '').replace('http://t.me/', '');
    const telegramLink = document.createElement('a');
    telegramLink.href = '#';
    telegramLink.textContent = telegramUsername;
    telegramLink.style.color = '#4a90e2';
    telegramLink.style.textDecoration = 'none';
    telegramLink.style.fontWeight = '600';
    telegramLink.style.borderBottom = '2px solid transparent';
    telegramLink.style.transition = 'all 0.3s ease';
    telegramLink.dataset.telegram = plug.telegram;
    telegramLink.onclick = (e) => {
        e.preventDefault();
        openTelegram(plug.telegram);
    };
    
    telegramLinkDiv.innerHTML = '<strong>📱 Telegram:</strong> ';
    telegramLinkDiv.appendChild(telegramLink);
    
    detailPage.style.display = 'flex';
    window.scrollTo(0, 0);
}

// Fermeture du détail du plug
function closePlugDetail() {
    const detailPage = document.getElementById('product-detail-page');
    detailPage.style.display = 'none';
    currentPlugId = null;
}

// Ouverture du lien Telegram
function openTelegram(telegramUrl) {
    try {
        // Dans Telegram WebApp, utiliser openTelegramLink pour rester dans l'app
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
            window.Telegram.WebApp.openTelegramLink(telegramUrl);
        } else {
            // Fallback pour navigateur web normal
            window.open(telegramUrl, '_blank');
        }
    } catch (error) {
        console.error('Erreur ouverture Telegram:', error);
        window.location.href = telegramUrl;
    }
}

// Gestion des erreurs
function showError(message) {
    console.error(message);
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = `<div class="error-message">${message}</div>`;
}

// Changement de thème selon le thème du système Telegram
if (tg.setBackgroundColor) {
    tg.setBackgroundColor('#000000');
}

if (tg.setHeaderColor) {
    tg.setHeaderColor('#1a1a1a');
}

// Chargement initial
document.addEventListener('DOMContentLoaded', loadConfig);
