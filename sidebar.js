import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBTVxwfSMDyfDM4AMxUADH1meOvqFnqq8U",
    authDomain: "luxwage.firebaseapp.com",
    projectId: "luxwage",
    storageBucket: "luxwage.firebasestorage.app",
    messagingSenderId: "119696592989",
    appId: "1:119696592989:web:88c384a2f3c0e08d80bdb4",
    measurementId: "G-WD1Z230JC3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Logout fonksiyonu
function logout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        signOut(auth)
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('Logout error:', error);
            });
    }
}

// Firebase Auth State Listener
onAuthStateChanged(auth, (user) => {
    const userEmailHeader = document.getElementById('userEmailHeader');
    const userEmailText = userEmailHeader?.querySelector('span:last-child');

    if (user && userEmailHeader && userEmailText) {
        userEmailText.textContent = user.email;
        userEmailHeader.classList.remove('hidden');
    } else if (userEmailHeader) {
        userEmailHeader.classList.add('hidden');
    }
});

// Sidebar toggle and overlay
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebar = document.querySelector('.sidebar');

function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('open');
}

function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('open');
    if (sidebarOverlay) sidebarOverlay.classList.toggle('open');
}

if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', function() {
        toggleSidebar();
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', function() {
        closeSidebar();
    });
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    });
});

// Active state for legal pages
const suAnkiSayfa = window.location.pathname;

// Remove active class from all legal links first
document.querySelectorAll('[data-page]').forEach(link => {
    link.classList.remove('bg-blue-600', 'text-white');
});

// Add active class based on current page
if (suAnkiSayfa.includes('gizlilik-politikasi')) {
    const activeLink = document.querySelector('[data-page="gizlilik"]');
    if (activeLink) activeLink.classList.add('bg-blue-600', 'text-white');
} else if (suAnkiSayfa.includes('kullanim-sartlari')) {
    const activeLink = document.querySelector('[data-page="kullanim"]');
    if (activeLink) activeLink.classList.add('bg-blue-600', 'text-white');
} else if (suAnkiSayfa.includes('hakkimizda')) {
    const activeLink = document.querySelector('[data-page="hakkimizda"]');
    if (activeLink) activeLink.classList.add('bg-blue-600', 'text-white');
} else if (suAnkiSayfa.includes('iletisim')) {
    const activeLink = document.querySelector('[data-page="iletisim"]');
    if (activeLink) activeLink.classList.add('bg-blue-600', 'text-white');
} else if (suAnkiSayfa.includes('cerez-politikasi')) {
    const activeLink = document.querySelector('[data-page="cerez"]');
    if (activeLink) activeLink.classList.add('bg-blue-600', 'text-white');
}
