// Firebase CDN Import'ları
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

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

// Toast Notification Sistemi
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) {
        return;
    }
    
    // Tip bazlı renk ve icon seçimi
    const typeConfig = {
        success: {
            bgColor: 'bg-emerald-500',
            icon: 'fa-check-circle',
            iconColor: 'text-white'
        },
        error: {
            bgColor: 'bg-red-500',
            icon: 'fa-exclamation-circle',
            iconColor: 'text-white'
        },
        info: {
            bgColor: 'bg-blue-500',
            icon: 'fa-info-circle',
            iconColor: 'text-white'
        }
    };
    
    const config = typeConfig[type] || typeConfig.info;
    
    // Notification element oluştur
    const notification = document.createElement('div');
    notification.className = `
        ${config.bgColor} text-white px-6 py-4 rounded-lg shadow-lg 
        flex items-center space-x-3 min-w-[300px] max-w-md
        transform translate-x-full opacity-0 transition-all duration-500 ease-out
        cursor-pointer hover:scale-105
    `;
    notification.innerHTML = `
        <i class="fas ${config.icon} ${config.iconColor} text-xl flex-shrink-0"></i>
        <span class="font-medium text-sm flex-grow">${message}</span>
        <button class="ml-2 text-white/80 hover:text-white transition-colors">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Container'a ekle
    container.appendChild(notification);
    
    // Slide-in animasyonu (bir frame bekle sonra animasyon başlat)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        });
    });
    
    // Kapatma butonu
    const closeBtn = notification.querySelector('button');
    const removeNotification = () => {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    };
    
    closeBtn.addEventListener('click', removeNotification);
    notification.addEventListener('click', removeNotification);
    
    // 3 saniye sonra otomatik kapat
    setTimeout(() => {
        if (notification.parentNode) {
            removeNotification();
        }
    }, 3000);
};

// Modal Fonksiyonları
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function openRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModals() {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    
    if (loginModal) {
        loginModal.style.display = 'none';
    }
    
    if (registerModal) {
        registerModal.style.display = 'none';
    }
    
    if (forgotPasswordModal) {
        forgotPasswordModal.style.display = 'none';
    }
}

// "Hazırsanız Başlayalım" butonu için fonksiyon
function handleStartButton() {
    if (auth.currentUser) {
        // Kullanıcı giriş yapmış, dashboard'a yönlendir
        window.location.href = 'dashboard.html';
    } else {
        showNotification('Devam etmek için lütfen giriş yapın veya kayıt olun', 'info');
        openLoginModal();
    }
}

// Hoş geldin ekranını göster
function showWelcomeScreen(userName) {
    const landingPage = document.getElementById('landingPage');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const welcomeUserName = document.getElementById('welcomeUserName');
    
    if (welcomeUserName) {
        welcomeUserName.textContent = userName;
    }
    
    if (landingPage) landingPage.style.display = 'none';
    if (welcomeScreen) welcomeScreen.style.display = 'block';
    
    // Welcome start button event listener
    const welcomeStartButton = document.getElementById('welcomeStartButton');
    if (welcomeStartButton) {
        welcomeStartButton.onclick = function() {
            window.location.href = 'dashboard.html';
        };
    }
}

// Firebase Auth State Listener - Routing
onAuthStateChanged(auth, (user) => {
    const authButtons = document.querySelectorAll('.auth-buttons')[0];
    const userProfile = document.getElementById('userProfile');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const landingPage = document.getElementById('landingPage');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const visitorMessage = document.getElementById('visitorMessage');
    const dashboardButton = document.getElementById('dashboardButton');
    
    if (user) {
        // Kullanıcı giriş yapmış
        if (authButtons) authButtons.style.display = 'none';
        if (userProfile) userProfile.style.display = 'flex';
        
        // displayName varsa kullan, yoksa email kullan
        const displayName = user.displayName || user.email;
        if (userNameDisplay) userNameDisplay.textContent = displayName;
        if (userEmailDisplay) userEmailDisplay.textContent = user.email;
        
        // STATE B: Giriş yapmış kullanıcı için
        if (visitorMessage) visitorMessage.style.display = 'none';
        if (dashboardButton) dashboardButton.style.display = 'inline-block';
        
        // Landing page'i göster
        if (landingPage) landingPage.style.display = 'block';
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        
        // BEYAZ LİSTE: Sadece index.html, login.html veya / ise dashboard'a yönlendir
        const currentPath = window.location.pathname;
        const isWhitelistedPage = currentPath === '/' || 
                                   currentPath === '/index.html' || 
                                   currentPath.endsWith('index.html') ||
                                   currentPath === '/login.html' || 
                                   currentPath.endsWith('login.html');
        
        if (isWhitelistedPage) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // Kullanıcı çıkış yapmış
        if (authButtons) authButtons.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
        
        // STATE A: Çıkış yapmış kullanıcı için
        if (visitorMessage) visitorMessage.style.display = 'block';
        if (dashboardButton) dashboardButton.style.display = 'none';
        
        // Landing page'i göster
        if (landingPage) landingPage.style.display = 'block';
        if (welcomeScreen) welcomeScreen.style.display = 'none';
    }
});

// Login Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginErrorMsg = document.getElementById('loginErrorMsg');
    
    // Input event listeners to clear error on typing
    const clearLoginError = () => {
        if (loginErrorMsg) {
            loginErrorMsg.classList.add('hidden');
            loginErrorMsg.textContent = '';
            loginPassword.classList.remove('border-red-500', 'focus:border-red-500');
            loginPassword.classList.add('border-gray-300', 'focus:border-blue-500');
        }
    };
    
    if (loginEmail) {
        loginEmail.addEventListener('input', clearLoginError);
    }
    
    if (loginPassword) {
        loginPassword.addEventListener('input', clearLoginError);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                showNotification('Lütfen e-posta ve şifre girin', 'error');
                return;
            }

            // Firebase ile giriş yap
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    showNotification('Giriş başarılı!', 'success');
                    
                    // Formu temizle ve hatayı gizle
                    loginForm.reset();
                    clearLoginError();
                    closeModals();
                })
                .catch((error) => {
                    console.error('Giriş hatası:', error);
                    let errorMessage = 'E-posta veya şifre hatalı!';
                    
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
                    
                    // Show inline error instead of toast
                    if (loginErrorMsg) {
                        loginErrorMsg.textContent = errorMessage;
                        loginErrorMsg.classList.remove('hidden');
                        loginPassword.classList.remove('border-gray-300', 'focus:border-blue-500');
                        loginPassword.classList.add('border-red-500', 'focus:border-red-500');
                    }
                });
        });
    }
    
    // Register Form Handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('registerName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const passwordConfirm = document.getElementById('registerPasswordConfirm') ? document.getElementById('registerPasswordConfirm').value : '';

            if (!name || !email || !password) {
                showNotification('Lütfen tüm alanları doldurun', 'error');
                return;
            }

            if (password.length < 6) {
                showNotification('Şifre en az 6 karakter olmalıdır', 'error');
                return;
            }

            if (password !== passwordConfirm) {
                showNotification('Şifreler eşleşmiyor', 'error');
                return;
            }

            // Firebase ile kullanıcı oluştur
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    
                    // Kullanıcı profilini güncelle (displayName)
                    return updateProfile(user, { displayName: name })
                        .then(() => {
                            showNotification('Kayıt başarılı! Hoş geldiniz, ' + name, 'success');
                            
                            // Formları temizle
                            registerForm.reset();
                            closeModals();
                        });
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
                    
                    showNotification(errorMessage, 'error');
                });
        });
    }
    
    // Start button event listener
    document.getElementById('startButton')?.addEventListener('click', function() {
        handleStartButton();
    });
    
    // Dashboard button event listener (for logged in users)
    document.getElementById('dashboardButton')?.addEventListener('click', function() {
        window.location.href = 'dashboard.html';
    });
    
    // Login button event listener
    document.getElementById('loginBtn')?.addEventListener('click', function() {
        openLoginModal();
    });
    
    // Register button event listener
    document.getElementById('registerBtn')?.addEventListener('click', function() {
        openRegisterModal();
    });
    
    // Close register modal button event listener
    document.getElementById('closeRegisterModalBtn')?.addEventListener('click', function() {
        closeModals();
    });
    
    // Cancel register button event listener
    document.getElementById('cancelRegisterBtn')?.addEventListener('click', function() {
        closeModals();
    });
    
    // Close login modal button event listener
    document.getElementById('closeLoginModalBtn')?.addEventListener('click', function() {
        closeModals();
    });
    
    // Cancel login button event listener
    document.getElementById('cancelLoginBtn')?.addEventListener('click', function() {
        closeModals();
    });
    
    // Forgot password button event listener
    document.getElementById('forgotPasswordBtn')?.addEventListener('click', function() {
        const forgotPasswordModal = document.getElementById('forgotPasswordModal');
        if (forgotPasswordModal) {
            forgotPasswordModal.style.display = 'flex';
            // Copy email from login form to reset form
            const loginEmail = document.getElementById('loginEmail');
            const resetEmailInput = document.getElementById('resetEmailInput');
            if (loginEmail && resetEmailInput) {
                resetEmailInput.value = loginEmail.value;
            }
        }
    });
    
    // Close forgot password modal button event listener
    document.getElementById('closeForgotPasswordModalBtn')?.addEventListener('click', function() {
        const forgotPasswordModal = document.getElementById('forgotPasswordModal');
        if (forgotPasswordModal) {
            forgotPasswordModal.style.display = 'none';
        }
    });
    
    // Cancel forgot password button event listener
    document.getElementById('cancelForgotPasswordBtn')?.addEventListener('click', function() {
        const forgotPasswordModal = document.getElementById('forgotPasswordModal');
        if (forgotPasswordModal) {
            forgotPasswordModal.style.display = 'none';
        }
    });
    
    // Forgot password form handler
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('resetEmailInput').value.trim();
            
            if (!email) {
                showNotification('Lütfen e-posta adresinizi girin', 'error');
                return;
            }
            
            // Firebase ile şifre sıfırlama e-postası gönder
            sendPasswordResetEmail(auth, email)
                .then(() => {
                    showNotification('Şifre sıfırlama bağlantısı e-postanıza gönderildi. Lütfen gelen kutunuzu (ve Spam klasörünü) kontrol edin.', 'success');
                    
                    // Modalı kapat ve formu temizle
                    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
                    if (forgotPasswordModal) {
                        forgotPasswordModal.style.display = 'none';
                    }
                    forgotPasswordForm.reset();
                })
                .catch((error) => {
                    console.error('Şifre sıfırlama hatası:', error);
                    let errorMessage = 'Şifre sıfırlama işlemi başarısız oldu.';
                    
                    if (error.code === 'auth/user-not-found') {
                        errorMessage = 'Bu e-posta adresi kayıtlı değil.';
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = 'Geçersiz e-posta adresi.';
                    } else if (error.code === 'auth/network-request-failed') {
                        errorMessage = 'Ağ hatası. Lütfen internet bağlantınızı kontrol edin.';
                    }
                    
                    showNotification(errorMessage, 'error');
                });
        });
    }
});

// Modal dışına tıklayınca kapatma
document.addEventListener('click', function(e) {
    if (e.target && e.target.classList && e.target.classList.contains('modal')) {
        closeModals();
    }
});

// ESC tuşuna basınca modalları kapatma
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModals();
    }
});
