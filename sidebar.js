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

const legalSidebar = document.querySelector('aside');
const isDashboardPage = window.location.pathname.endsWith('/dashboard.html');
if (legalSidebar && !isDashboardPage) {
    legalSidebar.id = 'dashboardSidebar';
    legalSidebar.className = 'w-64 bg-blue-900 text-white shadow-xl flex flex-col fixed left-0 top-16 md:top-0 h-[calc(100vh-4rem)] md:h-screen overflow-y-auto transform -translate-x-full md:translate-x-0 transition-transform duration-300 z-40';
    legalSidebar.innerHTML = `
        <div class="p-6 flex-1 flex flex-col">
            <div class="flex items-center mb-8">
                <a href="index.html" class="md:hidden flex items-center w-full rounded-xl border border-emerald-300/40 bg-emerald-500/20 px-4 py-3 text-emerald-100 shadow-lg shadow-emerald-950/20 transition-colors hover:bg-emerald-500/35 hover:text-white font-semibold">
                    <i class="fas fa-globe w-5 mr-3 text-emerald-300"></i>
                    Başlangıç Sayfası
                </a>
                <div class="hidden md:flex flex-col items-center w-full gap-2">
                    <a href="index.html" class="flex items-center gap-3 text-white hover:text-gray-200 transition-colors font-bold group">
                        <img src="görsel/luxwagelogo.png" alt="LuxWage" class="h-9 w-9 rounded-lg object-contain shadow-lg">
                        <span class="inline-block bg-gradient-to-r from-white via-blue-100 to-emerald-200 bg-clip-text px-1 py-1 text-2xl leading-[1.2] tracking-[-0.02em] text-transparent" style="font-family: 'Archivo Black', Arial Black, sans-serif; transform:scaleX(.92) scaleY(.84); transform-origin:left center;">LUX WAGE</span>
                    </a>
                    <a href="index.html" class="flex items-center w-full rounded-xl border border-emerald-300/40 bg-emerald-500/20 px-4 py-3 text-emerald-100 shadow-lg shadow-emerald-950/20 transition-colors hover:bg-emerald-500/35 hover:text-white font-semibold mb-2 mt-4">
                        <i class="fas fa-globe w-5 mr-3 text-emerald-300"></i>
                        Başlangıç Sayfası
                    </a>
                </div>
            </div>
            <nav class="space-y-2 mb-8" id="authNav">
                <a href="dashboard.html?view=home" id="homePageBtn" class="nav-item flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"><i class="fas fa-home w-5 mr-3"></i>Ana Sayfa</a>
                <a href="dashboard.html?view=employees" id="employeesPageBtn" class="nav-item flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"><i class="fas fa-users w-5 mr-3"></i>Çalışanlarım</a>
                <a href="dashboard.html?view=pastEmployees" id="pastEmployeesPageBtn" class="nav-item flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"><i class="fas fa-archive w-5 mr-3"></i>Geçmiş Çalışanlar</a>
                <a href="dashboard.html?view=account" id="accountPageBtn" class="nav-item flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"><i class="fas fa-user-cog w-5 mr-3"></i>Hesabım</a>
                <a href="dashboard.html?view=studio" id="studioPageBtn" class="nav-item flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"><i class="fas fa-star w-5 mr-3"></i>Lux Studio</a>
            </nav>
            <div class="border-t border-blue-700 pt-4 mt-auto">
                <h4 class="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3">Yasal Bilgiler</h4>
                <nav class="space-y-1">
                    <a href="gizlilik-politikasi.html" data-page="gizlilik" class="flex items-center px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded transition-all duration-300"><i class="fas fa-shield-alt w-4 mr-2"></i>Gizlilik Politikası</a>
                    <a href="kullanim-sartlari.html" data-page="kullanim" class="flex items-center px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded transition-all duration-300"><i class="fas fa-file-contract w-4 mr-2"></i>Kullanım Şartları</a>
                    <a href="hakkimizda.html" data-page="hakkimizda" class="flex items-center px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded transition-all duration-300"><i class="fas fa-info-circle w-4 mr-2"></i>Hakkımızda</a>
                    <a href="iletisim.html" data-page="iletisim" class="flex items-center px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded transition-all duration-300"><i class="fas fa-envelope w-4 mr-2"></i>İletişim</a>
                    <a href="cerez-politikasi.html" data-page="cerez" class="flex items-center px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded transition-all duration-300"><i class="fas fa-cookie w-4 mr-2"></i>Çerez Politikası</a>
                </nav>
                <div class="mt-4 pt-4 border-t border-blue-700"><p class="text-xs text-blue-400 text-center">© 2026 LuxWage<br>Tüm hakları saklıdır.</p></div>
            </div>
        </div>
    `;

    if (!document.querySelector('link[href*="Archivo+Black"]')) {
        const brandFont = document.createElement('link');
        brandFont.rel = 'stylesheet';
        brandFont.href = 'https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap';
        document.head.appendChild(brandFont);
    }

    const legalSidebarHeader = legalSidebar.querySelector('.p-6 > div:first-child');
    const headerLinks = Array.from(legalSidebarHeader?.querySelectorAll('a') || []);
    const legalBrandLink = headerLinks.find(link => link.querySelector('img'));
    const legalBrand = legalBrandLink?.querySelector('span');
    if (legalBrandLink) {
        legalBrandLink.href = 'index.html';
        legalBrandLink.className = 'flex items-center gap-3 text-white hover:text-gray-200 transition-colors font-bold group';
    }
    if (legalBrand) {
        legalBrand.className = 'inline-block bg-gradient-to-r from-white via-blue-100 to-emerald-200 bg-clip-text px-1 py-1 text-2xl leading-[1.2] tracking-[-0.02em] text-transparent';
        legalBrand.style.fontFamily = "'Archivo Black', Arial Black, sans-serif";
        legalBrand.style.transform = 'scaleX(.92) scaleY(.84)';
        legalBrand.style.transformOrigin = 'left center';
        legalBrand.textContent = 'LUX WAGE';
    }

    headerLinks.filter(link => link !== legalBrandLink && link.href.endsWith('/index.html')).forEach(link => {
        const mobileOnly = link.classList.contains('md:hidden');
        link.className = `${mobileOnly ? 'md:hidden ' : ''}flex items-center w-full rounded-xl border border-emerald-300/40 bg-emerald-500/20 px-4 py-3 text-emerald-100 shadow-lg shadow-emerald-950/20 transition-colors hover:bg-emerald-500/35 hover:text-white font-semibold`;
        const icon = link.querySelector('i');
        if (icon) icon.className = 'fas fa-globe w-5 mr-3 text-emerald-300';
    });

    const primaryNavigation = legalSidebarHeader?.nextElementSibling;
    const dashboardPages = ['home', 'employees', 'pastEmployees', 'account'];
    const dashboardPageIds = ['homePageBtn', 'employeesPageBtn', 'pastEmployeesPageBtn', 'accountPageBtn'];
    if (primaryNavigation) primaryNavigation.id = 'authNav';
    primaryNavigation?.querySelectorAll('a').forEach((link, index) => {
        const page = dashboardPages[index];
        if (page) {
            link.id = dashboardPageIds[index];
            link.href = `dashboard.html?view=${page}`;
        }
    });

    if (primaryNavigation && !primaryNavigation.querySelector('#studioPageBtn')) {
        primaryNavigation.insertAdjacentHTML('beforeend', `
            <a href="dashboard.html?view=studio" id="studioPageBtn" class="nav-item flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300">
                <i class="fas fa-star w-5 mr-3"></i>
                Lux Studio
            </a>
        `);
    }

    const legalMobileTopBar = document.getElementById('mobileMenuToggle')?.closest('header');
    const legalMobileBrandLink = legalMobileTopBar?.querySelector('a');
    const legalMobileBrand = legalMobileBrandLink?.querySelector('span');
    if (legalMobileTopBar) legalMobileTopBar.id = 'mobileTopBar';
    if (legalMobileBrandLink) {
        legalMobileBrandLink.href = 'index.html';
        legalMobileBrandLink.className = 'flex items-center gap-2 font-bold text-xl';
    }
    if (legalMobileBrand) {
        legalMobileBrand.className = 'inline-block bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text px-1 py-1 text-xl leading-[1.2] tracking-[-0.02em] text-transparent';
        legalMobileBrand.style.fontFamily = "'Archivo Black', Arial Black, sans-serif";
        legalMobileBrand.style.transform = 'scaleX(.92) scaleY(.84)';
        legalMobileBrand.style.transformOrigin = 'left center';
        legalMobileBrand.textContent = 'LUX WAGE';
    }
}

