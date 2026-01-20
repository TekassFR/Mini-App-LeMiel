// Telegram WebApp initialization
const tg = window.Telegram.WebApp;
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
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        appConfig = await response.json();
        plugsData = appConfig.plugs;
        console.log('Configuration chargée');
        initializeApp();
    } catch (error) {
        console.error('Erreur chargement config:', error);
    }
}

function initializeApp() {
    displayPlugsGrid('all');
    setupCategoryButtons();
    displayUserInfo();
}

function displayUserInfo() {
    const userInfo = document.getElementById('user-info');
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userInfo.textContent = `Bienvenue, ${user.first_name || 'Ami'} 👋`;
    }
}

function setupCategoryButtons() {
    const departmentSelect = document.getElementById('department-select');
    if (!departmentSelect) return;
    
    departmentSelect.addEventListener('change', function() {
        currentDepartmentFilter = this.value;
        displayPlugsGrid(this.value);
    });
}

function displayPlugsGrid(department = 'all') {
    const grid = document.getElementById('menu-grid');
    
    let plugsToDisplay = [];
    
    if (department === 'all') {
        // Tous les plugs, dédupliqués
        const seenIds = new Set();
        Object.values(plugsData).forEach(deptPlugs => {
            deptPlugs?.forEach(plug => {
                if (!seenIds.has(plug.id)) {
                    seenIds.add(plug.id);
                    plugsToDisplay.push(plug);
                }
            });
        });
    } else {
        plugsToDisplay = plugsData[department] || [];
    }
    
    if (plugsToDisplay.length === 0) {
        grid.innerHTML = '<div style="padding: 60px 20px; text-align: center; color: #666; font-size: 16px;">Aucun plug pour le moment 🤷‍♂️</div>';
        return;
    }
    
    grid.innerHTML = plugsToDisplay.map(plug => {
        const departments = plug.departments || [plug.department];
        const deptBadges = departments.map(dept => {
            const deptInfo = appConfig.departments[dept];
            return deptInfo ? `<span style="background: rgba(76, 175, 80, 0.2); color: #4caf50; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; margin: 2px;">${dept}</span>` : '';
        }).join(' ');
        
        // Générer les étoiles
        const fullStars = Math.floor(plug.rating);
        const hasHalfStar = plug.rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        let starsHTML = '⭐'.repeat(fullStars);
        if (hasHalfStar) starsHTML += '✨';
        starsHTML += '☆'.repeat(emptyStars);
        
        return `
            <div class="plug-card" onclick="openTelegramProfile('${plug.telegram}')">
                <div class="plug-dept-badge">${deptBadges}</div>
                <div class="plug-image" style="background-image: url('${plug.image}'); background-size: contain; background-repeat: no-repeat; background-position: center;"></div>
                <div class="plug-content">
                    <h3 class="plug-name">${plug.emoji} ${plug.name}</h3>
                    <p class="plug-description">${plug.description}</p>
                    <div class="plug-rating">${starsHTML} ${plug.rating}</div>
                </div>
            </div>
        `;
    }).join('');
}

function openTelegramProfile(telegramUrl) {
    if (!telegramUrl) return;
    
    try {
        if (tg.openTelegramLink) {
            tg.openTelegramLink(telegramUrl);
        } else {
            window.open(telegramUrl, '_blank');
        }
    } catch (error) {
        console.error('Erreur ouverture Telegram:', error);
        window.open(telegramUrl, '_blank');
    }
}

// Thème Telegram
if (tg.setBackgroundColor) tg.setBackgroundColor('#000000');
if (tg.setHeaderColor) tg.setHeaderColor('#1a1a1a');

// Démarrage
document.addEventListener('DOMContentLoaded', loadConfig);
