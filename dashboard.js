// Firebase CDN Import'ları
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

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

// Global variable for employee deletion
let employeeIdToDelete = null;
let employeeIdToTerminate = null;

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

// Logout fonksiyonu
function logout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        signOut(auth)
            .then(() => {
                showNotification('Başarıyla çıkış yapıldı', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            })
            .catch((error) => {
                console.error('Logout error:', error);
                showNotification('Çıkış yapılırken hata oluştu', 'error');
            });
    }
};

// Firebase Auth State Listener - Dashboard
onAuthStateChanged(auth, (user) => {
    // Beyaz liste (whitelist) - yasal sayfalar
    const serbestSayfalar = [
        'gizlilik-politikasi.html', 
        'kullanim-sartlari.html', 
        'hakkimizda.html', 
        'iletisim.html', 
        'cerez-politikasi.html'
    ];
    const suAnkiSayfa = window.location.pathname;
    
    // Eğer kullanıcı bu serbest/yasal sayfalardan birindeyse, yönlendirme motorunu durdur
    const yasalSayfadaMiyim = serbestSayfalar.some(page => suAnkiSayfa.includes(page));
    if (yasalSayfadaMiyim) {
        return;
    }

    if (user) {
        // Kullanıcı giriş yapmış - hiçbir yönlendirme yapma, kullanıcı neredeyse orada kalsın
    } else {
        // Kullanıcı giriş YAPMAMIŞSA ve dashboard'a girmeye çalışıyorsa index'e fırlat
        if (suAnkiSayfa.includes('dashboard.html')) {
            window.location.href = 'index.html';
        }
    }
});

