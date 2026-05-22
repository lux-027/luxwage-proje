// Firebase CDN Import'ları
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
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

window.showNotification = function(message, type = 'info') {
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

// "Hazırsanız Başlayalım" butonu için fonksiyon
window.handleStartButton = function() {
    if (auth.currentUser) {
        if (typeof luxwage !== 'undefined') {
            luxwage.showDashboard();
        }
    } else {
        showNotification('Devam etmek için lütfen giriş yapın veya kayıt olun', 'info');
        window.openLoginModal();
    }
};

window.logout = function() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        signOut(auth)
            .then(() => {
                showNotification('Başarıyla çıkış yapıldı', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            })
            .catch((error) => {
                console.error('Logout error:', error);
                showNotification('Çıkış yapılırken hata oluştu', 'error');
            });
    }
};

// Logout button event listener
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

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
            const userNameDisplay = document.getElementById('userNameDisplay');
            const userEmailDisplay = document.getElementById('userEmailDisplay');
            const dashboard = document.getElementById('dashboard');
            const landingPage = document.getElementById('landingPage');
            const welcomeScreen = document.getElementById('welcomeScreen');
            
            if (user) {
                // Kullanıcı giriş yapmış
                if (authButtons) authButtons.style.display = 'none';
                if (userProfile) userProfile.style.display = 'flex';
                
                // displayName varsa kullan, yoksa email kullan
                const displayName = user.displayName || user.email;
                if (userNameDisplay) userNameDisplay.textContent = displayName;
                if (userEmailDisplay) userEmailDisplay.textContent = user.email;
                
                // Dashboard'u göster, landing page ve welcome screen'i gizle
                if (dashboard) dashboard.style.display = 'block';
                if (landingPage) landingPage.style.display = 'none';
                if (welcomeScreen) welcomeScreen.style.display = 'none';
                
                showNotification('Hoş geldiniz, ' + displayName + '!', 'success');
                
                // Sayfa yenilenmede giriş yapmışsa dashboard'a yönlendir
                if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
                    setTimeout(() => this.showDashboard(), 1500);
                }
            } else {
                // Kullanıcı çıkış yapmış
                if (authButtons) authButtons.style.display = 'flex';
                if (userProfile) userProfile.style.display = 'none';
                
                // Dashboard'u ve welcome screen'i gizle, landing page'i göster
                if (dashboard) dashboard.style.display = 'none';
                if (welcomeScreen) welcomeScreen.style.display = 'none';
                if (landingPage) landingPage.style.display = 'block';
            }
        });
    }


    // Event Listener'ları kur
    setupEventListeners() {
        // Employee form submit
        const employeeForm = document.getElementById('employeeForm');
        if (employeeForm) {
            employeeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addEmployee();
            });
        }

        // Absence form submit
        const absenceForm = document.getElementById('absenceForm');
        if (absenceForm) {
            absenceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addAbsence();
            });
        }

        // Payment form submit
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addPayment();
            });
        }

        // Absence date change - calculate deduction
        const absenceDate = document.getElementById('absenceDate');
        if (absenceDate) {
            absenceDate.addEventListener('change', () => {
                this.calculateAbsenceDeduction();
            });
        }

        // Payment amount change - calculate remaining debt
        const paymentAmount = document.getElementById('paymentAmount');
        if (paymentAmount) {
            paymentAmount.addEventListener('input', () => {
                this.calculateRemainingDebt();
            });
        }
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
        localStorage.setItem('luxwage-employees', JSON.stringify(this.employees));
    }

    // Tarihi güncelle
    updateCurrentDate() {
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            const now = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
            dateElement.textContent = now.toLocaleDateString('tr-TR', options);
        }
    }

    // Eski verileri temizle
    cleanupOldData() {
        // Eski verileri temizleme mantığı eklenebilir
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        this.employees.forEach(employee => {
            if (employee.history) {
                employee.history = employee.history.filter(record => {
                    return new Date(record.date) >= thirtyDaysAgo;
                });
            }
        });
        
        this.saveData();
    }

    // Landing page'i göster
    showLandingPage() {
        const landingPage = document.getElementById('landingPage');
        const dashboard = document.getElementById('dashboard');
        
        if (landingPage) landingPage.style.display = 'block';
        if (dashboard) dashboard.style.display = 'none';
        
        localStorage.setItem('luxwage-first-visit', 'true');
    }

    // Dashboard'u göster
    showDashboard() {
        const landingPage = document.getElementById('landingPage');
        const dashboard = document.getElementById('dashboard');
        
        if (landingPage) landingPage.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        
        localStorage.setItem('luxwage-first-visit', 'false');
        
        this.showPage('home');
    }

    // Sayfa göster
    showPage(pageName) {
        this.currentPage = pageName;
        const pageContent = document.getElementById('pageContent');
        const pageTitle = document.getElementById('pageTitle');
        
        if (!pageContent || !pageTitle) return;
        
        // Nav item'larını güncelle
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('bg-blue-800', 'text-white');
            item.classList.add('hover:bg-blue-800');
        });
        
        const activeNav = document.querySelector(`[onclick="showPage('${pageName}')"]`);
        if (activeNav) {
            activeNav.classList.add('bg-blue-800', 'text-white');
            activeNav.classList.remove('hover:bg-blue-800');
        }
        
        switch(pageName) {
            case 'home':
                pageTitle.textContent = 'Ana Sayfa';
                this.renderHomePage();
                break;
            case 'employees':
                pageTitle.textContent = 'Çalışanlarım';
                this.renderEmployeesPage();
                break;
        }
    }

    // Ana sayfayı render et
    renderHomePage() {
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) return;
        
        const totalEmployees = this.employees.length;
        const totalDebt = this.employees.reduce((sum, emp) => sum + (emp.debt || 0), 0);
        
        pageContent.innerHTML = `
            <div class="grid md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">Toplam Çalışan</p>
                            <p class="text-3xl font-bold text-gray-800">${totalEmployees}</p>
                        </div>
                        <div class="bg-emerald-100 p-3 rounded-full">
                            <i class="fas fa-users text-emerald-500 text-2xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">Toplam Borç</p>
                            <p class="text-3xl font-bold text-gray-800">${totalDebt.toFixed(2)} TL</p>
                        </div>
                        <div class="bg-red-100 p-3 rounded-full">
                            <i class="fas fa-money-bill-wave text-red-500 text-2xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">Aktif İşlemler</p>
                            <p class="text-3xl font-bold text-gray-800">0</p>
                        </div>
                        <div class="bg-blue-100 p-3 rounded-full">
                            <i class="fas fa-chart-line text-blue-500 text-2xl"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-clock text-blue-500 mr-2"></i>
                    Hızlı İşlemler
                </h2>
                <div class="grid md:grid-cols-2 gap-4">
                    <button onclick="openModal('employeeModal')" class="bg-emerald-500 text-white px-6 py-4 rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center">
                        <i class="fas fa-user-plus mr-2"></i>
                        Yeni İşçi Ekle
                    </button>
                    <button onclick="showPage('employees')" class="bg-blue-500 text-white px-6 py-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center">
                        <i class="fas fa-users mr-2"></i>
                        Çalışanları Görüntüle
                    </button>
                </div>
            </div>
        `;
    }

    // Çalışanlar sayfasını render et
    renderEmployeesPage() {
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) return;
        
        if (this.employees.length === 0) {
            pageContent.innerHTML = `
                <div class="bg-white rounded-xl shadow-lg p-8 text-center">
                    <i class="fas fa-users text-gray-300 text-6xl mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Henüz çalışan yok</h3>
                    <p class="text-gray-500 mb-4">İlk çalışanınızı eklemek için butona tıklayın</p>
                    <button onclick="openModal('employeeModal')" class="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors">
                        <i class="fas fa-user-plus mr-2"></i>
                        Yeni İşçi Ekle
                    </button>
                </div>
            `;
            return;
        }
        
        let employeesHTML = this.employees.map((emp, index) => `
            <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <div class="bg-blue-100 p-3 rounded-full mr-4">
                            <i class="fas fa-user text-blue-500 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800">${emp.name}</h3>
                            <p class="text-gray-500 text-sm">${emp.phone}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-bold text-gray-800">${emp.salaryAmount} TL</p>
                        <p class="text-sm text-gray-500">${emp.salaryType === 'weekly' ? 'Haftalık' : 'Aylık'}</p>
                    </div>
                </div>
                
                <div class="flex items-center justify-between">
                    <div class="text-sm">
                        <span class="text-gray-500">Borç: </span>
                        <span class="font-bold ${emp.debt > 0 ? 'text-red-500' : 'text-green-500'}">${(emp.debt || 0).toFixed(2)} TL</span>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="openAbsenceModal(${index})" class="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm">
                            <i class="fas fa-calendar-times mr-1"></i>
                            Devamsızlık
                        </button>
                        <button onclick="openPaymentModal(${index})" class="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm">
                            <i class="fas fa-money-check-alt mr-1"></i>
                            Ödeme
                        </button>
                        <button onclick="showHistory(${index})" class="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                            <i class="fas fa-history mr-1"></i>
                            Geçmiş
                        </button>
                        <button onclick="deleteEmployee(${index})" class="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm">
                            <i class="fas fa-trash mr-1"></i>
                            Sil
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        pageContent.innerHTML = `
            <div class="mb-4">
                <button onclick="openModal('employeeModal')" class="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors">
                    <i class="fas fa-user-plus mr-2"></i>
                    Yeni İşçi Ekle
                </button>
            </div>
            <div class="grid gap-4">
                ${employeesHTML}
            </div>
        `;
    }

    // İşçi ekle
    addEmployee() {
        const name = document.getElementById('employeeName').value.trim();
        const phone = document.getElementById('employeePhone').value.trim();
        const salaryType = document.getElementById('salaryType').value;
        const closedDay = parseInt(document.getElementById('closedDay').value);
        const salaryAmount = parseFloat(document.getElementById('salaryAmount').value);
        
        if (!name || !phone || !salaryType || isNaN(closedDay) || isNaN(salaryAmount)) {
            showNotification('Lütfen tüm alanları doldurun', 'error');
            return;
        }
        
        const employee = {
            id: Date.now(),
            name,
            phone,
            salaryType,
            closedDay,
            salaryAmount,
            debt: 0,
            history: []
        };
        
        this.employees.push(employee);
        this.saveData();
        
        document.getElementById('employeeForm').reset();
        closeModal('employeeModal');
        
        showNotification('İşçi başarıyla eklendi', 'success');
        this.renderEmployeesPage();
    }

    // Devamsızlık ekle
    addAbsence() {
        const employeeId = parseInt(document.getElementById('absenceEmployeeId').value);
        const date = document.getElementById('absenceDate').value;
        
        if (!date) {
            showNotification('Lütfen tarih seçin', 'error');
            return;
        }
        
        const employee = this.employees.find(emp => emp.id === employeeId);
        if (!employee) return;
        
        const deduction = this.calculateDailyWage(employee);
        
        employee.debt = (employee.debt || 0) + deduction;
        employee.history.push({
            type: 'absence',
            date,
            amount: deduction,
            description: 'Devamsızlık'
        });
        
        this.saveData();
        closeModal('absenceModal');
        
        showNotification(`Devamsızlık kaydedildi. Kesinti: ${deduction.toFixed(2)} TL`, 'success');
        this.renderEmployeesPage();
    }

    // Ödeme ekle
    addPayment() {
        const employeeId = parseInt(document.getElementById('paymentEmployeeId').value);
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        
        if (isNaN(amount) || amount <= 0) {
            showNotification('Lütfen geçerli bir tutar girin', 'error');
            return;
        }
        
        const employee = this.employees.find(emp => emp.id === employeeId);
        if (!employee) return;
        
        employee.debt = (employee.debt || 0) - amount;
        employee.history.push({
            type: 'payment',
            date: new Date().toISOString().split('T')[0],
            amount: -amount,
            description: 'Ödeme'
        });
        
        this.saveData();
        closeModal('paymentModal');
        
        showNotification(`${amount.toFixed(2)} TL ödeme kaydedildi`, 'success');
        this.renderEmployeesPage();
    }

    // Günlük ücret hesapla
    calculateDailyWage(employee) {
        if (employee.salaryType === 'weekly') {
            return employee.salaryAmount / 6;
        } else {
            return employee.salaryAmount / 26;
        }
    }

    // Devamsızlık kesintisini hesapla
    calculateAbsenceDeduction() {
        const employeeId = parseInt(document.getElementById('absenceEmployeeId').value);
        const employee = this.employees.find(emp => emp.id === employeeId);
        
        if (!employee) return;
        
        const deduction = this.calculateDailyWage(employee);
        document.getElementById('absenceDeduction').textContent = deduction.toFixed(2) + ' TL';
        
        const wageInfo = employee.salaryType === 'weekly' 
            ? `Haftalık ${employee.salaryAmount} TL / 6 gün = ${deduction.toFixed(2)} TL/gün`
            : `Aylık ${employee.salaryAmount} TL / 26 gün = ${deduction.toFixed(2)} TL/gün`;
        document.getElementById('wageCalculation').textContent = wageInfo;
    }

    // Kalan borcu hesapla
    calculateRemainingDebt() {
        const currentDebt = parseFloat(document.getElementById('currentDebt').value) || 0;
        const paymentAmount = parseFloat(document.getElementById('paymentAmount').value) || 0;
        const remaining = Math.max(0, currentDebt - paymentAmount);
        document.getElementById('remainingDebt').textContent = remaining.toFixed(2) + ' TL';
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
                showNotification('Lütfen e-posta ve şifre girin', 'error');
                return;
            }

            // Firebase ile giriş yap
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    showNotification('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
                    
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
                    
                    showNotification(errorMessage, 'error');
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

// Hoş geldin ekranını göster
window.showWelcomeScreen = function(userName) {
    const landingPage = document.getElementById('landingPage');
    const dashboard = document.getElementById('dashboard');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const welcomeUserName = document.getElementById('welcomeUserName');
    
    if (welcomeUserName) {
        welcomeUserName.textContent = userName;
    }
    
    if (landingPage) landingPage.style.display = 'none';
    if (dashboard) dashboard.style.display = 'none';
    if (welcomeScreen) welcomeScreen.style.display = 'block';
    
    // Welcome start button event listener
    const welcomeStartButton = document.getElementById('welcomeStartButton');
    if (welcomeStartButton) {
        welcomeStartButton.onclick = function() {
            if (welcomeScreen) welcomeScreen.style.display = 'none';
            if (dashboard) dashboard.style.display = 'block';
            luxwage.showDashboard();
        };
    }
};

// Modal açma fonksiyonu
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
};

// Modal kapatma fonksiyonu
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
};

// Devamsızlık modalını aç
window.openAbsenceModal = function(employeeIndex) {
    const employee = luxwage.employees[employeeIndex];
    if (!employee) return;
    
    document.getElementById('absenceEmployeeId').value = employee.id;
    document.getElementById('absenceEmployeeName').value = employee.name;
    document.getElementById('absenceDate').value = '';
    document.getElementById('absenceDeduction').textContent = '0 TL';
    document.getElementById('wageCalculation').textContent = 'Yevmiye hesaplanıyor...';
    
    openModal('absenceModal');
};

// Ödeme modalını aç
window.openPaymentModal = function(employeeIndex) {
    const employee = luxwage.employees[employeeIndex];
    if (!employee) return;
    
    document.getElementById('paymentEmployeeId').value = employee.id;
    document.getElementById('paymentEmployeeName').value = employee.name;
    document.getElementById('currentDebt').value = (employee.debt || 0).toFixed(2);
    document.getElementById('paymentAmount').value = '';
    document.getElementById('remainingDebt').textContent = (employee.debt || 0).toFixed(2) + ' TL';
    
    openModal('paymentModal');
};

// Geçmişi göster
window.showHistory = function(employeeIndex) {
    const employee = luxwage.employees[employeeIndex];
    if (!employee) return;
    
    document.getElementById('historyEmployeeName').textContent = employee.name;
    
    const historyContent = document.getElementById('historyContent');
    if (!employee.history || employee.history.length === 0) {
        historyContent.innerHTML = '<p class="text-gray-500 text-center">Henüz geçmiş kaydı yok</p>';
    } else {
        historyContent.innerHTML = employee.history.map(record => `
            <div class="bg-gray-50 rounded-lg p-4 border-l-4 ${record.type === 'absence' ? 'border-red-500' : 'border-green-500'}">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-semibold text-gray-800">${record.description}</p>
                        <p class="text-sm text-gray-500">${record.date}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold ${record.amount > 0 ? 'text-red-500' : 'text-green-500'}">
                            ${record.amount > 0 ? '+' : ''}${record.amount.toFixed(2)} TL
                        </p>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    openModal('historyModal');
};

