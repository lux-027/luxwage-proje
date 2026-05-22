// Firebase CDN Import'ları
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Firebase Config
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
const db = getFirestore(app);

// Global Modal Functions (HTML onclick için window objesine bağlanıyor)
window.openLoginModal = function() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.openRegisterModal = function() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.closeModals = function() {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    if (loginModal) {
        loginModal.style.display = 'none';
    }
    
    if (registerModal) {
        registerModal.style.display = 'none';
    }
};

window.showNotification = function(type, message) {
    const container = document.getElementById('notificationContainer');
    if (!container) {
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-3"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 200);
        }
    }, 5000);
};

// "Hazırsanız Başlayalım" butonu için fonksiyon
window.handleStartButton = function() {
    if (auth.currentUser) {
        if (typeof luxwage !== 'undefined') {
            luxwage.showDashboard();
        }
    } else {
        showNotification('info', 'Devam etmek için lütfen giriş yapın veya kayıt olun');
        window.openLoginModal();
    }
};

window.logout = function() {
    signOut(auth)
        .then(() => {
            showNotification('success', 'Çıkış yapıldı');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        })
        .catch((error) => {
            console.error('Logout error:', error);
            showNotification('error', 'Çıkış yapılırken hata oluştu');
        });
};

// LuxWage - Maaş ve Devamsızlık Takip Sistemi
// Ana JavaScript Dosyası

class LuxWage {
    constructor() {
        this.employees = [];
        this.currentPage = 'home';
        this.init();
    }

    // Uygulamayı başlat
    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateCurrentDate();
        this.cleanupOldData();
        this.setupFirebaseAuth();
        
        // İlk yüklemede landing page'i göster
        if (localStorage.getItem('luxwage-first-visit') !== 'false') {
            this.showLandingPage();
        } else {
            this.showDashboard();
        }
    }

    // Firebase Auth kurulumu
    setupFirebaseAuth() {
        onAuthStateChanged(auth, (user) => {
            const authButtons = document.querySelectorAll('.auth-buttons')[0];
            const userProfile = document.getElementById('userProfile');
            const userEmailDisplay = document.getElementById('userEmailDisplay');
            const dashboard = document.getElementById('dashboard');
            const landingPage = document.getElementById('landingPage');
            
            if (user) {
                // Kullanıcı giriş yapmış
                if (authButtons) authButtons.style.display = 'none';
                if (userProfile) userProfile.style.display = 'flex';
                if (userEmailDisplay) userEmailDisplay.textContent = user.email;
                
                // Dashboard'u göster, landing page'i gizle
                if (dashboard) dashboard.style.display = 'block';
                if (landingPage) landingPage.style.display = 'none';
                
                showNotification('success', 'Hoş geldiniz, ' + user.email + '!');
                
                // Sayfa yenilenmede giriş yapmışsa dashboard'a yönlendir
                if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
                    setTimeout(() => this.showDashboard(), 1500);
                }
            } else {
                // Kullanıcı çıkış yapmış
                if (authButtons) authButtons.style.display = 'flex';
                if (userProfile) userProfile.style.display = 'none';
                
                // Dashboard'u gizle, landing page'i göster
                if (dashboard) dashboard.style.display = 'none';
                if (landingPage) landingPage.style.display = 'block';
            }
        });
    }


    // LocalStorage'dan verileri yükle
    loadData() {
        const employeesData = localStorage.getItem('luxwage-employees');
        if (employeesData) {
            this.employees = JSON.parse(employeesData);
        }
    }

    // LocalStorage'a verileri kaydet
    saveData() {
    }
}