if (isDashboardPage) {
    document.querySelectorAll('#authNav [data-page="studio"]').forEach(link => link.remove());
}

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
    modal.classList.add('flex');
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
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
        this.classList.replace('bg-blue-600', 'bg-emerald-500');
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-copy mr-1"></i>Kopyala';
            this.classList.replace('bg-emerald-500', 'bg-blue-600');
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
    link.classList.remove('bg-white/10', 'text-white');
});

// Add active class based on current page
if (suAnkiSayfa.includes('gizlilik-politikasi')) {
    const activeLink = document.querySelector('[data-page="gizlilik"]');
    if (activeLink) activeLink.classList.add('bg-white/10', 'text-white');
} else if (suAnkiSayfa.includes('kullanim-sartlari')) {
    const activeLink = document.querySelector('[data-page="kullanim"]');
    if (activeLink) activeLink.classList.add('bg-white/10', 'text-white');
} else if (suAnkiSayfa.includes('hakkimizda')) {
    const activeLink = document.querySelector('[data-page="hakkimizda"]');
    if (activeLink) activeLink.classList.add('bg-white/10', 'text-white');
} else if (suAnkiSayfa.includes('iletisim')) {
    const activeLink = document.querySelector('[data-page="iletisim"]');
    if (activeLink) activeLink.classList.add('bg-white/10', 'text-white');
} else if (suAnkiSayfa.includes('cerez-politikasi')) {
    const activeLink = document.querySelector('[data-page="cerez"]');
    if (activeLink) activeLink.classList.add('bg-white/10', 'text-white');
}
