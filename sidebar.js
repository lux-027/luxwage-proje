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
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const userEmailHeader = document.getElementById('userEmailHeader');
    const userEmailText = userEmailHeader?.querySelector('span:last-child');

    if (userEmailHeader && userEmailText) {
        userEmailText.textContent = user.email;
        userEmailHeader.classList.remove('hidden');
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

// Sayfayı paylaş butonları - Share Modal
const SHARE_URL = 'https://luxwage.pro';
const SHARE_TEXT = 'LuxWage ile çalışanlarınızın maaş, devamsızlık ve ödeme süreçlerini kolayca yönetin. Ücretsiz deneyin!';

function openShareModal() {
    const modal = document.getElementById('shareModal');
    if (!modal) return;
    const linkEl = document.getElementById('shareLinkText');
    if (linkEl) linkEl.textContent = SHARE_URL;
    modal.classList.remove('hidden');
}

function closeShareModal() {
    document.getElementById('shareModal')?.classList.add('hidden');
}

document.querySelectorAll('.share-page-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        openShareModal();
    });
});

document.getElementById('shareModalClose')?.addEventListener('click', closeShareModal);

document.getElementById('shareModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeShareModal();
});

document.getElementById('copyLinkBtn')?.addEventListener('click', async function() {
    try {
        await navigator.clipboard.writeText(SHARE_URL);
        this.innerHTML = '<i class="fas fa-check mr-1"></i>Kopyalandı!';
        this.classList.replace('text-blue-600', 'text-green-600');
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-copy mr-1"></i>Kopyala';
            this.classList.replace('text-green-600', 'text-blue-600');
        }, 2000);
    } catch {
        prompt('Linki kopyala:', SHARE_URL);
    }
});

document.getElementById('shareWhatsapp')?.addEventListener('click', function() {
    window.open(`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + '\n' + SHARE_URL)}`, '_blank');
});

document.getElementById('shareTelegram')?.addEventListener('click', function() {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`, '_blank');
});

document.getElementById('shareNative')?.addEventListener('click', async function() {
    if (navigator.share) {
        try {
            await navigator.share({ title: 'LuxWage', text: SHARE_TEXT, url: SHARE_URL });
        } catch (err) {
            if (err.name !== 'AbortError') console.error(err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(SHARE_URL);
            alert('Link panoya kopyalandı!');
        } catch { prompt('Linki kopyala:', SHARE_URL); }
    }
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