// İşçi sil
window.deleteEmployee = function(employeeIndex) {
    if (confirm('Bu çalışanı silmek istediğinize emin misiniz?')) {
        luxwage.employees.splice(employeeIndex, 1);
        luxwage.saveData();
        luxwage.renderEmployeesPage();
        showNotification('İşçi silindi', 'success');
    }
};

// Yasal bilgileri göster
window.showLegalInfo = function(type) {
    const legalTitle = document.getElementById('legalTitle');
    const legalContent = document.getElementById('legalContent');
    
    const legalTexts = {
        privacy: {
            title: 'Gizlilik Politikası',
            content: `
                <h4 class="text-lg font-semibold mb-3">Veri Toplama</h4>
                <p class="mb-4">LuxWage, çalışan bilgilerinizi sadece sizin izninizle toplar ve saklar.</p>
                
                <h4 class="text-lg font-semibold mb-3">Veri Kullanımı</h4>
                <p class="mb-4">Toplanan veriler sadece maaş ve devamsızlık takibi için kullanılır.</p>
                
                <h4 class="text-lg font-semibold mb-3">Veri Güvenliği</h4>
                <p class="mb-4">Tüm verileriniz güvenli bir şekilde saklanır ve üçüncü şahıslarla paylaşılmaz.</p>
            `
        },
        terms: {
            title: 'Kullanım Şartları',
            content: `
                <h4 class="text-lg font-semibold mb-3">Kabul Edilme</h4>
                <p class="mb-4">Bu uygulamayı kullanarak aşağıdaki şartları kabul etmiş sayılırsınız.</p>
                
                <h4 class="text-lg font-semibold mb-3">Kullanım Sorumluluğu</h4>
                <p class="mb-4">Uygulamayı yasal ve etik kurallara uygun şekilde kullanmak sizin sorumluluğunuzdadır.</p>
                
                <h4 class="text-lg font-semibold mb-3">Değişiklikler</h4>
                <p class="mb-4">Bu şartlar herhangi bir zamanda değiştirilebilir.</p>
            `
        },
        about: {
            title: 'Hakkımızda',
            content: `
                <h4 class="text-lg font-semibold mb-3">LuxWage</h4>
                <p class="mb-4">LuxWage, işletmelerin çalışan maaş ve devamsızlık takibini kolaylaştırmak için geliştirilmiş modern bir yönetim sistemidir.</p>
                
                <h4 class="text-lg font-semibold mb-3">Misyonumuz</h4>
                <p class="mb-4">İşletme yönetimini basitleştirmek ve verimliliği artırmak.</p>
                
                <h4 class="text-lg font-semibold mb-3">İletişim</h4>
                <p class="mb-4">Sorularınız için bize ulaşabilirsiniz.</p>
            `
        },
        contact: {
            title: 'İletişim',
            content: `
                <h4 class="text-lg font-semibold mb-3">Bize Ulaşın</h4>
                <p class="mb-4">Herhangi bir sorunuz veya öneriniz için bize ulaşabilirsiniz.</p>
                
                <h4 class="text-lg font-semibold mb-3">E-posta</h4>
                <p class="mb-4">info@luxwage.com</p>
                
                <h4 class="text-lg font-semibold mb-3">Çalışma Saatleri</h4>
                <p class="mb-4">Pazartesi - Cuma: 09:00 - 18:00</p>
            `
        },
        cookies: {
            title: 'Çerez Politikası',
            content: `
                <h4 class="text-lg font-semibold mb-3">Çerezler Nedir?</h4>
                <p class="mb-4">Çerezler, tarayıcınızda saklanan küçük metin dosyalarıdır.</p>
                
                <h4 class="text-lg font-semibold mb-3">Nasıl Kullanıyoruz?</h4>
                <p class="mb-4">LuxWage, kullanıcı deneyimini iyileştirmek için çerezleri kullanır.</p>
                
                <h4 class="text-lg font-semibold mb-3">Çerez Yönetimi</h4>
                <p class="mb-4">Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.</p>
            `
        }
    };
    
    const info = legalTexts[type];
    if (info) {
        legalTitle.textContent = info.title;
        legalContent.innerHTML = info.content;
        openModal('legalModal');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // LuxWage zaten yukarıda oluşturuldu
    
    // Register formu
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
                            window.closeModals();
                            
                            // Hoş geldin ekranını göster
                            setTimeout(() => showWelcomeScreen(name), 500);
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
                showNotification('Devam etmek için lütfen giriş yapın veya kayıt olun', 'info');
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
