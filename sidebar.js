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
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebar = document.querySelector('aside');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenuIcon = document.getElementById('mobileMenuIcon');

function closeSidebar() {
    if (sidebar) {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
    }
    if (sidebarOverlay) sidebarOverlay.classList.remove('open');
    if (mobileMenuIcon) {
        mobileMenuIcon.classList.remove('fa-times');
        mobileMenuIcon.classList.add('fa-bars');
    }
}

function openSidebar() {
    if (sidebar) {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
    }
    if (sidebarOverlay) sidebarOverlay.classList.add('open');
    if (mobileMenuIcon) {
        mobileMenuIcon.classList.remove('fa-bars');
        mobileMenuIcon.classList.add('fa-times');
    }
}

function isSidebarOpen() {
    return sidebar && sidebar.classList.contains('translate-x-0');
}

function toggleSidebar() {
    if (isSidebarOpen()) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function() {
        toggleSidebar();
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', function() {
        closeSidebar();
    });
}

// Sayfayı paylaş butonları
document.querySelectorAll('.share-page-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
        const shareData = {
            title: document.title,
            text: 'LuxWage - Maaş ve Devamsızlık Takip Sistemi',
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Paylaşım hatası:', err);
                }
            }
        } else if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link panoya kopyalandı!');
            } catch (err) {
                console.error('Kopyalama hatası:', err);
            }
        } else {
            alert('Tarayıcınız paylaşımı desteklemiyor.');
        }
    });
});

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