// Form Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Login formu
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                showNotification('error', 'Lütfen e-posta ve şifre girin');
                return;
            }

            // Firebase ile giriş yap
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    showNotification('success', 'Giriş başarılı! Yönlendiriliyorsunuz...');
                    
                    // Formu temizle
                    loginForm.reset();
                    window.closeModals();
                    
                    // Dashboard'a yönlendir
                    setTimeout(() => {
                        if (typeof luxwage !== 'undefined') {
                            luxwage.showDashboard();
                        } else {
                            window.location.href = '#dashboard';
                        }
                    }, 1500);
                })
                .catch((error) => {
                    console.error('Giriş hatası:', error);
                    let errorMessage = 'Giriş işlemi başarısız oldu.';
                    
                    if (error.code === 'auth/user-not-found') {
                        errorMessage = 'Bu e-posta adresi kayıtlı değil.';
                    } else if (error.code === 'auth/wrong-password') {
                        errorMessage = 'Hatalı şifre.';
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = 'Geçersiz e-posta adresi.';
                    } else if (error.code === 'auth/user-disabled') {
                        errorMessage = 'Bu kullanıcı hesabı devre dışı bırakılmış.';
                    } else if (error.code === 'auth/too-many-requests') {
                        errorMessage = 'Çok fazla giriş denemesi. Lütfen bir süre bekleyin.';
                    } else if (error.code === 'auth/network-request-failed') {
                        errorMessage = 'Ağ hatası. Lütfen internet bağlantınızı kontrol edin.';
                    }
                    
                    showNotification('error', errorMessage);
                });
        });
    }
});

// Modal dışına tıklayınca kapatma
document.addEventListener('click', function(e) {
    if (e.target && e.target.classList && e.target.classList.contains('modal')) {
        window.closeModals();
    }
});

// ESC tuşuna basınca modalları kapatma
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        window.closeModals();
    }
});

// LuxWage instance'ini oluştur ve global method'ları window objesine bağla
const luxwage = new LuxWage();

// Global method'ları window objesine bağla (HTML onclick için)
window.showLandingPage = function() {
    luxwage.showLandingPage();
};

window.showDashboard = function() {
    luxwage.showDashboard();
};

document.addEventListener('DOMContentLoaded', () => {
    // LuxWage zaten yukarıda oluşturuldu
    
    // Register formu
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const passwordConfirm = document.getElementById('registerPasswordConfirm') ? document.getElementById('registerPasswordConfirm').value : '';

            if (!email || !password) {
                showNotification('error', 'Lütfen tüm alanları doldurun');
                return;
            }

            if (password.length < 6) {
                showNotification('error', 'Şifre en az 6 karakter olmalıdır');
                return;
            }

            // Firebase ile kullanıcı oluştur
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    showNotification('success', 'Kayıt başarılı! Giriş yapabilirsiniz.');
                    
                    // Formları temizle
                    registerForm.reset();
                    window.closeModals();
                    
                    // Giriş modalını otomatik aç
                    setTimeout(() => window.openLoginModal(), 1000);
                })
                .catch((error) => {
                    console.error('Kayıt hatası:', error);
                    let errorMessage = 'Kayıt işlemi başarısız oldu.';
                    
                    if (error.code === 'auth/email-already-in-use') {
                        errorMessage = 'Bu e-posta adresi zaten kayıtlı.';
                    } else if (error.code === 'auth/weak-password') {
                        errorMessage = 'Şifre çok zayıf. En az 6 karakter olmalıdır.';
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = 'Geçersiz e-posta adresi.';
                    } else if (error.code === 'auth/network-request-failed') {
                        errorMessage = 'Ağ hatası. Lütfen internet bağlantınızı kontrol edin.';
                    }
                    
                    showNotification('error', errorMessage);
                });
        });
    }
});

// Login modal içine kayıt ol linki ekle
document.addEventListener('DOMContentLoaded', function() {
    // Start button event listener
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', function() {
            if (auth.currentUser) {
                if (typeof luxwage !== 'undefined') {
                    luxwage.showDashboard();
                }
            } else {
                showNotification('info', 'Devam etmek için lütfen giriş yapın veya kayıt olun');
                window.openLoginModal();
            }
        });
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Formun altına kayıt ol linki ekle
        const registerLink = document.createElement('div');
        registerLink.className = 'text-center mt-4';
        registerLink.innerHTML = '<p class="text-sm text-gray-600">Hesabınız yok mu? <a href="#" onclick="window.closeModals(); window.openRegisterModal();" class="text-emerald-500 hover:text-emerald-600 font-medium">Kayıt Ol</a></p>';
        loginForm.appendChild(registerLink);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        // Formun altına giriş yap linki ekle
        const loginLink = document.createElement('div');
        loginLink.className = 'text-center mt-4';
        loginLink.innerHTML = '<p class="text-sm text-gray-600">Zaten hesabınız var mı? <a href="#" onclick="window.closeModals(); window.openLoginModal();" class="text-blue-500 hover:text-blue-600 font-medium">Giriş Yap</a></p>';
        registerForm.appendChild(loginLink);
    }
});