// LuxWage - Maaş ve Devamsızlık Takip Sistemi
// Dashboard JavaScript Dosyası

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
        this.showPage('home');
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

        // Employee start date change - update debt estimate
        const employeeStartDate = document.getElementById('employeeStartDate');
        if (employeeStartDate) {
            employeeStartDate.addEventListener('change', () => {
                this.updateEmployeeStartDateEstimate();
            });
        }

        // Salary type or amount change should also update the estimate
        const salaryType = document.getElementById('salaryType');
        const salaryAmount = document.getElementById('salaryAmount');
        if (salaryType) {
            salaryType.addEventListener('change', () => {
                this.updateEmployeeStartDateEstimate();
            });
        }
        if (salaryAmount) {
            salaryAmount.addEventListener('input', () => {
                this.updateEmployeeStartDateEstimate();
            });
        }

        // Closed day checkboxes should update the estimate too
        const closedDaysCheckboxes = document.querySelectorAll('input[name="closedDays"]');
        closedDaysCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                this.updateEmployeeStartDateEstimate();
            });
        });

        // Payment amount change - calculate remaining debt
        const paymentAmountInput = document.getElementById('paymentAmount');
        if (paymentAmountInput) {
            paymentAmountInput.addEventListener('input', () => {
                this.calculateRemainingDebt();
            });
        }
        
        // Phone number auto-format
        const employeePhone = document.getElementById('employeePhone');
        if (employeePhone) {
            employeePhone.addEventListener('input', (e) => {
                let val = e.target.value.replace(/\D/g, '');
                
                if (val.length > 0) {
                    if (val.length <= 4) {
                        val = val;
                    } else if (val.length <= 7) {
                        val = val.slice(0, 4) + ' ' + val.slice(4);
                    } else if (val.length <= 9) {
                        val = val.slice(0, 4) + ' ' + val.slice(4, 7) + ' ' + val.slice(7);
                    } else {
                        val = val.slice(0, 4) + ' ' + val.slice(4, 7) + ' ' + val.slice(7, 9) + ' ' + val.slice(9, 11);
                    }
                }
                
                e.target.value = val;
            });
        }
        
        // Salary amount auto-format with Turkish thousand separator (salaryAmount already declared above)
        if (salaryAmount) {
            salaryAmount.addEventListener('input', (e) => {
                let val = e.target.value.replace(/\D/g, '');
                
                if (val.length > 0) {
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                        e.target.value = num.toLocaleString('tr-TR');
                    } else {
                        e.target.value = '';
                    }
                } else {
                    e.target.value = '';
                }
            });
        }
    }

    // LocalStorage'dan verileri yükle
    loadData() {
        try {
            const employeesData = localStorage.getItem('luxwage-employees');
            if (employeesData) {
                const parsed = JSON.parse(employeesData);
                this.employees = Array.isArray(parsed) ? parsed : [];
            } else {
                this.employees = [];
            }
        } catch (error) {
            console.error('LocalStorage veri yükleme hatası:', error);
            this.employees = [];
        }
    }

    // LocalStorage'a verileri kaydet
    saveData() {
        try {
            console.log('Kaydedilen veri:', this.employees);
            localStorage.setItem('luxwage-employees', JSON.stringify(this.employees));
        } catch (error) {
            console.error('LocalStorage veri kaydetme hatası:', error);
        }
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

    // Sayfa göster
    showPage(pageName) {
        this.currentPage = pageName;
        const homeSection = document.getElementById('homeSection');
        const employeesSection = document.getElementById('employeesSection');
        const accountSection = document.getElementById('accountSection');
        const pastEmployeesSection = document.getElementById('pastEmployeesSection');
        const pageTitle = document.getElementById('pageTitle');
        
        // Hide all sections
        if (homeSection) homeSection.style.display = 'none';
        if (employeesSection) employeesSection.style.display = 'none';
        if (accountSection) accountSection.style.display = 'none';
        if (pastEmployeesSection) pastEmployeesSection.style.display = 'none';
        
        // Nav item'larını güncelle
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('bg-white/10', 'text-white');
            item.classList.add('text-gray-300');
        });
        
        const activeNav = document.getElementById(pageName + 'PageBtn');
        if (activeNav) {
            activeNav.classList.remove('text-gray-300');
            activeNav.classList.add('bg-white/10', 'text-white');
        }
        
        switch(pageName) {
            case 'home':
                if (pageTitle) pageTitle.textContent = 'Ana Sayfa';
                if (homeSection) homeSection.style.display = 'block';
                this.renderHomePage();
                break;
            case 'employees':
                if (pageTitle) pageTitle.textContent = 'Çalışanlarım';
                if (employeesSection) employeesSection.style.display = 'block';
                this.renderEmployeesPage();
                break;
            case 'account':
                if (pageTitle) pageTitle.textContent = 'Hesabım';
                if (accountSection) accountSection.style.display = 'block';
                this.renderAccountPage();
                break;
            case 'pastEmployees':
                if (pageTitle) pageTitle.textContent = 'Geçmiş Çalışanlar';
                if (pastEmployeesSection) pastEmployeesSection.style.display = 'block';
                this.renderPastEmployeesPage();
                break;
        }
    }

    // Ana sayfayı render et
    renderHomePage() {
        const homeSection = document.getElementById('homeSection');
        if (!homeSection) return;
        
        const activeEmployees = this.employees.filter(emp => emp.status !== 'inactive');
        const totalEmployees = activeEmployees.length;
        const totalDebt = activeEmployees.reduce((sum, emp) => sum + this.calculateCurrentDebt(emp), 0);
        
        homeSection.innerHTML = `
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
                            <p class="text-3xl font-bold text-gray-800">${totalDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</p>
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
                    <i class="fas fa-bell text-blue-500 mr-2"></i>
                    Son İşlemler ve Bildirimler
                </h2>
                <div id="recentActivityList">
                    <!-- Activities will be loaded here -->
                </div>
            </div>
        `;
        
        this.renderRecentActivities();
    }

    // Son işlemleri render et
    renderRecentActivities() {
        const recentActivityList = document.getElementById('recentActivityList');
        if (!recentActivityList) return;
        
        const activities = [];
        
        // Tüm çalışanların ödeme, devamsızlık ve aktivite geçmişini topla
        this.employees.forEach(emp => {
            // İşe başlama tarihi (yeni çalışan bildirimi)
            if (emp.startDate) {
                activities.push({
                    type: 'new_employee',
                    employeeName: emp.name,
                    message: 'Yeni çalışan sisteme başarıyla eklendi',
                    timestamp: emp.startDate
                });
            }
            
            // Ödeme geçmişi
            if (emp.paymentHistory && emp.paymentHistory.length > 0) {
                emp.paymentHistory.forEach(payment => {
                    activities.push({
                        type: 'payment',
                        employeeName: emp.name,
                        amount: payment.amount,
                        date: payment.date,
                        timestamp: payment.timestamp || Date.now()
                    });
                });
            }
            
            // Devamsızlık geçmişi
            if (emp.absenceHistory && emp.absenceHistory.length > 0) {
                emp.absenceHistory.forEach(absence => {
                    activities.push({
                        type: 'absence',
                        employeeName: emp.name,
                        date: absence.date,
                        deduction: absence.deduction,
                        timestamp: absence.timestamp || Date.now()
                    });
                });
            }
            
            // Aktivite geçmişi (iş durdurma, işten çıkarma vb.)
            if (emp.activityHistory && emp.activityHistory.length > 0) {
                emp.activityHistory.forEach(activity => {
                    activities.push({
                        type: activity.type,
                        employeeName: activity.employeeName,
                        message: activity.message,
                        timestamp: activity.timestamp
                    });
                });
            }
            
            // Borç bazlı bildirim kontrolü (5.000, 10.000, 15.000...)
            const debtWarning = this.checkDebtWarning(emp);
            if (debtWarning) {
                activities.push({
                    type: 'debt_warning',
                    employeeName: emp.name,
                    message: debtWarning.message,
                    timestamp: Date.now()
                });
            }
        });
        
        // Tarihe göre sırala (yeniden eskiye)
        activities.sort((a, b) => b.timestamp - a.timestamp);
        
        // Eğer aktivite yoksa
        if (activities.length === 0) {
            recentActivityList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-3"></i>
                    <p>Henüz işlem kaydı yok</p>
                </div>
            `;
            return;
        }
        
        // Aktiviteleri render et
        const activitiesHTML = activities.slice(0, 10).map(activity => {
            const timeAgo = this.getTimeAgo(activity.timestamp);
            const dateStr = new Date(activity.timestamp).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            
            if (activity.type === 'new_employee') {
                return `
                    <div class="flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-blue-100 p-3 rounded-full mr-4">
                            <i class="fas fa-user text-blue-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800">${activity.employeeName} - ${activity.message}</p>
                            <p class="text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            } else if (activity.type === 'payment') {
                return `
                    <div class="flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-green-100 p-3 rounded-full mr-4">
                            <i class="fas fa-money-bill-wave text-green-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800">${activity.employeeName} isimli çalışana ${activity.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL ödeme yapıldı</p>
                            <p class="text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            } else if (activity.type === 'absence') {
                return `
                    <div class="flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-red-100 p-3 rounded-full mr-4">
                            <i class="fas fa-calendar-times text-red-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800">${activity.employeeName} isimli çalışana devamsızlık kaydı (${activity.deduction.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL kesinti)</p>
                            <p class="text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            } else if (activity.type === 'warning') {
                return `
                    <div class="flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-yellow-100 p-3 rounded-full mr-4">
                            <i class="fas fa-exclamation-triangle text-yellow-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800">${activity.employeeName} - ${activity.message}</p>
                            <p class="text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            } else if (activity.type === 'work_stopped') {
                return `
                    <div class="flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-yellow-100 p-3 rounded-full mr-4">
                            <i class="fas fa-pause-circle text-yellow-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800">${activity.employeeName} - ${activity.message}</p>
                            <p class="text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            } else if (activity.type === 'work_resumed') {
                return `
                    <div class="flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-green-100 p-3 rounded-full mr-4">
                            <i class="fas fa-play-circle text-green-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800">${activity.employeeName} - ${activity.message}</p>
                            <p class="text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            } else if (activity.type === 'terminated') {
                return `
                    <div class="flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-orange-100 p-3 rounded-full mr-4">
                            <i class="fas fa-door-open text-orange-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800">${activity.employeeName} - ${activity.message}</p>
                            <p class="text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            } else if (activity.type === 'debt_warning') {
                return `
                    <div class="flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-red-100 p-3 rounded-full mr-4">
                            <i class="fas fa-exclamation-circle text-red-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800">${activity.employeeName} - ${activity.message}</p>
                            <p class="text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            }
        }).join('');
        
        recentActivityList.innerHTML = activitiesHTML;
    }
    
    // Borç bazlı bildirim kontrolü (5.000, 10.000, 15.000...)
    checkDebtWarning(employee) {
        if (!employee.startDate) return null;
        
        // Sadece aktif çalışanlar için bildirim gönder
        if (employee.status === 'inactive') return null;
        
        const currentDebt = this.calculateCurrentDebt(employee);
        
        // Her 5.000 TL artışta bildirim
        const threshold = 5000;
        const debtLevel = Math.floor(currentDebt / threshold);
        
        if (debtLevel >= 1) {
            const debtDisplay = currentDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return {
                message: `Borç ${debtDisplay} TL'ye ulaştı (Seviye ${debtLevel})`
            };
        }
        
        return null;
    }
    
    // Ödeme günü kontrolü
    checkPaymentDue(employee) {
        if (!employee.startDate) return null;
        
        const now = new Date();
        const startDate = new Date(employee.startDate);
        const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
        
        // Yeni işçiler için (0 gün) ödeme uyarısı verme
        if (daysSinceStart < 1) return null;
        
        const currentDebt = this.calculateCurrentDebt(employee);
        const debtDisplay = currentDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        if (employee.salaryType === 'weekly') {
            // Haftalık çalışanlar için her 7 günde bir ödeme günü
            // En az bir hafta (7 gün) geçmiş olmalı
            if (daysSinceStart < 7) return null;
            
            const weeksSinceStart = Math.floor(daysSinceStart / 7);
            const daysSinceLastPayment = daysSinceStart % 7;
            
            // Son 3 gün içinde ödeme günü geldi mi?
            if (daysSinceLastPayment <= 3 && daysSinceLastPayment >= 0) {
                return {
                    message: `Haftalık ödeme günü geldi (${daysSinceLastPayment === 0 ? 'Bugün' : daysSinceLastPayment + ' gün önce'}) - Borç: ${debtDisplay} TL`,
                    amount: currentDebt
                };
            }
        } else if (employee.salaryType === 'monthly') {
            // Aylık çalışanlar için her 30 günde bir ödeme günü
            // En az bir ay (30 gün) geçmiş olmalı
            if (daysSinceStart < 30) return null;
            
            const monthsSinceStart = Math.floor(daysSinceStart / 30);
            const daysSinceLastPayment = daysSinceStart % 30;
            
            // Son 5 gün içinde ödeme günü geldi mi?
            if (daysSinceLastPayment <= 5 && daysSinceLastPayment >= 0) {
                return {
                    message: `Aylık ödeme günü geldi (${daysSinceLastPayment === 0 ? 'Bugün' : daysSinceLastPayment + ' gün önce'}) - Borç: ${debtDisplay} TL`,
                    amount: currentDebt
                };
            }
        } else if (employee.salaryType === 'daily') {
            // Günlük çalışanlar için her gün ödeme günü
            // En az 1 gün geçmiş olmalı
            if (daysSinceStart < 1) return null;
            
            return {
                message: `Günlük ödeme günü geldi - Borç: ${debtDisplay} TL`,
                amount: currentDebt
            };
        }
        
        return null;
    }
    
    // Zaman farkını hesapla
    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) {
            return 'Az önce';
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} dakika önce`;
        } else if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            return `${hours} saat önce`;
        } else if (seconds < 604800) {
            const days = Math.floor(seconds / 86400);
            return `${days} gün önce`;
        } else {
            const date = new Date(timestamp);
            return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        }
    }
    
    // Çalışma süresini hesapla
    calculateWorkingDuration(startDate) {
        const start = new Date(startDate);
        const now = new Date();
        
        // Tarih farkını gün olarak hesapla
        const diffTime = Math.abs(now - start);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // Günleri yıl, ay ve güne çevir
        let years = Math.floor(diffDays / 365);
        let remainingDays = diffDays % 365;
        let months = Math.floor(remainingDays / 30);
        let days = remainingDays % 30;
        
        // Eğer sadece 1 aydan az ise, 0 Ay, X Gün şeklinde göster
        if (years === 0 && months === 0 && days > 0) {
            return `${days} Gün süredir çalışıyor`;
        }
        
        // Eğer sadece 1 yıldan az ise, X Ay, Y Gün şeklinde göster
        if (years === 0 && months > 0) {
            const parts = [];
            parts.push(`${months} Ay`);
            if (days > 0) parts.push(`${days} Gün`);
            return parts.join(', ') + ' süredir çalışıyor';
        }
        
        // Formatla
        const parts = [];
        if (years > 0) parts.push(`${years} Yıl`);
        if (months > 0) parts.push(`${months} Ay`);
        if (days > 0) parts.push(`${days} Gün`);
        
        // Eğer tüm değerler 0 ise
        if (parts.length === 0) return 'Bugün başladı';
        
        return parts.join(', ') + ' süredir çalışıyor';
    }

    // Çalışanlar sayfasını render et
    renderEmployeesPage() {
        const employeesSection = document.getElementById('employeesSection');
        if (!employeesSection) return;
        
        // Sadece aktif çalışanları filtrele
        const activeEmployees = this.employees.filter(emp => emp.status !== 'inactive');
        
        if (activeEmployees.length === 0) {
            employeesSection.innerHTML = `
                <div class="bg-white rounded-xl shadow-lg p-8 text-center">
                    <i class="fas fa-users text-gray-300 text-6xl mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Henüz çalışan yok</h3>
                    <p class="text-gray-500 mb-4">İlk çalışanınızı eklemek için butona tıklayın</p>
                    <button id="addEmployeeBtn" class="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors">
                        <i class="fas fa-user-plus mr-2"></i>
                        Yeni İşçi Ekle
                    </button>
                </div>
            `;
            return;
        }
        
        let employeesHTML = activeEmployees.map((emp, index) => {
            // Original index in the full employees array
            const originalIndex = this.employees.indexOf(emp);
            const startDate = emp.startDate ? new Date(emp.startDate) : null;
            const startDateStr = startDate ? startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirtilmemiş';
            const dailyLogs = emp.startDate ? this.calculateDailyLogs(emp) : [];
            
            // Calculate debt using calculateCurrentDebt (includes payments)
            const debtValue = this.calculateCurrentDebt(emp);
            emp.debt = debtValue;
            
            // Safe variable definitions with fallback values
            const dailyRate = this.calculateDailyWage(emp) || 0;
            const rateValue = dailyRate || 0;
            const formattedDebt = debtValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const formattedDailyRate = rateValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const totalWorkDays = dailyLogs.length;
            
            // Status check for today's earnings display
            const today = new Date();
            const todayStatus = this.getStatusForDate(today);
            const isPending = todayStatus === "Bekleniyor";
            
            // Check if today is an absence day
            const todayStr = today.toISOString().split('T')[0];
            const isTodayAbsent = emp.absenceHistory && emp.absenceHistory.some(absence => absence.date === todayStr);
            
            // Dynamic styling based on status
            let bgColor, borderColor, textColor, titleText, amountText;
            
            if (isTodayAbsent) {
                // Devamsızlık günü - kırmızı kart
                bgColor = "bg-red-500/50";
                borderColor = "border-red-500/50";
                textColor = "text-white";
                titleText = "Bugün Gelmedi";
                amountText = "Devamsızlık";
            } else if (isPending) {
                // Bekleniyor - turuncu kart
                bgColor = "bg-orange-500/50";
                borderColor = "border-orange-500/50";
                textColor = "text-white";
                titleText = "Bekleniyor";
                amountText = `${formattedDailyRate} TL Eklenecek`;
            } else {
                // Eklenecek Tutar - yeşil kart
                bgColor = "bg-emerald-500/20";
                borderColor = "border-emerald-500/30";
                textColor = "text-emerald-400";
                titleText = "Eklenecek Tutar";
                amountText = `+${formattedDailyRate} TL`;
            }
            
            return `
            <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <div class="bg-blue-100 p-3 rounded-full mr-4">
                            <i class="fas fa-user text-blue-500 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800">${emp.name}</h3>
                            <p class="text-gray-500 text-sm">${emp.phone}</p>
                            <div class="flex items-center mt-1 text-xs text-gray-400">
                                <i class="fas fa-calendar-alt mr-1"></i>
                                <span>İşe Başlama: ${startDateStr}</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-bold text-gray-800">${emp.salaryAmount.toLocaleString('tr-TR')} TL</p>
                        <p class="text-sm text-gray-500">${emp.salaryType === 'weekly' ? 'Haftalık' : emp.salaryType === 'monthly' ? 'Aylık' : 'Günlük'}</p>
                    </div>
                </div>
                
                <div class="bg-blue-50 rounded-lg p-3 mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-clock text-blue-500 mr-2"></i>
                        <span class="text-sm text-blue-700 font-medium">${totalWorkDays} gün çalışıyor</span>
                    </div>
                </div>
                
                ${emp.isStopped ? `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-pause-circle text-yellow-500 mr-2"></i>
                        <span class="text-sm text-yellow-700 font-medium">İş Durduruldu - Borç/Hak Ediş Hesaplanmıyor</span>
                    </div>
                </div>
                ` : ''}
                
                <div class="flex items-center justify-between">
                    <div class="flex gap-3 mt-3">
                        <!-- Borç Kutusu -->
                        <div class="bg-gradient-to-br from-blue-500/70 to-blue-600/80 backdrop-blur-md border border-blue-300/60 shadow-md p-3 rounded-xl min-w-[140px]">
                            <p class="text-[10px] text-blue-50 uppercase font-semibold tracking-wide">Borç</p>
                            <p class="text-sm font-bold text-white">${formattedDebt} TL</p>
                        </div>
                        
                        <!-- Kazanç Kutusu -->
                        <div class="${bgColor} backdrop-blur-md border ${borderColor} shadow-md p-3 rounded-xl min-w-[140px]">
                            <p class="text-[10px] ${textColor} uppercase font-semibold tracking-wide">${titleText}</p>
                            <p class="text-sm font-bold text-white">${amountText}</p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button data-id="${emp.id}" class="detailsBtn bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm">
                            <i class="fas fa-info-circle mr-1"></i>
                            Detay
                        </button>
                        <button data-index="${originalIndex}" class="absenceBtn bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm">
                            <i class="fas fa-calendar-times mr-1"></i>
                            Devamsızlık
                        </button>
                        <button data-index="${originalIndex}" class="toggleWorkBtn ${emp.isStopped ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'} text-white px-3 py-2 rounded-lg transition-colors text-sm">
                            <i class="fas ${emp.isStopped ? 'fa-play' : 'fa-pause'} mr-1"></i>
                            ${emp.isStopped ? 'Devam Ettir' : 'İşi Durdur'}
                        </button>
                        <button data-index="${originalIndex}" class="paymentBtn bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm">
                            <i class="fas fa-money-check-alt mr-1"></i>
                            Ödeme
                        </button>
                        <button data-index="${originalIndex}" class="historyBtn bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                            <i class="fas fa-history mr-1"></i>
                            Geçmiş
                        </button>
                        <button data-index="${originalIndex}" class="terminateBtn bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm">
                            <i class="fas fa-door-open mr-1"></i>
                            İşten Çıkar
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        employeesSection.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500 mb-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Toplam Çalışan</p>
                        <p class="text-3xl font-bold text-gray-800">${activeEmployees.length}</p>
                    </div>
                    <div class="bg-emerald-100 p-3 rounded-full">
                        <i class="fas fa-users text-emerald-500 text-2xl"></i>
                    </div>
                </div>
            </div>
            <div class="grid gap-4">
                ${employeesHTML}
            </div>
        `;
    }

    // Geçmiş çalışanlar sayfasını render et
    renderPastEmployeesPage() {
        const pastEmployeesSection = document.getElementById('pastEmployeesSection');
        if (!pastEmployeesSection) return;
        
        // Sadece pasif çalışanları filtrele
        const inactiveEmployees = this.employees.filter(emp => emp.status === 'inactive');
        
        if (inactiveEmployees.length === 0) {
            pastEmployeesSection.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-archive text-gray-300 text-6xl mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Henüz geçmiş çalışan yok</h3>
                    <p class="text-gray-500">İşten çıkarılan çalışanlar burada görüntülenecek</p>
                </div>
            `;
            return;
        }
        
        let employeesHTML = inactiveEmployees.map((emp, index) => {
            const originalIndex = this.employees.indexOf(emp);
            const departureDate = emp.departureDate ? new Date(emp.departureDate) : null;
            const departureDateStr = departureDate ? departureDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirtilmemiş';
            const fixedDebt = this.calculateCurrentDebt(emp);
            
            return `
            <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-gray-400">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <div class="bg-gray-100 p-3 rounded-full mr-4">
                            <i class="fas fa-user-slash text-gray-500 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800">${emp.name}</h3>
                            <p class="text-gray-500 text-sm">${emp.phone}</p>
                            <div class="flex items-center mt-1 text-xs text-gray-400">
                                <i class="fas fa-calendar-times mr-1"></i>
                                <span>Ayrılma Tarihi: ${departureDateStr}</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-bold text-gray-800">${emp.salaryAmount.toLocaleString('tr-TR')} TL</p>
                        <p class="text-sm text-gray-500">${emp.salaryType === 'weekly' ? 'Haftalık' : emp.salaryType === 'monthly' ? 'Aylık' : 'Günlük'}</p>
                    </div>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-3 mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-coins text-gray-500 mr-2"></i>
                        <span class="text-sm text-gray-700 font-medium">Kalan Borç (Sabit): ${fixedDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</span>
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    <button data-id="${originalIndex}" class="showPastHistoryBtn bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                        <i class="fas fa-history mr-1"></i>
                        Geçmiş
                    </button>
                    <button data-id="${originalIndex}" class="permanentlyDeleteBtn bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm">
                        <i class="fas fa-trash mr-1"></i>
                        Çalışan Geçmişini Sil
                    </button>
                </div>
            </div>
            `;
        }).join('');
        
        pastEmployeesSection.innerHTML = `
            <div class="mb-4">
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Geçmiş Çalışanlar</h2>
                <p class="text-gray-500 text-sm">İşten çıkarılan çalışanların arşivi</p>
            </div>
            <div class="grid gap-4">
                ${employeesHTML}
            </div>
        `;
    }
    
    // Geçmiş çalışan geçmişini göster
    showPastEmployeeHistory(employeeIndex) {
        const employee = this.employees[employeeIndex];
        if (!employee) return;
        
        const historyContent = document.getElementById('historyContent');
        document.getElementById('historyEmployeeName').textContent = employee.name;
        
        // Sadece ödeme geçmişini göster (devamsızlık gösterme)
        if (!employee.paymentHistory || employee.paymentHistory.length === 0) {
            historyContent.innerHTML = '<p class="text-gray-500 text-center">Henüz ödeme kaydı yok</p>';
            openModal('historyModal');
            return;
        }
        
        // Maaş tipine göre ödemeleri grupla
        const groupedPayments = {};
        
        employee.paymentHistory.forEach((payment, index) => {
            const paymentDate = new Date(payment.date);
            let periodKey;
            
            if (employee.salaryType === 'daily') {
                // Günlük: Her gün ayrı göster
                periodKey = paymentDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            } else if (employee.salaryType === 'weekly') {
                // Haftalık: Hafta sonu tarihi
                const dayOfWeek = paymentDate.getDay();
                const daysUntilSunday = 7 - dayOfWeek;
                const weekEnd = new Date(paymentDate);
                weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
                periodKey = weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            } else {
                // Aylık: Ay sonu tarihi
                const monthEnd = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 0);
                periodKey = monthEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            }
            
            if (!groupedPayments[periodKey]) {
                groupedPayments[periodKey] = {
                    totalAmount: 0,
                    payments: [],
                    periodEnd: periodKey
                };
            }
            
            groupedPayments[periodKey].totalAmount += payment.amount;
            groupedPayments[periodKey].payments.push({
                ...payment,
                index: index
            });
        });
        
        // Tarihe göre sırala (yeniden eskiye)
        const sortedPeriods = Object.keys(groupedPayments).sort((a, b) => new Date(b) - new Date(a));
        
        let html = '';
        sortedPeriods.forEach(periodKey => {
            const data = groupedPayments[periodKey];
            const periodLabel = employee.salaryType === 'daily' 
                ? 'Günlük' 
                : employee.salaryType === 'weekly' 
                    ? 'Haftalık' 
                    : 'Aylık';
            
            html += `
                <div class="bg-blue-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                    <div class="flex justify-between items-center mb-2">
                        <p class="font-bold text-gray-800">${periodLabel} - ${data.periodEnd}</p>
                        <p class="font-bold text-blue-700">
                            ${data.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                        </p>
                    </div>
                    <div class="space-y-2 mt-3">
                        ${data.payments.map(payment => `
                            <div class="bg-white rounded-lg p-3 border-l-4 border-green-500 flex justify-between items-center">
                                <div>
                                    <p class="font-semibold text-gray-800 text-sm">Ödeme Alındı</p>
                                    <p class="text-xs text-gray-500">${payment.date}</p>
                                </div>
                                <p class="font-bold text-green-500">
                                    ${payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                                </p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        historyContent.innerHTML = html;
        openModal('historyModal');
    }
    
    // Hesap sayfasını render et
    renderAccountPage() {
        const accountSection = document.getElementById('accountSection');
        if (!accountSection) return;
        
        const user = auth.currentUser;
        if (!user) return;
        
        accountSection.innerHTML = `
            <div class="max-w-2xl mx-auto">
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">
                        <i class="fas fa-user-cog text-blue-500 mr-2"></i>
                        Hesabım
                    </h2>
                    
                    <form id="accountForm" class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">E-posta Adresi</label>
                            <input type="email" value="${user.email}" disabled class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed">
                            <p class="text-xs text-gray-500 mt-1">E-posta adresi değiştirilemez</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">İsim Soyisim</label>
                            <input type="text" id="accountName" value="${user.displayName || ''}" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        
                        <button type="submit" class="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold">
                            <i class="fas fa-save mr-2"></i>
                            Bilgileri Güncelle
                        </button>
                    </form>
                    
                    <div class="border-t border-gray-200 pt-6 mt-6">
                        <button id="openPasswordModalBtn" class="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold">
                            <i class="fas fa-key mr-2"></i>
                            Şifreyi Değiştir
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setEmployeeStartDateToToday() {
        const employeeStartDate = document.getElementById('employeeStartDate');
        if (!employeeStartDate) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        employeeStartDate.value = this.formatDateForInput(today);
        this.updateEmployeeStartDateEstimate();
    }

    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    parseDateInput(value) {
        if (!value) return null;
        const parts = value.split('-').map(part => parseInt(part, 10));
        if (parts.length !== 3 || parts.some(isNaN)) return null;
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    getEffectiveEmployeeStartDate(selectedDate, now) {
        const effectiveDate = new Date(selectedDate);
        const currentHour = now.getHours();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        if (effectiveDate.getTime() === today.getTime() && currentHour >= 18) {
            effectiveDate.setDate(effectiveDate.getDate() + 1);
            effectiveDate.setHours(0, 0, 0, 0);
        }

        return effectiveDate;
    }

    calculateDebtForStartDate(employeeTemplate, startDate) {
        if (!startDate) return 0;

        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const dailyWage = this.calculateDailyWage(employeeTemplate);
        let totalDebt = 0;
        let currentDate = new Date(startDate);

        while (currentDate <= today) {
            if (!this.isClosedDay(currentDate, employeeTemplate)) {
                const isToday = currentDate.getTime() === today.getTime();
                if (isToday) {
                    if (now.getHours() >= 18) {
                        totalDebt += dailyWage;
                    }
                } else {
                    totalDebt += dailyWage;
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return totalDebt;
    }

    updateEmployeeStartDateEstimate() {
        const employeeStartDate = document.getElementById('employeeStartDate');
        const info = document.getElementById('employeeStartDateInfo');
        if (!employeeStartDate || !info) return;

        const selectedDate = this.parseDateInput(employeeStartDate.value);
        const salaryType = document.getElementById('salaryType')?.value;
        const salaryAmountInput = document.getElementById('salaryAmount')?.value || '';
        const salaryAmount = parseFloat(salaryAmountInput.replace(/\./g, ''));
        const closedDaysCheckboxes = document.querySelectorAll('input[name="closedDays"]:checked');
        const closedDays = Array.from(closedDaysCheckboxes).map(cb => parseInt(cb.value, 10));

        if (!selectedDate) {
            info.textContent = 'Başlangıç tarihi seçin.';
            return;
        }

        if (!salaryType || isNaN(salaryAmount) || salaryAmount <= 0) {
            info.textContent = 'Ücret ve maaş tipi seçildiğinde borç hesabı güncellenecek.';
            return;
        }

        const now = new Date();
        const effectiveStartDate = this.getEffectiveEmployeeStartDate(selectedDate, now);
        const tempEmployee = {
            salaryType,
            salaryAmount,
            closedDays
        };
        const debt = this.calculateDebtForStartDate(tempEmployee, effectiveStartDate);

        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        if (effectiveStartDate.getTime() > today.getTime()) {
            info.textContent = 'Seçilen başlangıç tarihi bugünden sonraki tarihe ayarlandı. Şu an borç yok.';
            return;
        }

        info.textContent = `Seçilen tarihe göre tahmini borç: ${debt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
    }

    // İşçi ekle
    addEmployee() {
        const name = document.getElementById('employeeName').value.trim();
        const phone = document.getElementById('employeePhone').value.trim();
        const salaryType = document.getElementById('salaryType').value;
        const salaryAmountInput = document.getElementById('salaryAmount').value;
        const salaryAmount = parseInt(salaryAmountInput.replace(/\./g, ''), 10);
        
        // Get selected closed days from checkboxes
        const closedDaysCheckboxes = document.querySelectorAll('input[name="closedDays"]:checked');
        const closedDays = Array.from(closedDaysCheckboxes).map(cb => parseInt(cb.value));
        
        if (!name || !phone || !salaryType || isNaN(salaryAmount)) {
            showNotification('Lütfen tüm alanları doldurun', 'error');
            return;
        }
        
        const selectedDateValue = document.getElementById('employeeStartDate')?.value;
        let selectedStartDate = selectedDateValue ? this.parseDateInput(selectedDateValue) : null;
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        if (!selectedStartDate) {
            selectedStartDate = new Date(today);
        }

        // Eğer bugün saat 18:00'den sonra ise ve seçilen tarih bugünse, başlangıç tarihini yarına al
        const effectiveStartDate = this.getEffectiveEmployeeStartDate(selectedStartDate, now);

        const employee = {
            id: Date.now(),
            name,
            phone,
            salaryType,
            closedDays,
            salaryAmount,
            debt: 0,
            startDate: effectiveStartDate.getTime(),
            absenceHistory: [],
            paymentHistory: [],
            dailyLogs: []
        };
        
        this.employees.push(employee);
        this.saveData();
        
        document.getElementById('employeeForm').reset();
        closeModal('employeeModal');
        
        showNotification('İşçi başarıyla eklendi', 'success');
        this.renderEmployeesPage();
    }
    
    // İşçiyi işten çıkar (status: inactive)
    terminateEmployee(employeeIndex) {
        if (employeeIndex !== null && employeeIndex >= 0 && employeeIndex < this.employees.length) {
            const employee = this.employees[employeeIndex];
            employee.status = 'inactive';
            employee.departureDate = Date.now();
            this.saveData();
            this.renderEmployeesPage();
            this.renderHomePage();
            showNotification('Çalışan işten çıkarıldı', 'success');
            
            // İşten çıkarma bildirimi ekle
            if (!employee.activityHistory) employee.activityHistory = [];
            employee.activityHistory.push({
                type: 'terminated',
                employeeName: employee.name,
                message: 'İşten çıkarıldı',
                timestamp: Date.now()
            });
            this.saveData();
        }
    }
    
    // Çalışanın iş durumunu değiştir (isStopped toggle)
    toggleWorkStatus(employeeIndex) {
        if (employeeIndex !== null && employeeIndex >= 0 && employeeIndex < this.employees.length) {
            const employee = this.employees[employeeIndex];
            const currentStatus = employee.isStopped || false;
            const newStatus = !currentStatus;
            
            if (newStatus) {
                // İş durdurulacak - custom modal göster
                this.pendingWorkStopIndex = employeeIndex;
                const modal = document.getElementById('workStopModal');
                if (modal) modal.classList.remove('hidden');
            } else {
                // İş devam ettirilecek
                employee.isStopped = false;
                this.saveData();
                this.renderEmployeesPage();
                showNotification('Çalışanın işi devam ettirildi', 'success');
                
                // İş devam ettirme bildirimi ekle
                if (!employee.activityHistory) employee.activityHistory = [];
                employee.activityHistory.push({
                    type: 'work_resumed',
                    employeeName: employee.name,
                    message: 'İşi devam ettirildi',
                    timestamp: Date.now()
                });
                this.saveData();
            }
        }
    }

    // İş durdurmayı onayla
    confirmWorkStop() {
        if (this.pendingWorkStopIndex !== null && this.pendingWorkStopIndex >= 0 && this.pendingWorkStopIndex < this.employees.length) {
            const employee = this.employees[this.pendingWorkStopIndex];
            employee.isStopped = true;
            this.saveData();
            this.renderEmployeesPage();
            showNotification('Çalışanın işi durduruldu', 'warning');
            
            // İş durdurma bildirimi ekle
            if (!employee.activityHistory) employee.activityHistory = [];
            employee.activityHistory.push({
                type: 'work_stopped',
                employeeName: employee.name,
                message: 'İşi durduruldu',
                timestamp: Date.now()
            });
            this.saveData();
        }
        this.closeWorkStopModal();
    }

    // İş durdurma modalını kapat
    closeWorkStopModal() {
        const modal = document.getElementById('workStopModal');
        if (modal) modal.classList.add('hidden');
        this.pendingWorkStopIndex = null;
    }

    // Günün durumunu belirle (7:00-18:00 kuralı)
    getStatusForDate(date) {
        const now = new Date();
        const currentHour = now.getHours();
        
        const today = new Date(now.toDateString());
        const target = new Date(date.toDateString());

        // 1. Gelecek günler: Kesinlikle "Bekleniyor"
        if (target > today) return "Bekleniyor";

        // 2. Bugün:
        if (target.getTime() === today.getTime()) {
            if (currentHour < 7) return "Bekleniyor"; // 07:00 öncesi
            if (currentHour >= 7 && currentHour < 18) return "Bekleniyor"; // 07:00 - 18:00 arası
            return "Eklendi"; // 18:00 sonrası
        }

        // 3. Geçmiş günler: Kesinlikle "Eklendi"
        return "Eklendi";
    }

    // 10 günlük günlük hesaplama
    calculateDailyLogs(employee) {
        const logs = [];
        const today = new Date();
        const currentHour = today.getHours();
        
        // Tarihleri yerel saatle "YYYY-MM-DD" formatına çevir (saat farklarından etkilenmez)
        const toDateString = (date) => {
            const d = new Date(date);
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        };
        
        const startDateStr = employee.startDate ? toDateString(employee.startDate) : toDateString(today);
        const todayStr = toDateString(today);
        
        const currentDate = new Date(startDateStr + 'T00:00:00');
        const endDate = new Date(todayStr + 'T00:00:00');
        
        // startDate'dan bugüne kadar olan günleri hesapla (off-by-one hatası düzeltildi)
        while (currentDate <= endDate) {
            const dateStr = toDateString(currentDate);
            const dayOfWeek = currentDate.getDay();
            
            // Check if this day is a closed day
            const isClosedDay = employee.closedDays && employee.closedDays.includes(dayOfWeek);
            
            // Check if there's an existing log for this date
            const existingLog = employee.dailyLogs && employee.dailyLogs.find(log => log.date === dateStr);
            
            if (existingLog) {
                logs.push(existingLog);
            } else {
                // Calculate daily amount based on salary type (same as calculateDailyWage)
                let dailyAmount = 0;
                if (employee.salaryType === 'daily') {
                    dailyAmount = employee.salaryAmount;
                } else if (employee.salaryType === 'weekly') {
                    const closedDays = employee.closedDays || [];
                    const workingDaysPerWeek = 7 - closedDays.length;
                    dailyAmount = employee.salaryAmount / workingDaysPerWeek;
                } else if (employee.salaryType === 'monthly') {
                    dailyAmount = employee.salaryAmount / 26;
                }
                
                // If it's a closed day, no payment
                if (isClosedDay) {
                    dailyAmount = 0;
                }
                
                // Determine status based on getStatusForDate function
                const statusText = this.getStatusForDate(currentDate);
                const status = statusText === 'Eklendi' ? 'added' : 'pending';
                
                // Check if work was stopped on this day
                const isStopped = employee.isStopped || false;
                
                logs.push({
                    date: dateStr,
                    status: status,
                    amount: dailyAmount,
                    isStopped: isStopped,
                    isClosedDay: isClosedDay
                });
            }
            
            // Bir sonraki güne geç
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // En yeni gün en üstte olacak şekilde ters çevir
        return logs.reverse();
    }
    
    // İşçiyi kalıcı olarak sil (şifre doğrulaması ile)
    permanentlyDeleteEmployee(employeeIndex, password) {
        if (employeeIndex !== null && employeeIndex >= 0 && employeeIndex < this.employees.length) {
            const user = auth.currentUser;
            if (!user) {
                showNotification('Kullanıcı oturumu bulunamadı', 'error');
                return;
            }
            
            const credential = EmailAuthProvider.credential(user.email, password);
            
            reauthenticateWithCredential(user, credential)
                .then(() => {
                    // Şifre doğru, çalışanı sil
                    this.employees.splice(employeeIndex, 1);
                    this.saveData();
                    this.renderPastEmployeesPage();
                    this.renderHomePage();
                    showNotification('Çalışan kalıcı olarak silindi', 'success');
                    
                    // Modalı kapat
                    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
                    if (deleteConfirmModal) {
                        deleteConfirmModal.classList.add('hidden');
                    }
                    document.getElementById('deleteAuthPassword').value = '';
                })
                .catch((error) => {
                    console.error('Şifre doğrulama hatası:', error);
                    if (error.code === 'auth/wrong-password') {
                        showNotification('Hatalı şifre, silme işlemi reddedildi!', 'error');
                    } else {
                        showNotification('Şifre doğrulama hatası', 'error');
                    }
                });
        }
    }
    
    // İşçi sil
    deleteEmployee(employeeIndex) {
        if (employeeIndex !== null && employeeIndex >= 0 && employeeIndex < this.employees.length) {
            this.employees.splice(employeeIndex, 1);
            this.saveData();
            this.renderEmployeesPage();
            this.renderHomePage();
            showNotification('Çalışan başarıyla silindi', 'success');
        }
    }
    
    // Ödemeyi sil
    deletePayment(employeeIndex, recordIndex) {
        const employee = this.employees[employeeIndex];
        if (!employee) return;
        
        if (!employee.paymentHistory || recordIndex < 0 || recordIndex >= employee.paymentHistory.length) return;
        
        // Kaydı sil
        employee.paymentHistory.splice(recordIndex, 1);
        
        this.saveData();
        
        // Geçmiş modalını güncelle
        showHistory(employeeIndex);
        
        // Listeleri güncelle
        this.renderEmployeesPage();
        this.renderHomePage();
        
        showNotification('Ödeme başarıyla iptal edildi', 'success');
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
        
        // Devamsızlık geçmişine ekle (borç dinamik olarak hesaplanacak)
        if (!employee.absenceHistory) {
            employee.absenceHistory = [];
        }
        employee.absenceHistory.push({
            date,
            deduction,
            timestamp: Date.now()
        });
        
        this.saveData();
        closeModal('absenceModal');
        
        showNotification(`Devamsızlık kaydedildi. Kesinti: ${deduction.toFixed(2)} TL`, 'success');
        this.renderEmployeesPage();
        this.renderHomePage();
        
        // Günlük detaylar modalı açıksa ve aynı çalışanı gösteriyorsa, yenile
        if (window.currentDailyDetailsEmployeeId === employeeId) {
            const dailyDetailsModal = document.getElementById('dailyDetailsModal');
            if (dailyDetailsModal && !dailyDetailsModal.classList.contains('hidden')) {
                openDailyDetails(employeeId);
            }
        }
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
        
        // Ödeme geçmişine ekle (borç dinamik olarak hesaplanacak)
        if (!employee.paymentHistory) {
            employee.paymentHistory = [];
        }
        employee.paymentHistory.push({
            amount: -amount,
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now()
        });
        
        this.saveData();
        closeModal('paymentModal');
        
        showNotification(`${amount.toFixed(2)} TL ödeme kaydedildi`, 'success');
        
        // Borç değerini anında güncelle ve UI'ı tazele
        this.updateDebtUI(employeeId, amount);
        
        // Günlük detaylar modalı açıksa ve aynı çalışanı gösteriyorsa, yenile
        if (window.currentDailyDetailsEmployeeId === employeeId) {
            const dailyDetailsModal = document.getElementById('dailyDetailsModal');
            if (dailyDetailsModal && !dailyDetailsModal.classList.contains('hidden')) {
                openDailyDetails(employeeId);
            }
        }
    }

    // Borç-Ödeme Senkronizasyonu: UI'ı anında güncelle
    updateDebtUI(workerId, paymentAmount) {
        const worker = this.employees.find(w => w.id === workerId);
        if (worker) {
            // Borç değerini dinamik olarak yeniden hesapla
            worker.debt = this.calculateCurrentDebt(worker);
            
            // UI'ı sadece ilgili kart için tazele
            this.updateSingleWorkerCard(worker);
        }
    }

    // Tekil çalışan kartını güncelle (tüm sayfayı yeniden render etmeden)
    updateSingleWorkerCard(worker) {
        // Tüm sayfayı yeniden render et (daha optimize edilebilir)
        this.renderEmployeesPage();
        this.renderHomePage();
    }

    // Günlük ücret hesapla
    calculateDailyWage(employee) {
        const closedDays = employee.closedDays || [];
        const workingDaysPerWeek = 7 - closedDays.length;
        
        if (employee.salaryType === 'daily') {
            // Günlük maaş - direkt kullan
            return employee.salaryAmount;
        } else if (employee.salaryType === 'weekly') {
            // Haftalık maaş / çalışma gün sayısı (kapalı günler hariç)
            return workingDaysPerWeek > 0 ? employee.salaryAmount / workingDaysPerWeek : employee.salaryAmount / 6;
        } else {
            // Aylık maaş / 26 gün (kapalı günler haftalık olarak hesaplanır ve aya yansıtılır)
            const workingDaysPerMonth = Math.round(workingDaysPerWeek * 4);
            return workingDaysPerMonth > 0 ? employee.salaryAmount / workingDaysPerMonth : employee.salaryAmount / 26;
        }
    }
    
    // Günün kapalı olup olmadığını kontrol et
    isClosedDay(date, employee) {
        const closedDays = employee.closedDays || [];
        const dayOfWeek = date.getDay();
        return closedDays.includes(dayOfWeek);
    }
    
    // Bugünün kazanç bilgisini al (küçük kutucuk formatında)
    getTodayEarningSmallInfo(employee) {
        if (!employee.startDate) return '';
        
        const today = new Date();
        const startDate = new Date(employee.startDate);
        startDate.setHours(0, 0, 0, 0);
        const todayDate = new Date(today);
        todayDate.setHours(0, 0, 0, 0);
        
        // Bugün işe başlama tarihinden önceyse
        if (startDate > todayDate) return '';
        
        // Bugün kapalı gün ise
        if (this.isClosedDay(today, employee)) return '';
        
        const dailyWage = this.calculateDailyWage(employee);
        
        return `
            <div class="bg-emerald-500/10 border border-emerald-500/10 px-3 py-1.5 rounded-lg text-xs">
                <span class="text-emerald-400">Kazanç: </span>
                <span class="text-emerald-300 font-bold">+${dailyWage.toFixed(2)} TL</span>
            </div>
        `;
    }
    
    // Bugünün kazanç bilgisini al (büyük kutu formatında - modal için)
    getTodayEarningInfo(employee) {
        if (!employee.startDate) return '';
        
        const today = new Date();
        const currentHour = today.getHours();
        const startDate = new Date(employee.startDate);
        startDate.setHours(0, 0, 0, 0);
        const todayDate = new Date(today);
        todayDate.setHours(0, 0, 0, 0);
        
        // Bugün işe başlama tarihinden önceyse
        if (startDate > todayDate) return '';
        
        // Bugün kapalı gün ise
        if (this.isClosedDay(today, employee)) return '';
        
        const dailyWage = this.calculateDailyWage(employee);
        
        // Saat 18:00'den önceyse
        if (currentHour < 18) {
            return `
                <div class="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 p-4 rounded-xl flex justify-between items-center hover:bg-emerald-500/20 transition-all">
                    <span class="text-emerald-400 text-sm font-medium">Bugünün Kazancı</span>
                    <span class="text-emerald-300 font-bold text-lg">+${dailyWage.toFixed(2)} TL</span>
                </div>
            `;
        }
        
        // Saat 18:00'den sonra
        return `
            <div class="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 p-4 rounded-xl flex justify-between items-center hover:bg-emerald-500/20 transition-all">
                <span class="text-emerald-400 text-sm font-medium">Bugünün Kazancı</span>
                <span class="text-emerald-300 font-bold text-lg">+${dailyWage.toFixed(2)} TL</span>
            </div>
        `;
    }
    
    // Mevcut borcu hesapla (günlük bazda)
    calculateCurrentDebt(employee) {
        console.log('calculateCurrentDebt çağrıldı, çalışan:', employee.name);
        
        if (!employee.startDate) return 0;
        
        // İş durdurulmuşsa borç artışı durdur
        if (employee.isStopped) {
            // Mevcut borcu göster ama yeni borç ekleme
            const dailyWage = this.calculateDailyWage(employee);
            let totalDebt = 0;
            
            // Ödemeleri çıkar
            if (employee.paymentHistory && employee.paymentHistory.length > 0) {
                employee.paymentHistory.forEach(payment => {
                    console.log('Ödeme verisi:', payment);
                    totalDebt -= Math.abs(Number(payment.amount) || 0);
                });
            }
            
            // Devamsızlıkları ekle
            if (employee.absenceHistory && employee.absenceHistory.length > 0) {
                employee.absenceHistory.forEach(absence => {
                    console.log('Devamsızlık verisi:', absence);
                    totalDebt += Number(absence.deduction) || 0;
                });
            }
            
            console.log('İş durdurulmuş borç:', totalDebt);
            return totalDebt;
        }
        
        // İşten çıkarılmış çalışanlar için borç artışı durdur
        if (employee.status === 'inactive') {
            // Sabit borcu hesapla (ayrılma tarihine kadar)
            const departureDate = employee.departureDate ? new Date(employee.departureDate) : new Date();
            const startDate = new Date(employee.startDate);
            const dailyWage = this.calculateDailyWage(employee);
            let totalDebt = 0;
            
            startDate.setHours(0, 0, 0, 0);
            departureDate.setHours(0, 0, 0, 0);
            
            // Başlangıç tarihinden ayrılma tarihine kadar her günü döngüye al (ayrılma günü dahil değil)
            const currentDate = new Date(startDate);
            while (currentDate < departureDate) {
                if (!this.isClosedDay(currentDate, employee)) {
                    totalDebt += dailyWage;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // Ödemeleri çıkar
            if (employee.paymentHistory && employee.paymentHistory.length > 0) {
                employee.paymentHistory.forEach(payment => {
                    console.log('İşten çıkarılmış ödeme verisi:', payment);
                    totalDebt -= Math.abs(Number(payment.amount) || 0);
                });
            }
            
            // Devamsızlıkları ekle
            if (employee.absenceHistory && employee.absenceHistory.length > 0) {
                employee.absenceHistory.forEach(absence => {
                    console.log('İşten çıkarılmış devamsızlık verisi:', absence);
                    totalDebt += Number(absence.deduction) || 0;
                });
            }
            
            console.log('İşten çıkarılmış borç:', totalDebt);
            return totalDebt;
        }
        
        const startDate = new Date(employee.startDate);
        const today = new Date();
        const currentHour = today.getHours();
        today.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        
        // Başlangıç tarihi bugünden sonra ise borç yok
        if (startDate > today) return 0;
        
        const dailyWage = this.calculateDailyWage(employee);
        let totalDebt = 0;
        
        // Başlangıç tarihinden bugüne kadar her günü döngüye al
        const currentDate = new Date(startDate);
        while (currentDate <= today) {
            const isToday = currentDate.getTime() === today.getTime();
            
            // Gün kapalı değilse
            if (!this.isClosedDay(currentDate, employee)) {
                // Bugün için saat kontrolü: 18:00'den önce ise dahil etme
                if (isToday) {
                    if (currentHour >= 18) {
                        totalDebt += dailyWage;
                    }
                } else {
                    // Geçmiş günler için doğrudan ekle
                    totalDebt += dailyWage;
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Ödemeleri çıkar
        if (employee.paymentHistory && employee.paymentHistory.length > 0) {
            employee.paymentHistory.forEach(payment => {
                console.log('Aktif ödeme verisi:', payment);
                totalDebt -= Math.abs(Number(payment.amount) || 0);
            });
        }
        
        // Devamsızlık kesintilerini ekle
        if (employee.absenceHistory && employee.absenceHistory.length > 0) {
            employee.absenceHistory.forEach(absence => {
                console.log('Aktif devamsızlık verisi:', absence);
                totalDebt += Number(absence.deduction) || 0;
            });
        }
        
        console.log('Aktif borç:', totalDebt);
        return totalDebt;
    }

    // Devamsızlık kesintisini hesapla
    calculateAbsenceDeduction() {
        const employeeId = parseInt(document.getElementById('absenceEmployeeId').value);
        const employee = this.employees.find(emp => emp.id === employeeId);
        
        if (!employee) return;
        
        const deduction = this.calculateDailyWage(employee);
        document.getElementById('absenceDeduction').textContent = deduction.toFixed(2) + ' TL';
        
        let wageInfo;
        if (employee.salaryType === 'daily') {
            wageInfo = `Günlük ${employee.salaryAmount.toLocaleString('tr-TR')} TL = ${deduction.toFixed(2)} TL/gün`;
        } else if (employee.salaryType === 'weekly') {
            wageInfo = `Haftalık ${employee.salaryAmount.toLocaleString('tr-TR')} TL / 6 gün = ${deduction.toFixed(2)} TL/gün`;
        } else {
            wageInfo = `Aylık ${employee.salaryAmount.toLocaleString('tr-TR')} TL / 26 gün = ${deduction.toFixed(2)} TL/gün`;
        }
        document.getElementById('wageCalculation').textContent = wageInfo;
    }

    // Kalan borcu hesapla
    calculateRemainingDebt() {
        let currentDebtStr = document.getElementById('currentDebt').value || '0';
        // Türkçe formatındaki string'i parse et (4.000,00 -> 4000.00)
        currentDebtStr = currentDebtStr.replace(/\./g, '').replace(',', '.');
        const currentDebt = parseFloat(currentDebtStr) || 0;
        
        const paymentAmount = parseFloat(document.getElementById('paymentAmount').value) || 0;
        const remaining = Math.max(0, currentDebt - paymentAmount);
        document.getElementById('remainingDebt').textContent = remaining.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
    }
}

// Modal fonksiyonları
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';

        if (modalId === 'employeeModal' && window.luxwage) {
            window.luxwage.setEmployeeStartDateToToday();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Devamsızlık modalını aç
function openAbsenceModal(employeeIndex) {
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
function openPaymentModal(employeeIndex) {
    const employee = luxwage.employees[employeeIndex];
    if (!employee) return;
    
    const currentDebt = luxwage.calculateCurrentDebt(employee);
    const debtDisplay = currentDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    document.getElementById('paymentEmployeeId').value = employee.id;
    document.getElementById('paymentEmployeeName').value = employee.name;
    document.getElementById('currentDebt').value = debtDisplay;
    document.getElementById('paymentAmount').value = '';
    document.getElementById('remainingDebt').textContent = debtDisplay + ' TL';
    
    openModal('paymentModal');
};

// Geçmişi göster
function showHistory(employeeIndex) {
    const employee = luxwage.employees[employeeIndex];
    if (!employee) return;
    
    document.getElementById('historyEmployeeName').textContent = employee.name;
    
    const historyContent = document.getElementById('historyContent');
    
    // Ödeme geçmişini göster
    if (!employee.paymentHistory || employee.paymentHistory.length === 0) {
        historyContent.innerHTML = '<p class="text-gray-500 text-center">Henüz ödeme kaydı yok</p>';
    } else {
        // Maaş tipine göre ödemeleri grupla
        const groupedPayments = {};
        
        employee.paymentHistory.forEach((payment, index) => {
            const paymentDate = new Date(payment.date);
            let periodKey;
            
            if (employee.salaryType === 'daily') {
                // Günlük: Her gün ayrı göster
                periodKey = paymentDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            } else if (employee.salaryType === 'weekly') {
                // Haftalık: Hafta sonu tarihi
                const dayOfWeek = paymentDate.getDay();
                const daysUntilSunday = 7 - dayOfWeek;
                const weekEnd = new Date(paymentDate);
                weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
                periodKey = weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            } else {
                // Aylık: Ay sonu tarihi
                const monthEnd = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 0);
                periodKey = monthEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            }
            
            if (!groupedPayments[periodKey]) {
                groupedPayments[periodKey] = {
                    totalAmount: 0,
                    payments: [],
                    periodEnd: periodKey
                };
            }
            
            groupedPayments[periodKey].totalAmount += payment.amount;
            groupedPayments[periodKey].payments.push({
                ...payment,
                index: index
            });
        });
        
        // Tarihe göre sırala (yeniden eskiye)
        const sortedPeriods = Object.keys(groupedPayments).sort((a, b) => new Date(b) - new Date(a));
        
        let html = '';
        sortedPeriods.forEach(periodKey => {
            const data = groupedPayments[periodKey];
            const periodLabel = employee.salaryType === 'daily' 
                ? 'Günlük' 
                : employee.salaryType === 'weekly' 
                    ? 'Haftalık' 
                    : 'Aylık';
            
            html += `
                <div class="bg-blue-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                    <div class="flex justify-between items-center mb-2">
                        <p class="font-bold text-gray-800">${periodLabel} - ${data.periodEnd}</p>
                        <p class="font-bold text-blue-700">
                            ${data.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                        </p>
                    </div>
                    <div class="space-y-2 mt-3">
                        ${data.payments.map(payment => `
                            <div class="bg-white rounded-lg p-3 border-l-4 border-green-500 flex justify-between items-center">
                                <div>
                                    <p class="font-semibold text-gray-800 text-sm">Ödeme Alındı</p>
                                    <p class="text-xs text-gray-500">${payment.date}</p>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <p class="font-bold text-green-500">
                                        ${payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                                    </p>
                                    <button onclick="deletePayment(${employeeIndex}, ${payment.index})" class="text-red-500 hover:text-red-700 transition-colors p-1" title="Ödemeyi Sil">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        historyContent.innerHTML = html;
    }
    
    openModal('historyModal');
};

// Günlük detayları göster
function openDailyDetails(employeeId) {
    const employee = luxwage.employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    const dailyDetailsList = document.getElementById('dailyDetailsList');
    
    // 10 günlük günlük hesapla ve göster
    const dailyLogs = luxwage.calculateDailyLogs(employee);
    
    // Çalışma süresi bilgisi
    let workDurationInfo = '';
    if (employee.startDate) {
        // Tarihleri yerel saatle "YYYY-MM-DD" formatına çevir (saat farklarından etkilenmez)
        const toDateString = (date) => {
            const d = new Date(date);
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        };
        
        const startDateStr = toDateString(employee.startDate);
        const todayStr = toDateString(new Date());
        
        const startDate = new Date(startDateStr + 'T00:00:00');
        const today = new Date(todayStr + 'T00:00:00');
        
        // Başlangıç tarihinden bugüne kadar geçen toplam gün sayısını hesapla (tüm günler, kapalı günler dahil)
        const daysWorked = dailyLogs.length;
        
        const formattedStartDate = startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        
        workDurationInfo = `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div class="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <p class="text-sm text-blue-700">
                            <i class="fas fa-calendar-check mr-2"></i>
                            <strong>İşe Başlama:</strong> ${formattedStartDate}
                        </p>
                        <p class="text-sm text-blue-700 mt-1">
                            <i class="fas fa-clock mr-2"></i>
                            <strong>Çalışılan Gün:</strong> ${daysWorked} gün
                        </p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-blue-700">
                            <i class="fas fa-list mr-2"></i>
                            <strong>Gösterilen:</strong> Son ${Math.min(dailyLogs.length, 10)} gün
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (dailyLogs.length === 0) {
        dailyDetailsList.innerHTML = workDurationInfo + '<p class="text-gray-500 text-center py-4">Henüz günlük kayıt yok</p>';
    } else {
        let dailyLogsHTML = workDurationInfo + '<table class="w-full"><thead><tr class="bg-gray-200">';
        dailyLogsHTML += '<th class="px-4 py-2 text-left text-sm font-semibold text-gray-700">Tarih</th>';
        dailyLogsHTML += '<th class="px-4 py-2 text-left text-sm font-semibold text-gray-700">Günlük Tutar</th>';
        dailyLogsHTML += '<th class="px-4 py-2 text-left text-sm font-semibold text-gray-700">Durum</th>';
        dailyLogsHTML += '</tr></thead><tbody>';
        
        dailyLogs.forEach(log => {
            const dateObj = new Date(log.date);
            const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            
            let rowClass = '';
            let statusText = '';
            let statusClass = '';
            
            if (log.isStopped) {
                rowClass = 'bg-gray-100';
                statusText = 'İş Durduruldu';
                statusClass = 'text-gray-600 font-semibold';
            } else if (log.isClosedDay) {
                rowClass = 'bg-gray-50';
                statusText = 'Kapalı Gün';
                statusClass = 'text-gray-500';
            } else if (log.status === 'added') {
                rowClass = 'bg-green-50';
                statusText = 'Eklendi';
                statusClass = 'text-green-600 font-semibold';
            } else {
                rowClass = 'bg-yellow-50';
                statusText = 'Bekleniyor';
                statusClass = 'text-yellow-600 font-semibold';
            }
            
            dailyLogsHTML += `
                <tr class="${rowClass} border-b border-gray-200">
                    <td class="px-4 py-3 text-sm text-gray-800">${formattedDate}</td>
                    <td class="px-4 py-3 text-sm font-medium ${log.amount > 0 ? 'text-gray-800' : 'text-gray-400'}">
                        ${log.amount > 0 ? log.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL' : '-'}
                    </td>
                    <td class="px-4 py-3 text-sm ${statusClass}">${statusText}</td>
                </tr>
            `;
        });
        
        dailyLogsHTML += '</tbody></table>';
        dailyDetailsList.innerHTML = dailyLogsHTML;
    }
    
    const dailyDetailsModal = document.getElementById('dailyDetailsModal');
    if (dailyDetailsModal) {
        dailyDetailsModal.classList.remove('hidden');
    }
};

// İşçi sil
function deleteEmployee(employeeIndex) {
    if (confirm('Bu çalışanı silmek istediğinize emin misiniz?')) {
        luxwage.employees.splice(employeeIndex, 1);
        luxwage.saveData();
        luxwage.renderEmployeesPage();
        luxwage.renderHomePage();
        showNotification('İşçi silindi', 'success');
    }
};

// Yasal bilgileri göster
function showLegalInfo(type) {
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

// LuxWage instance'ini oluştur
const luxwage = new LuxWage();

// Global method'ları window objesine bağla (HTML onclick için)
window.showPage = function(pageName) {
    luxwage.showPage(pageName);
};

window.deletePayment = function(employeeIndex, recordIndex) {
    luxwage.deletePayment(employeeIndex, recordIndex);
};

// Logout button event listener
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        const logoutModal = document.getElementById('logoutModal');
        if (logoutModal) {
            logoutModal.classList.remove('hidden');
        }
    });
    
    // Home page button event listener
    document.getElementById('homePageBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        luxwage.showPage('home');
    });
    
    // Employees page button event listener
    document.getElementById('employeesPageBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        luxwage.showPage('employees');
    });
    
    // Account page button event listener
    document.getElementById('accountPageBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        luxwage.showPage('account');
    });
    
    // Past employees page button event listener
    document.getElementById('pastEmployeesPageBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        luxwage.showPage('pastEmployees');
    });
    
    // Sidebar logout button event listener - Event Delegation
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('#sidebarLogoutBtn')) {
            e.preventDefault();
            signOut(auth)
                .then(() => {
                    showNotification('Çıkış yapıldı', 'success');
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error('Çıkış hatası:', error);
                    showNotification('Çıkış yapılırken hata oluştu', 'error');
                });
        }
    });
    
    // Legal info buttons event listeners
    document.getElementById('privacyBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        showLegalInfo('privacy');
    });
    
    document.getElementById('termsBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        showLegalInfo('terms');
    });
    
    document.getElementById('aboutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        showLegalInfo('about');
    });
    
    document.getElementById('contactBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        showLegalInfo('contact');
    });
    
    document.getElementById('cookiesBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        showLegalInfo('cookies');
    });
    
    // Modal close buttons event listeners
    document.getElementById('closeEmployeeModalBtn')?.addEventListener('click', function() {
        closeModal('employeeModal');
    });
    
    document.getElementById('cancelEmployeeBtn')?.addEventListener('click', function() {
        closeModal('employeeModal');
    });
    
    document.getElementById('closeAbsenceModalBtn')?.addEventListener('click', function() {
        closeModal('absenceModal');
    });
    
    document.getElementById('cancelAbsenceBtn')?.addEventListener('click', function() {
        closeModal('absenceModal');
    });
    
    document.getElementById('closePaymentModalBtn')?.addEventListener('click', function() {
        closeModal('paymentModal');
    });
    
    document.getElementById('cancelPaymentBtn')?.addEventListener('click', function() {
        closeModal('paymentModal');
    });
    
    document.getElementById('closeHistoryModalBtn')?.addEventListener('click', function() {
        closeModal('historyModal');
    });
    
    document.getElementById('closeLegalModalBtn')?.addEventListener('click', function() {
        closeModal('legalModal');
    });
    
    document.getElementById('closePasswordModalBtn')?.addEventListener('click', function() {
        const passwordModal = document.getElementById('changePasswordModal');
        if (passwordModal) {
            passwordModal.classList.add('hidden');
            document.getElementById('modalOldPassword').value = '';
            document.getElementById('modalNewPassword').value = '';
        }
    });
    
    document.getElementById('closeDailyDetailsModalBtn')?.addEventListener('click', function() {
        const dailyDetailsModal = document.getElementById('dailyDetailsModal');
        if (dailyDetailsModal) {
            dailyDetailsModal.classList.add('hidden');
            window.currentDailyDetailsEmployeeId = null;
        }
    });
    
    // Delete confirm modal event listeners
    document.getElementById('closeDeleteConfirmModalBtn')?.addEventListener('click', function() {
        const deleteConfirmModal = document.getElementById('deleteConfirmModal');
        if (deleteConfirmModal) {
            deleteConfirmModal.classList.add('hidden');
        }
        document.getElementById('deleteAuthPassword').value = '';
        employeeIdToDelete = null;
    });
    
    document.getElementById('cancelDeleteConfirmBtn')?.addEventListener('click', function() {
        const deleteConfirmModal = document.getElementById('deleteConfirmModal');
        if (deleteConfirmModal) {
            deleteConfirmModal.classList.add('hidden');
        }
        document.getElementById('deleteAuthPassword').value = '';
        employeeIdToDelete = null;
    });
    
    document.getElementById('confirmDeleteConfirmBtn')?.addEventListener('click', function() {
        const password = document.getElementById('deleteAuthPassword').value;
        if (!password) {
            showNotification('Lütfen şifrenizi girin', 'error');
            return;
        }
        if (employeeIdToDelete !== null) {
            luxwage.permanentlyDeleteEmployee(employeeIdToDelete, password);
        }
    });
    
    // Termination confirm modal event listeners
    document.getElementById('closeTerminateConfirmModalBtn')?.addEventListener('click', function() {
        const terminateConfirmModal = document.getElementById('terminateConfirmModal');
        if (terminateConfirmModal) {
            terminateConfirmModal.classList.add('hidden');
        }
        employeeIdToTerminate = null;
    });
    
    document.getElementById('cancelTerminateConfirmBtn')?.addEventListener('click', function() {
        const terminateConfirmModal = document.getElementById('terminateConfirmModal');
        if (terminateConfirmModal) {
            terminateConfirmModal.classList.add('hidden');
        }
        employeeIdToTerminate = null;
    });
    
    document.getElementById('confirmTerminateConfirmBtn')?.addEventListener('click', function() {
        if (employeeIdToTerminate !== null) {
            luxwage.terminateEmployee(employeeIdToTerminate);
            const terminateConfirmModal = document.getElementById('terminateConfirmModal');
            if (terminateConfirmModal) {
                terminateConfirmModal.classList.add('hidden');
            }
            employeeIdToTerminate = null;
        }
    });
    
    // Work stop modal event listeners
    document.getElementById('cancelWorkStopBtn')?.addEventListener('click', function() {
        luxwage.closeWorkStopModal();
    });
    
    document.getElementById('confirmWorkStopBtn')?.addEventListener('click', function() {
        luxwage.confirmWorkStop();
    });
    
    // Logout modal event listeners
    document.getElementById('cancelLogoutBtn')?.addEventListener('click', function() {
        const logoutModal = document.getElementById('logoutModal');
        if (logoutModal) {
            logoutModal.classList.add('hidden');
        }
    });
    
    document.getElementById('confirmLogoutBtn')?.addEventListener('click', function() {
        signOut(auth)
            .then(() => {
                showNotification('Çıkış yapıldı', 'success');
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('Çıkış hatası:', error);
                showNotification('Çıkış yapılırken hata oluştu', 'error');
            });
    });
    
    // Delete employee modal event listeners
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', function() {
        const deleteModal = document.getElementById('deleteEmployeeModal');
        if (deleteModal) {
            deleteModal.classList.add('hidden');
        }
        employeeIdToDelete = null;
    });
    
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', function() {
        if (employeeIdToDelete !== null) {
            luxwage.deleteEmployee(employeeIdToDelete);
            const deleteModal = document.getElementById('deleteEmployeeModal');
            if (deleteModal) {
                deleteModal.classList.add('hidden');
            }
            employeeIdToDelete = null;
        }
    });
    
    // Password modal event listeners
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'openPasswordModalBtn') {
            const passwordModal = document.getElementById('changePasswordModal');
            if (passwordModal) {
                passwordModal.classList.remove('hidden');
            }
        }
        
        if (e.target && e.target.id === 'closePasswordModalBtn') {
            const passwordModal = document.getElementById('changePasswordModal');
            if (passwordModal) {
                passwordModal.classList.add('hidden');
                document.getElementById('modalOldPassword').value = '';
                document.getElementById('modalNewPassword').value = '';
            }
        }
        
        if (e.target && e.target.id === 'cancelPasswordBtn') {
            const passwordModal = document.getElementById('changePasswordModal');
            if (passwordModal) {
                passwordModal.classList.add('hidden');
                document.getElementById('modalOldPassword').value = '';
                document.getElementById('modalNewPassword').value = '';
            }
        }
        
        if (e.target && e.target.id === 'confirmPasswordBtn') {
            const oldPassword = document.getElementById('modalOldPassword').value;
            const newPassword = document.getElementById('modalNewPassword').value;
            
            if (!oldPassword || !newPassword) {
                showNotification('Lütfen tüm alanları doldurun', 'error');
                return;
            }
            
            if (newPassword.length < 6) {
                showNotification('Yeni şifre en az 6 karakter olmalıdır', 'error');
                return;
            }
            
            const user = auth.currentUser;
            if (!user) return;
            
            const credential = EmailAuthProvider.credential(user.email, oldPassword);
            
            reauthenticateWithCredential(user, credential)
                .then(() => {
                    return updatePassword(user, newPassword);
                })
                .then(() => {
                    showNotification('Şifreniz başarıyla güncellendi', 'success');
                    const passwordModal = document.getElementById('changePasswordModal');
                    if (passwordModal) {
                        passwordModal.classList.add('hidden');
                    }
                    document.getElementById('modalOldPassword').value = '';
                    document.getElementById('modalNewPassword').value = '';
                })
                .catch((error) => {
                    console.error('Şifre güncelleme hatası:', error);
                    if (error.code === 'auth/wrong-password') {
                        showNotification('Mevcut şifre hatalı', 'error');
                    } else {
                        showNotification('Şifre güncellenirken hata oluştu', 'error');
                    }
                });
        }
    });
    
    // Add employee button event listener
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'addEmployeeBtn') {
            openModal('employeeModal');
        }
        
        // Employee action buttons with data-index
        if (e.target && e.target.classList.contains('absenceBtn')) {
            const index = e.target.getAttribute('data-index');
            openAbsenceModal(parseInt(index));
        }
        
        if (e.target && e.target.classList.contains('paymentBtn')) {
            const index = e.target.getAttribute('data-index');
            openPaymentModal(parseInt(index));
        }
        
        if (e.target && e.target.classList.contains('historyBtn')) {
            const index = e.target.getAttribute('data-index');
            showHistory(parseInt(index));
        }
        
        if (e.target && e.target.classList.contains('terminateBtn')) {
            const index = e.target.getAttribute('data-index');
            const employee = luxwage.employees[parseInt(index)];
            if (employee) {
                employeeIdToTerminate = parseInt(index);
                const terminateConfirmMessage = document.getElementById('terminateConfirmMessage');
                if (terminateConfirmMessage) {
                    terminateConfirmMessage.textContent = `${employee.name} adlı çalışanı işten çıkarmak istediğinize emin misiniz?`;
                }
                const terminateConfirmModal = document.getElementById('terminateConfirmModal');
                if (terminateConfirmModal) {
                    terminateConfirmModal.classList.remove('hidden');
                }
            }
        }
        
        if (e.target && e.target.classList.contains('toggleWorkBtn')) {
            const index = e.target.getAttribute('data-index');
            luxwage.toggleWorkStatus(parseInt(index));
        }
        
        if (e.target && e.target.classList.contains('permanentlyDeleteBtn')) {
            const index = e.target.getAttribute('data-id');
            employeeIdToDelete = parseInt(index);
            const deleteConfirmModal = document.getElementById('deleteConfirmModal');
            if (deleteConfirmModal) {
                deleteConfirmModal.classList.remove('hidden');
            }
        }
        
        if (e.target && e.target.classList.contains('showPastHistoryBtn')) {
            const index = e.target.getAttribute('data-id');
            luxwage.showPastEmployeeHistory(parseInt(index));
        }
        
        if (e.target && e.target.classList.contains('detailsBtn')) {
            const employeeId = e.target.getAttribute('data-id');
            openDailyDetails(parseInt(employeeId));
        }
    });
    
    // Account form event listener
    document.addEventListener('submit', function(e) {
        if (e.target && e.target.id === 'accountForm') {
            e.preventDefault();
            const name = document.getElementById('accountName').value.trim();
            
            if (!name) {
                showNotification('İsim soyisim alanı zorunludur', 'error');
                return;
            }
            
            const user = auth.currentUser;
            if (!user) {
                showNotification('Kullanıcı oturumu bulunamadı', 'error');
                return;
            }
            
            // Update display name if changed
            if (user.displayName !== name) {
                updateProfile(user, { displayName: name })
                    .then(() => {
                        showNotification('Bilgileriniz başarıyla güncellendi!', 'success');
                    })
                    .catch((error) => {
                        console.error('Profil güncelleme hatası:', error);
                        showNotification('Profil güncellenemedi: ' + error.message, 'error');
                    });
            } else {
                showNotification('Değişiklik yapılmadı', 'info');
            }
        }
    });
});

// Modal dışına tıklayınca kapatma
document.addEventListener('click', function(e) {
    if (e.target && e.target.classList && e.target.classList.contains('modal')) {
        // Modalları kapat
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }
});

// ESC tuşuna basınca modalları kapatma
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }
});
