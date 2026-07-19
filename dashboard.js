// Firebase CDN Import'ları
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail, deleteUser, GoogleAuthProvider, signInWithPopup, reauthenticateWithPopup } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import luxStudioLogo from "./görsel/luxstudio_logo.png";
import luxWageLogo from "./görsel/luxwagelogo.png";

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

// Yerel tarih string'i uret (UTC timezone kaymasini onle)
function toLocalDateStr(d) {
    const date = parseLocalDate(d);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Tarih string'ini yerel saat 00:00 olarak Date'e cevir (UTC kaymasini onle)
// 'YYYY-MM-DD', 'YYYY-MM-DDTHH:mm:ss' veya ISO timestamp formatlarini kabul eder
function parseLocalDate(d) {
    if (d instanceof Date) {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    if (typeof d === 'number' && !isNaN(d)) {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    const str = String(d || '');
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
        const [, year, month, day] = match;
        return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
    }
    const date = new Date(str);
    if (isNaN(date.getTime())) return new Date(NaN);
    date.setHours(0, 0, 0, 0);
    return date;
}

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

// Türkçe sayı formatı yardımcıları
function formatTurkishNumberInput(value) {
    if (!value) return '';
    
    // Sadece rakam, nokta ve virgüle izin ver
    let cleaned = value.replace(/[^\d.,]/g, '');
    
    // Son virgülü ondalık ayırıcı olarak koru, öncesindeki nokta/virgülleri sil
    const lastCommaIndex = cleaned.lastIndexOf(',');
    if (lastCommaIndex !== -1) {
        const integerPart = cleaned.slice(0, lastCommaIndex).replace(/[.,]/g, '');
        const decimalPart = cleaned.slice(lastCommaIndex + 1).replace(/[.,]/g, '').slice(0, 2);
        cleaned = integerPart + ',' + decimalPart;
    } else {
        cleaned = cleaned.replace(/[.,]/g, '');
    }
    
    if (!cleaned) return '';
    
    const [integerPart, decimalPart] = cleaned.split(',');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    if (value.endsWith(',')) {
        return formattedInteger + ',';
    }
    
    if (decimalPart !== undefined) {
        return formattedInteger + ',' + decimalPart;
    }
    
    return formattedInteger;
}

function parseTurkishNumber(value) {
    if (!value) return 0;
    const normalized = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
}

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

// LuxWage - Maaş ve Devamsızlık Takip Sistemi
// Dashboard JavaScript Dosyası

class LuxWage {
    constructor() {
        this.employees = [];
        this.currentPage = 'home';
        this.pendingWorkStopId = null;
        // init() onAuthStateChanged tarafından çağrılır
    }

    // Çalışanı ID ile bul (dizi indeksi yerine güvenli referans)
    findEmployeeById(id) {
        return this.employees.find(emp => emp.id === id) || null;
    }
    
    // Çalışanın dizindeki indeksini ID ile bul
    findEmployeeIndexById(id) {
        return this.employees.findIndex(emp => emp.id === id);
    }
    
    // Benzersiz çalışan ID'si üret (çakışma olasılığını minimize eder)
    generateEmployeeId() {
        let newId = Date.now();
        // Aynı ID varsa, mevcut ID'lerin maksimumundan 1 fazlasını kullan
        while (this.employees.some(emp => emp.id === newId)) {
            const maxId = this.employees.reduce((max, emp) => Math.max(max, emp.id || 0), 0);
            newId = maxId + 1;
        }
        return newId;
    }

    // Uygulamayı başlat (auth hazır olduktan sonra çağrılır)
    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.updateCurrentDate();
            this.cleanupOldData();
            this.recalculateAllDebts();
            this.showPage('home');
            this.checkDebtNotifications();
        } catch (error) {
            console.error('Uygulama başlatma hatası:', error);
            const homeSection = document.getElementById('homeSection');
            if (homeSection) {
                homeSection.innerHTML = `
                    <div class="bg-red-50 border border-red-200 rounded-xl p-6 m-4">
                        <p class="text-red-700 font-bold"><i class="fas fa-exclamation-circle mr-2"></i>Sayfa yüklenirken hata oluştu.</p>
                        <p class="text-red-600 text-sm mt-2">Lütfen F12 → Console sekmesindeki kırmızı hatayı bize gönderin.</p>
                    </div>
                `;
            }
        }
    }

    // Constructor'da sadece event listener'ları kur, veri yükleme auth'tan sonra
    setup() {
        this.setupEventListeners();
        this.updateCurrentDate();
    }

    // Tüm çalışanların borçlarını yeniden hesapla
    recalculateAllDebts() {
        console.log('Tüm çalışanların borçları yeniden hesaplanıyor...');
        this.employees.forEach(employee => {
            employee.debt = this.calculateCurrentDebt(employee);
        });
        this.saveData();
        console.log('Borç hesaplaması tamamlandı.');
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
        
        // Edit employee form submit
        const editEmployeeForm = document.getElementById('editEmployeeForm');
        if (editEmployeeForm) {
            editEmployeeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveEditEmployee(e);
            });
        }
        
        // Edit employee modal close buttons
        const closeEditEmployeeModalBtn = document.getElementById('closeEditEmployeeModalBtn');
        if (closeEditEmployeeModalBtn) {
            closeEditEmployeeModalBtn.addEventListener('click', closeEditEmployeeModal);
        }
        
        const cancelEditEmployeeBtn = document.getElementById('cancelEditEmployeeBtn');
        if (cancelEditEmployeeBtn) {
            cancelEditEmployeeBtn.addEventListener('click', closeEditEmployeeModal);
        }
        
        // Edit employee photo preview
        const editEmployeePhoto = document.getElementById('editEmployeePhoto');
        if (editEmployeePhoto) {
            editEmployeePhoto.addEventListener('change', async (e) => {
                const file = e.target.files?.[0];
                const preview = document.getElementById('editEmployeePhotoPreview');
                const previewImg = document.getElementById('editEmployeePhotoPreviewImg');
                const placeholder = document.getElementById('editEmployeePhotoPlaceholder');
                if (!file || !preview || !previewImg) return;
                
                if (file.size > 2 * 1024 * 1024) {
                    showNotification('Fotoğraf boyutu 2 MB üzerinde olamaz', 'error');
                    e.target.value = '';
                    return;
                }
                
                try {
                    const base64 = await this.readFileAsBase64(file);
                    previewImg.src = base64;
                    preview.classList.remove('hidden');
                    if (placeholder) placeholder.classList.add('hidden');
                } catch (err) {
                    console.error('Fotoğraf önizleme hatası:', err);
                    showNotification('Fotoğraf önizlemesi yüklenemedi', 'error');
                }
            });
        }
        
        // Edit employee phone auto-format
        const editEmployeePhone = document.getElementById('editEmployeePhone');
        if (editEmployeePhone) {
            editEmployeePhone.addEventListener('input', (e) => {
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
            paymentAmountInput.addEventListener('input', (e) => {
                const formatted = formatTurkishNumberInput(e.target.value);
                if (formatted !== e.target.value) {
                    e.target.value = formatted;
                }
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
        
        // Employee photo preview
        const employeePhoto = document.getElementById('employeePhoto');
        if (employeePhoto) {
            employeePhoto.addEventListener('change', async (e) => {
                const file = e.target.files?.[0];
                const preview = document.getElementById('employeePhotoPreview');
                const previewImg = document.getElementById('employeePhotoPreviewImg');
                const placeholder = document.getElementById('employeePhotoPlaceholder');
                if (!file || !preview || !previewImg) return;
                
                if (file.size > 2 * 1024 * 1024) {
                    showNotification('Fotoğraf boyutu 2 MB üzerinde olamaz', 'error');
                    e.target.value = '';
                    preview.classList.add('hidden');
                    previewImg.src = '';
                    if (placeholder) placeholder.classList.remove('hidden');
                    return;
                }
                
                try {
                    const base64 = await this.readFileAsBase64(file);
                    previewImg.src = base64;
                    preview.classList.remove('hidden');
                    if (placeholder) placeholder.classList.add('hidden');
                } catch (err) {
                    console.error('Fotoğraf önizleme hatası:', err);
                    showNotification('Fotoğraf önizlemesi yüklenemedi', 'error');
                }
            });
        }
        
        // Salary amount auto-format with Turkish thousand separator (salaryAmount already declared above)
        if (salaryAmount) {
            salaryAmount.addEventListener('input', (e) => {
                const formatted = formatTurkishNumberInput(e.target.value);
                if (formatted !== e.target.value) {
                    e.target.value = formatted;
                }
            });
        }
    }

    // Firestore'dan verileri yükle (user UID bazında)
    async loadData() {
        const user = auth.currentUser;
        if (!user) {
            this.employees = [];
            return;
        }
        try {
            const ref = doc(db, 'users', user.uid);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                this.employees = Array.isArray(data.employees) ? data.employees : [];
                this.normalizeAllEmployeeDates();
            } else {
                this.employees = [];
            }
        } catch (error) {
            console.error('Firestore veri yükleme hatası:', error);
            this.employees = [];
        }
    }

    // Firestore'a verileri kaydet (user UID bazında)
    async saveData() {
        const user = auth.currentUser;
        if (!user) return;
        try {
            const ref = doc(db, 'users', user.uid);
            await setDoc(ref, { employees: this.employees }, { merge: true });
        } catch (error) {
            console.error('Firestore veri kaydetme hatası:', error);
        }
    }

    // saveToFirebase alias
    saveToFirebase() {
        return this.saveData();
    }

    // Kayıtlı tarihleri local YYYY-MM-DD formatına normalize et (saat/timezone kaymalarını engelle)
    normalizeAllEmployeeDates() {
        this.employees.forEach(emp => {
            if (emp.departureDate) emp.departureDate = toLocalDateStr(parseLocalDate(emp.departureDate));
            if (emp.workStopDate) emp.workStopDate = toLocalDateStr(parseLocalDate(emp.workStopDate));
            if (emp.workResumeDate) emp.workResumeDate = toLocalDateStr(parseLocalDate(emp.workResumeDate));
            if (Array.isArray(emp.absenceHistory)) {
                emp.absenceHistory.forEach(absence => {
                    if (absence && absence.date) absence.date = toLocalDateStr(parseLocalDate(absence.date));
                });
            }
            if (Array.isArray(emp.paymentHistory)) {
                emp.paymentHistory.forEach(payment => {
                    if (payment && payment.date) payment.date = toLocalDateStr(parseLocalDate(payment.date));
                });
            }
        });
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

    // Borç bildirimlerini kontrol et
    checkDebtNotifications() {
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay();
        const dayOfMonth = today.getDate();
        
        this.employees.forEach(employee => {
            // Sadece aktif çalışanlar için
            if (employee.status === 'inactive' || employee.isStopped) return;
            
            if (!employee.startDate) return;
            
            const startDate = new Date(employee.startDate);
            const startDay = startDate.getDate();
            
            let shouldNotify = false;
            let periodLabel = '';
            
            if (employee.salaryType === 'weekly' || employee.salaryType === 'daily') {
                // Haftalık ve günlük çalışanlar için her Pazar günü bildirim
                if (dayOfWeek === 0) { // Pazar günü
                    shouldNotify = true;
                    periodLabel = 'Bu Hafta';
                }
            } else if (employee.salaryType === 'monthly') {
                // Aylık çalışanlar için işe başlama tarihine göre her ay aynı gün
                if (dayOfMonth === startDay) {
                    shouldNotify = true;
                    periodLabel = 'Bu Ay';
                }
            }
            
            if (shouldNotify) {
                const debtInfo = this.calculateDebtInfoForNotification(employee, periodLabel);
                showNotification(
                    `${employee.name}: ${periodLabel} ${debtInfo.periodDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL borç eklendi. Toplam borç: ${debtInfo.totalDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`,
                    'info'
                );
            }
            
            // Günlük kalan borç uyarısını kontrol et ve kaydet
            this.checkDebtWarning(employee);
        });
    }

    // Bildirim için borç bilgisi hesapla
    calculateDebtInfoForNotification(employee, periodLabel) {
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        
        let periodStart, periodEnd;
        const dayOfWeek = today.getDay();
        
        if (employee.salaryType === 'weekly' || employee.salaryType === 'daily') {
            // Haftalık ve günlük için: Bu haftanın başlangıcı (Pazartesi)
            const daysSinceSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
            periodStart = new Date(today);
            periodStart.setDate(periodStart.getDate() - daysSinceSunday);
            periodStart.setHours(0, 0, 0, 0);
            
            periodEnd = new Date(today);
            periodEnd.setHours(23, 59, 59, 999);
        } else if (employee.salaryType === 'monthly') {
            // Aylık için: İşe başlama tarihine göre bu ayın ödeme günü
            const paymentDate = this.getMonthlyPaymentDate(today.getFullYear(), today.getMonth(), employee);
            const currentHour = now.getHours();
            
            // Dönem borcu: bu ayın ödeme günü geçtiyse veya bugün ödeme günüyse 18:00'den sonraysa tam maaş
            if (paymentDate < today || (paymentDate.getTime() === today.getTime() && currentHour >= 18)) {
                periodDebt = Number(employee.salaryAmount) || 0;
            }
            
            const totalDebt = this.calculateCurrentDebt(employee);
            
            return {
                periodDebt,
                totalDebt,
                periodLabel
            };
        }
        
        // Dönem içindeki borç hesapla
        const dailyWage = this.calculateDailyWage(employee);
        let periodDebt = 0;
        
        const currentDate = new Date(periodStart);
        while (currentDate <= periodEnd) {
            if (!this.isClosedDay(currentDate, employee)) {
                const currentDateStr = toLocalDateStr(currentDate);
                const isAbsentDay = employee.absenceHistory && employee.absenceHistory.some(absence => absence.date === currentDateStr);
                
                // Devamsızlık günü ise borç çıkar
                if (isAbsentDay) {
                    periodDebt -= dailyWage;
                } else {
                    const isToday = currentDate.getTime() === today.getTime();
                    const currentHour = now.getHours();
                    
                    if (isToday) {
                        if (currentHour >= 18) {
                            periodDebt += dailyWage;
                        }
                    } else {
                        periodDebt += dailyWage;
                    }
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Toplam borcu hesapla
        const totalDebt = this.calculateCurrentDebt(employee);
        
        return {
            periodDebt,
            totalDebt,
            periodLabel
        };
    }

    // Sayfa göster
    showPage(pageName) {
        this.currentPage = pageName;
        const isStudioPage = pageName === 'studio';
        const dashboardSidebar = document.getElementById('dashboardSidebar');
        const dashboardTopBar = document.getElementById('dashboardTopBar');
        const mobileTopBar = document.getElementById('mobileTopBar');
        const dashboardMain = document.getElementById('dashboardMain');
        const pageContent = document.getElementById('pageContent');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        [dashboardSidebar, dashboardTopBar, mobileTopBar].forEach(element => {
            if (element) element.style.display = isStudioPage ? 'none' : '';
        });
        if (sidebarOverlay) sidebarOverlay.style.display = isStudioPage ? 'none' : '';
        if (dashboardMain) {
            dashboardMain.style.marginLeft = isStudioPage ? '0' : '';
            dashboardMain.style.paddingTop = isStudioPage ? '0' : '';
        }
        if (pageContent) pageContent.style.padding = isStudioPage ? '0' : '';

        const homeSection = document.getElementById('homeSection');
        const employeesSection = document.getElementById('employeesSection');
        const accountSection = document.getElementById('accountSection');
        const pastEmployeesSection = document.getElementById('pastEmployeesSection');
        const studioSection = document.getElementById('studioSection');
        const pageTitle = document.getElementById('pageTitle');
        
        // Hide all sections
        if (homeSection) homeSection.style.display = 'none';
        if (employeesSection) employeesSection.style.display = 'none';
        if (accountSection) accountSection.style.display = 'none';
        if (pastEmployeesSection) pastEmployeesSection.style.display = 'none';
        if (studioSection) studioSection.style.display = 'none';
        
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
                if (pageTitle) pageTitle.innerHTML = '<i class="fas fa-home hidden md:inline mr-2 text-blue-600"></i>Ana Sayfa';
                if (homeSection) homeSection.style.display = 'block';
                this.renderHomePage();
                break;
            case 'employees':
                if (pageTitle) pageTitle.innerHTML = '<i class="fas fa-users hidden md:inline mr-2 text-blue-600"></i>Çalışanlarım';
                if (employeesSection) employeesSection.style.display = 'block';
                this.renderEmployeesPage();
                break;
            case 'account':
                if (pageTitle) pageTitle.innerHTML = '<i class="fas fa-user-circle hidden md:inline mr-2 text-blue-600"></i>Hesabım';
                if (accountSection) accountSection.style.display = 'block';
                this.renderAccountPage();
                break;
            case 'pastEmployees':
                if (pageTitle) pageTitle.innerHTML = '<i class="fas fa-user-clock hidden md:inline mr-2 text-blue-600"></i>Geçmiş Çalışanlar';
                if (pastEmployeesSection) pastEmployeesSection.style.display = 'block';
                this.renderPastEmployeesPage();
                break;
            case 'studio':
                if (pageTitle) pageTitle.innerHTML = '<i class="fas fa-star hidden md:inline mr-2 text-blue-600"></i>Lux Studio';
                if (studioSection) studioSection.style.display = 'block';
                this.renderStudioPage();
                break;
        }
    }

    renderStudioPage() {
        const studioSection = document.getElementById('studioSection');
        if (!studioSection) return;

        const stars = Array.from({ length: 64 }, (_, index) => {
            const x = (index * 37 + 11) % 100;
            const y = (index * 61 + 7) % 100;
            const size = index % 10 === 0 ? 3 : index % 4 === 0 ? 2 : 1;
            const delay = -(index % 12) * 0.45;
            const duration = 3.4 + (index % 6) * 0.6;
            return `<span class="lux-studio-star" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${duration}s"></span>`;
        }).join('');

        studioSection.innerHTML = `
            <style>
                @keyframes luxStudioTwinkle { 0%,100% { opacity:.18; transform:scale(.7); } 50% { opacity:.85; transform:scale(1.25); } }
                .lux-studio-page { position:relative; isolation:isolate; overflow:hidden; min-height:100vh; background:radial-gradient(circle at 50% 37%, #302967 0%, #201c4c 42%, #101633 100%); }
                .lux-studio-page::before { content:''; position:absolute; inset:0; z-index:0; background:radial-gradient(circle at 15% 80%, rgba(59,130,246,.13), transparent 28%), radial-gradient(circle at 88% 20%, rgba(147,197,253,.08), transparent 25%); }
                .lux-studio-star { position:absolute; z-index:1; display:block; border-radius:999px; background:#fff; box-shadow:0 0 5px rgba(219,234,254,.65); animation:luxStudioTwinkle ease-in-out infinite; pointer-events:none; }
                .lux-studio-page > :not(.lux-studio-star):not(.lux-studio-back-button) { position:relative; z-index:2; }
                .lux-studio-back-button { position:fixed; left:0.5rem; top:0.5rem; z-index:60; }
            </style>
            <section class="lux-studio-page flex items-center justify-center px-4 py-12 text-white md:px-10 md:py-16">
                ${stars}
                <button type="button" onclick="showPage('home')" class="lux-studio-back-button inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/25"><i class="fas fa-arrow-left text-[10px]"></i> Geri</button>
                <div class="w-full max-w-3xl text-center">
                    <h2 class="text-4xl font-black tracking-tight md:text-5xl">Lux<span class="text-black">Studio</span></h2>
                    <p class="mt-2 text-sm text-blue-100/75">İki marka, bir vizyon</p>

                    <div class="mt-9 grid gap-5 text-center sm:grid-cols-2 sm:gap-7">
                        <article class="rounded-2xl border border-white/15 bg-white/[0.08] p-7 shadow-xl backdrop-blur-sm md:p-8">
                            <div class="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md">
                                <img src="${luxWageLogo}" alt="LuxWage" class="h-full w-full object-contain">
                            </div>
                            <h3 class="mt-5 text-3xl font-black">Lux<span class="text-blue-200">Wage</span></h3>
                            <p class="mt-3 min-h-12 text-sm leading-6 text-blue-100/75">Maaş, ödeme ve çalışan takibini tek yerde yönetin.</p>
                            <span class="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-xs font-semibold text-slate-700"><i class="fas fa-check-circle"></i> Takip sistemi</span>
                        </article>

                        <article class="rounded-2xl border border-white/15 bg-white/[0.08] p-7 shadow-xl backdrop-blur-sm md:p-8">
                            <div class="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md">
                                <img src="${luxStudioLogo}" alt="LUX INC Teknoloji Şirketi" class="h-full w-full object-contain">
                            </div>
                            <h3 class="mt-5 inline-flex items-center text-3xl font-black">LUX<span class="mx-2 h-7 w-1 rounded-full bg-white/70"></span><span class="text-black">INC</span></h3>
                            <p class="mt-3 min-h-12 text-sm leading-6 text-blue-100/75">Ana markamız. Dijital stüdyo çözümleri için<br><span class="mt-1 inline-flex items-center font-semibold text-white">LUX<span class="mx-1.5 inline-block h-4 w-0.5 bg-white/70"></span>INC</span></p>
                            <a href="https://www.instagram.com/lux.studio.inc/" target="_blank" rel="noopener noreferrer" class="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50"><i class="fab fa-instagram"></i> Instagram'dan takip edin</a>
                        </article>
                    </div>

                    <div class="mt-8 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-5 py-2 text-xs text-blue-100/80 backdrop-blur-sm"><i class="fas fa-handshake text-blue-200"></i> LuxWage × LUX INC — Ortak çalışma</div>
                </div>
            </section>
        `;
    }

    // Ana sayfayı render et
    renderHomePage() {
        const homeSection = document.getElementById('homeSection');
        if (!homeSection) return;
        
        const activeEmployees = this.employees.filter(emp => emp.status !== 'inactive');
        const totalEmployees = activeEmployees.length;
        const totalDebt = activeEmployees.reduce((sum, emp) => sum + this.calculateCurrentDebt(emp), 0);
        
        // Aylık ve yıllık toplam ödemeleri hesapla
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        function calculatePeriodPayments(year, month) {
            return activeEmployees.reduce((total, emp) => {
                if (!emp.paymentHistory || emp.paymentHistory.length === 0) return total;
                return total + emp.paymentHistory.reduce((empTotal, payment) => {
                    const paymentDate = new Date(payment.date + 'T00:00:00');
                    const amount = Math.abs(Number(payment.amount) || 0);
                    if (paymentDate.getFullYear() === year && paymentDate.getMonth() + 1 === month) {
                        return empTotal + amount;
                    }
                    return empTotal;
                }, 0);
            }, 0);
        }
        
        function calculateYearlyPayments(year) {
            return activeEmployees.reduce((total, emp) => {
                if (!emp.paymentHistory || emp.paymentHistory.length === 0) return total;
                return total + emp.paymentHistory.reduce((empTotal, payment) => {
                    const paymentDate = new Date(payment.date + 'T00:00:00');
                    const amount = Math.abs(Number(payment.amount) || 0);
                    if (paymentDate.getFullYear() === year) {
                        return empTotal + amount;
                    }
                    return empTotal;
                }, 0);
            }, 0);
        }
        
        const monthlyPayments = calculatePeriodPayments(currentYear, currentMonth);
        const yearlyPayments = calculateYearlyPayments(currentYear);
        
        // Toggle fonksiyonu için global değişkenler
        window.monthlyPaymentsAmount = monthlyPayments;
        window.yearlyPaymentsAmount = yearlyPayments;
        
        homeSection.innerHTML = `
            <div class="grid grid-cols-4 md:grid-cols-3 gap-2 md:gap-6 mb-8">
                <div class="col-span-1 md:col-span-1 bg-white rounded-xl shadow-lg p-2 md:p-6 border-l-2 md:border-l-4 border-emerald-500">
                    <div class="flex flex-col items-center justify-center gap-1 text-center">
                        <div class="bg-emerald-100 p-1.5 md:p-3 rounded-full shrink-0">
                            <i class="fas fa-users text-emerald-500 text-sm md:text-2xl"></i>
                        </div>
                        <p class="text-[10px] md:text-sm text-gray-500 truncate">Çalışan</p>
                        <p class="text-lg md:text-3xl font-bold text-gray-800">${totalEmployees}</p>
                    </div>
                </div>
                
                <div class="col-span-3 md:col-span-1 bg-white rounded-xl shadow-lg p-2 md:p-6 border-l-2 md:border-l-4 border-red-500">
                    <div class="flex items-center justify-between gap-1">
                        <div class="min-w-0">
                            <p class="text-[10px] md:text-sm text-gray-500 truncate">Toplam Borç</p>
                            <p class="text-lg md:text-3xl font-bold text-gray-800 truncate">${totalDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</p>
                        </div>
                        <div class="bg-red-100 p-1.5 md:p-3 rounded-full shrink-0">
                            <i class="fas fa-money-bill-wave text-red-500 text-sm md:text-2xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="col-span-4 md:col-span-1 bg-white rounded-xl shadow-lg p-2 md:p-6 border-l-2 md:border-l-4 border-blue-500">
                    <div class="flex items-center justify-between gap-2 mb-1 md:mb-3">
                        <p id="paymentPeriodTitle" class="text-[10px] md:text-sm text-gray-500 truncate font-medium">Aylık Toplam Ödeme</p>
                        <div class="flex items-center bg-gray-100 rounded-lg p-0.5 shrink-0">
                            <button type="button" id="paymentMonthlyBtn" onclick="setPaymentPeriodView('monthly')" class="px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs rounded-md bg-blue-600 text-white font-semibold shadow-sm transition-all">
                                Aylık
                            </button>
                            <button type="button" id="paymentYearlyBtn" onclick="setPaymentPeriodView('yearly')" class="px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-all font-medium">
                                Yıllık
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="min-w-0">
                            <p id="paymentPeriodValue" class="text-lg md:text-3xl font-bold text-gray-800 truncate">${monthlyPayments.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</p>
                            <p class="text-[10px] md:text-xs text-gray-400 mt-1 truncate" id="paymentPeriodLabel">Bu ay</p>
                        </div>
                        <div class="bg-blue-100 p-1.5 md:p-3 rounded-full shrink-0">
                            <i class="fas fa-chart-line text-blue-500 text-sm md:text-2xl"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-lg p-3 md:p-6">
                <h2 class="mb-2 text-base font-bold text-gray-800 md:mb-4 md:text-xl">
                    <i class="fas fa-bell text-blue-500 mr-1 md:mr-2"></i>
                    Son İşlemler ve Bildirimler
                </h2>
                <div id="recentActivityList" class="max-h-56 overflow-y-auto pr-1 md:max-h-80">
                    <!-- Activities will be loaded here -->
                </div>
            </div>
            
            <div class="mt-6 grid grid-cols-2 gap-3 md:gap-6">
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl md:rounded-xl shadow-md md:shadow-lg p-4 md:p-6 text-white">
                    <div class="flex items-center gap-2.5 md:mb-4 mb-2">
                        <div class="bg-white/20 p-2 md:p-3 rounded-lg shrink-0">
                            <i class="fas fa-clock text-base md:text-2xl"></i>
                        </div>
                        <h3 class="text-sm md:text-lg font-bold leading-tight">Otomatik Hesaplama</h3>
                    </div>
                    <p class="text-blue-100 text-xs leading-relaxed hidden md:block mt-2">
                        Çalışanlarınızın günlük kazançları saat 18:00'den sonra otomatik olarak borçlarına eklenir. 
                        08:00 - 18:00 arası kazançlar "Bekleniyor" olarak işaretlenir.
                    </p>
                </div>
                
                <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl md:rounded-xl shadow-md md:shadow-lg p-4 md:p-6 text-white">
                    <div class="flex items-center gap-2.5 md:mb-4 mb-2">
                        <div class="bg-white/20 p-2 md:p-3 rounded-lg shrink-0">
                            <i class="fas fa-calendar-check text-base md:text-2xl"></i>
                        </div>
                        <h3 class="text-sm md:text-lg font-bold leading-tight">Kapalı Günler</h3>
                    </div>
                    <p class="text-emerald-100 text-xs leading-relaxed hidden md:block mt-2">
                        Belirlediğiniz tatil günlerinde borç artışı otomatik olarak durdurulur. 
                        Kapalı günlerde sistem çalışanlarınızın maaşını hesaplamaz.
                    </p>
                </div>
                
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl md:rounded-xl shadow-md md:shadow-lg p-4 md:p-6 text-white">
                    <div class="flex items-center gap-2.5 md:mb-4 mb-2">
                        <div class="bg-white/20 p-2 md:p-3 rounded-lg shrink-0">
                            <i class="fas fa-history text-base md:text-2xl"></i>
                        </div>
                        <h3 class="text-sm md:text-lg font-bold leading-tight">Detaylı Geçmiş</h3>
                    </div>
                    <p class="text-purple-100 text-xs leading-relaxed hidden md:block mt-2">
                        Tüm ödeme, avans ve devamsızlık kayıtlarını çalışan kartlarından takip edebilirsiniz. 
                        Geçmiş çalışanlar ayrı bir bölümde saklanır.
                    </p>
                </div>
                
                <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl md:rounded-xl shadow-md md:shadow-lg p-4 md:p-6 text-white">
                    <div class="flex items-center gap-2.5 md:mb-4 mb-2">
                        <div class="bg-white/20 p-2 md:p-3 rounded-lg shrink-0">
                            <i class="fas fa-mobile-alt text-base md:text-2xl"></i>
                        </div>
                        <h3 class="text-sm md:text-lg font-bold leading-tight">Mobil Uyumlu</h3>
                    </div>
                    <p class="text-orange-100 text-xs leading-relaxed hidden md:block mt-2">
                        LuxWage telefon ve tabletlerde rahatlıkla kullanılabilir. 
                        Tüm sayfalar ve dashboard mobil ekranlara uyumlu tasarlanmıştır.
                    </p>
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
            const isHidden = emp.hiddenNotifications && emp.hiddenNotifications.includes(emp.startDate);
            if (emp.startDate && !isHidden) {
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
            
        });
        
        // Tarihe göre sırala (yeniden eskiye)
        activities.sort((a, b) => b.timestamp - a.timestamp);
        
        // Sadece son 1 haftayı göster
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentActivities = activities.filter(activity => activity.timestamp >= oneWeekAgo);
        
        // Eğer aktivite yoksa
        if (recentActivities.length === 0) {
            recentActivityList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-3"></i>
                    <p>Henüz işlem kaydı yok</p>
                </div>
            `;
            return;
        }
        
        // Aktiviteleri render et
        const activityRenderLimit = (navigator.hardwareConcurrency || 8) <= 4 ? 15 : 50;
        const activitiesHTML = recentActivities.slice(0, activityRenderLimit).map(activity => {
            const timeAgo = this.getTimeAgo(activity.timestamp);
            const dateStr = new Date(activity.timestamp).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            
            if (activity.type === 'new_employee') {
                return `
                    <div class="flex items-center p-2 md:p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-blue-100 p-2 md:p-3 rounded-full mr-2 md:mr-4">
                            <i class="fas fa-user text-blue-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800 text-sm md:text-base">${activity.employeeName} - ${activity.message}</p>
                            <p class="text-xs md:text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-1 md:p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            } else if (activity.type === 'payment') {
                return `
                    <div class="flex items-center p-2 md:p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-green-100 p-2 md:p-3 rounded-full mr-2 md:mr-4">
                            <i class="fas fa-money-bill-wave text-green-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800 text-sm md:text-base">${activity.employeeName} isimli çalışana ${activity.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL ödeme yapıldı</p>
                            <p class="text-xs md:text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-1 md:p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            } else if (activity.type === 'absence') {
                return `
                    <div class="flex items-center p-2 md:p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-red-100 p-2 md:p-3 rounded-full mr-2 md:mr-4">
                            <i class="fas fa-calendar-times text-red-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800 text-sm md:text-base">${activity.employeeName} isimli çalışana devamsızlık kaydı (${activity.deduction.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL kesinti)</p>
                            <p class="text-xs md:text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-1 md:p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            } else if (activity.type === 'warning') {
                return `
                    <div class="flex items-center p-2 md:p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-yellow-100 p-2 md:p-3 rounded-full mr-2 md:mr-4">
                            <i class="fas fa-exclamation-triangle text-yellow-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800 text-sm md:text-base">${activity.employeeName} - ${activity.message}</p>
                            <p class="text-xs md:text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-1 md:p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            } else if (activity.type === 'work_stopped') {
                return `
                    <div class="flex items-center p-2 md:p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-yellow-100 p-2 md:p-3 rounded-full mr-2 md:mr-4">
                            <i class="fas fa-pause-circle text-yellow-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800 text-sm md:text-base">${activity.employeeName} - ${activity.message}</p>
                            <p class="text-xs md:text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-1 md:p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            } else if (activity.type === 'work_resumed') {
                return `
                    <div class="flex items-center p-2 md:p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-green-100 p-2 md:p-3 rounded-full mr-2 md:mr-4">
                            <i class="fas fa-play-circle text-green-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800 text-sm md:text-base">${activity.employeeName} - ${activity.message}</p>
                            <p class="text-xs md:text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-1 md:p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            } else if (activity.type === 'terminated') {
                return `
                    <div class="flex items-center p-2 md:p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-orange-100 p-2 md:p-3 rounded-full mr-2 md:mr-4">
                            <i class="fas fa-door-open text-orange-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800 text-sm md:text-base">${activity.employeeName} - ${activity.message}</p>
                            <p class="text-xs md:text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-1 md:p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            } else if (activity.type === 'debt_warning') {
                return `
                    <div class="flex items-center p-2 md:p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div class="bg-red-100 p-2 md:p-3 rounded-full mr-2 md:mr-4">
                            <i class="fas fa-exclamation-circle text-red-500"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-800 text-sm md:text-base">${activity.employeeName} - ${activity.message}</p>
                            <p class="text-xs md:text-sm text-gray-500">${timeAgo} - ${dateStr}</p>
                        </div>
                        <button class="delete-activity-btn text-gray-400 hover:text-red-500 transition-colors p-1 md:p-2" data-timestamp="${activity.timestamp}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            }
        }).join('');
        
        recentActivityList.innerHTML = activitiesHTML;
    }
    
    // Günlük kalan borç uyarısını activityHistory'ye kaydet
    checkDebtWarning(employee) {
        if (!employee.startDate) return;
        
        // Sadece aktif çalışanlar için bildirim gönder
        if (employee.status === 'inactive' || employee.isStopped) return;
        
        const currentDebt = this.calculateCurrentDebt(employee);
        if (currentDebt <= 0) return;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = toLocalDateStr(today);
        
        if (!employee.activityHistory) employee.activityHistory = [];
        
        // Bugün için borç uyarısı zaten eklenmiş mi kontrol et
        const alreadyWarned = employee.activityHistory.some(activity =>
            activity.type === 'debt_warning' && activity.date === todayStr
        );
        
        if (!alreadyWarned) {
            const debtDisplay = currentDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            employee.activityHistory.push({
                type: 'debt_warning',
                employeeName: employee.name,
                message: `Kalan borç: ${debtDisplay} TL`,
                date: todayStr,
                timestamp: today.getTime()
            });
            showNotification(`${employee.name}: Kalan borç ${debtDisplay} TL`, 'warning');
            this.saveData();
        }
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
        
        // Özet bilgileri hesapla
        const totalDebt = activeEmployees.reduce((sum, emp) => sum + this.calculateCurrentDebt(emp), 0);
        const formattedTotalDebt = totalDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const totalSalary = activeEmployees.reduce((sum, emp) => sum + (emp.salaryAmount || 0), 0);
        const formattedTotalSalary = totalSalary.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const activeWorkingEmployees = activeEmployees.filter(emp => !emp.isStopped).length;
        
        if (activeEmployees.length === 0) {
            employeesSection.innerHTML = `
                <div class="bg-white rounded-xl shadow-lg p-8 text-center">
                    <i class="fas fa-users text-gray-300 text-6xl mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Henüz çalışan yok</h3>
                    <p class="text-gray-500 mb-4">İlk çalışanınızı eklemek için butona tıklayın</p>
                    <div class="flex gap-3 justify-center flex-wrap">
                        <button id="addEmployeeBtn" class="bg-emerald-500 text-white px-3 py-1.5 md:px-6 md:py-3 rounded-lg hover:bg-emerald-600 transition-colors text-xs md:text-base">
                            <i class="fas fa-user-plus mr-2"></i>
                            Yeni İşçi Ekle
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        let employeesHTML = activeEmployees.map((emp) => {
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
            const totalWorkDays = dailyLogs.filter(log => !log.isClosedDay).length;
            
            // Status check for today's earnings display
            const today = new Date();
            const currentHour = today.getHours();
            let todayStatus, isPending, isClosedDay, isTodayAbsent;
            
            if (emp.salaryType === 'monthly') {
                // Aylık çalışanlarda kapalı gün ve devamsızlık durum kartı etkilemez
                const paymentDate = this.getMonthlyPaymentDate(today.getFullYear(), today.getMonth(), emp);
                const isPaymentDay = today.getTime() === paymentDate.getTime();
                isPending = !isPaymentDay || (isPaymentDay && currentHour < 18);
                todayStatus = isPending ? "Bekleniyor" : "Eklendi";
                isClosedDay = false;
                isTodayAbsent = false;
            } else {
                todayStatus = this.getStatusForDate(today, emp);
                isPending = todayStatus === "Bekleniyor";
                isClosedDay = todayStatus === "Kapalı Gün";
                
                // Check if today is an absence day
                const todayStr = toLocalDateStr(today);
                isTodayAbsent = emp.absenceHistory && emp.absenceHistory.some(absence => absence.date === todayStr);
            }
            
            // Dynamic styling based on status
            let borderColor, textColor, titleText, amountText, iconBgColor, iconClass;
            
            if (emp.isStopped) {
                // İş durdurulmuş - gri kart
                borderColor = "border-gray-200";
                textColor = "text-gray-500";
                titleText = "Çalışan Aktif Değil";
                amountText = "İş Durduruldu";
                iconBgColor = "bg-gray-500";
                iconClass = "fa-pause";
            } else if (isClosedDay) {
                // Kapalı gün - mor/mavi kart
                borderColor = "border-indigo-200";
                textColor = "text-indigo-500";
                titleText = "Kapalı Gün";
                amountText = "Tatil";
                iconBgColor = "bg-indigo-500";
                iconClass = "fa-store-slash";
            } else if (isTodayAbsent) {
                // Devamsızlık günü - kırmızı kart
                borderColor = "border-red-200";
                textColor = "text-red-500";
                titleText = "Bugün Gelmedi";
                amountText = "Devamsızlık";
                iconBgColor = "bg-red-500";
                iconClass = "fa-calendar-times";
            } else if (isPending) {
                // Bekleniyor - turuncu kart
                borderColor = "border-orange-200";
                textColor = "text-orange-500";
                if (emp.salaryType === 'monthly') {
                    const paymentDate = this.getMonthlyPaymentDate(today.getFullYear(), today.getMonth(), emp);
                    const nextPaymentStr = paymentDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                    titleText = "Aylık Ödeme Bekleniyor";
                    amountText = `${emp.salaryAmount.toLocaleString('tr-TR')} TL — ${nextPaymentStr}`;
                } else {
                    titleText = "Bekleniyor";
                    amountText = `${formattedDailyRate} TL Eklenecek`;
                }
                iconBgColor = "bg-orange-500";
                iconClass = "fa-clock";
            } else {
                // Eklenecek Tutar - yeşil kart
                borderColor = "border-emerald-200";
                textColor = "text-emerald-600";
                if (emp.salaryType === 'monthly') {
                    titleText = "Aylık Ödeme Eklendi";
                    amountText = `+${emp.salaryAmount.toLocaleString('tr-TR')} TL`;
                } else {
                    titleText = "Eklendi";
                    amountText = `+${formattedDailyRate} TL`;
                }
                iconBgColor = "bg-emerald-500";
                iconClass = "fa-coins";
            }
            
            return `
            <div class="bg-white rounded-xl shadow-lg p-4 md:p-6 hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between mb-3 md:mb-4">
                    <div class="flex items-center min-w-0">
                        <div class="bg-blue-100 p-0.5 md:p-1 rounded-full mr-2 md:mr-4 shrink-0">
                            ${emp.photo ? `<img src="${emp.photo}" alt="${emp.name}" class="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover">` : `<div class="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center"><i class="fas fa-user text-blue-500 text-lg md:text-xl"></i></div>`}
                        </div>
                        <div class="min-w-0">
                            <h3 class="font-bold text-gray-800 text-base md:text-lg truncate">${emp.name}</h3>
                            ${emp.phone ? `<p class="text-gray-500 text-xs md:text-sm">${emp.phone}</p>` : ''}
                            <div class="flex items-center mt-1 text-[10px] md:text-xs text-gray-400">
                                <i class="fas fa-calendar-alt mr-1"></i>
                                <span class="truncate">İşe Başlama: ${startDateStr}</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right shrink-0 ml-2">
                        <p class="text-base md:text-lg font-bold text-gray-800">${emp.salaryAmount.toLocaleString('tr-TR')} TL</p>
                        <p class="text-xs md:text-sm text-gray-500">${emp.salaryType === 'weekly' ? 'Haftalık' : emp.salaryType === 'monthly' ? 'Aylık' : 'Günlük'}</p>
                    </div>
                </div>
                
                <div class="bg-blue-50 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-clock text-blue-500 mr-2 text-xs md:text-sm"></i>
                        <span class="text-xs md:text-sm text-blue-700 font-medium">${totalWorkDays} iş günü çalışıyor</span>
                    </div>
                </div>
                
                ${emp.isStopped ? `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-pause-circle text-yellow-500 mr-2 text-xs md:text-sm"></i>
                        <span class="text-xs md:text-sm text-yellow-700 font-medium">İş Durduruldu - Borç/Hak Ediş Hesaplanmıyor</span>
                    </div>
                </div>
                ` : ''}
                
                <div class="flex flex-wrap items-center justify-between gap-2 mt-3">
                    <div class="flex items-center gap-1.5 shrink-0">
                        <!-- Borç Kutusu -->
                        <div class="flex items-center gap-1 md:gap-3 bg-gradient-to-br from-blue-50 to-white border border-blue-200 shadow-sm rounded-xl p-1.5 md:p-3 hover:shadow-md transition-shadow" style="min-width:100px">
                            <div class="bg-blue-500 text-white p-1 md:p-2.5 rounded-lg shadow-sm shrink-0">
                                <i class="fas fa-wallet text-[10px] md:text-sm"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="text-[8px] md:text-[10px] text-blue-600 uppercase font-bold tracking-wider whitespace-nowrap">Borç</p>
                                <p class="text-[10px] md:text-sm font-bold text-gray-800 whitespace-nowrap">${formattedDebt} TL</p>
                            </div>
                        </div>
                        
                        <!-- Kazanç Kutusu -->
                        <div class="flex items-center gap-1 md:gap-3 bg-gradient-to-br ${isClosedDay ? 'from-indigo-50 to-white' : 'from-gray-50 to-white'} border ${borderColor} shadow-sm rounded-xl p-1.5 md:p-3 hover:shadow-md transition-shadow" style="min-width:100px">
                            <div class="${iconBgColor} text-white p-1 md:p-2.5 rounded-lg shadow-sm shrink-0">
                                <i class="fas ${iconClass} text-[10px] md:text-sm"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="text-[8px] md:text-[10px] ${textColor} uppercase font-bold tracking-wider whitespace-nowrap">${titleText}</p>
                                <p class="text-[10px] md:text-sm font-bold text-gray-800 whitespace-nowrap">${amountText}</p>
                            </div>
                        </div>
                    </div>
                    <!-- Mobil butonlar -->
                    <div class="flex items-center gap-1 md:hidden">
                        <button data-id="${emp.id}" class="editBtn bg-blue-500 text-white px-2 py-1.5 rounded-lg hover:bg-blue-600 transition-colors text-[10px]">
                            <i class="fas fa-edit mr-0.5"></i>Düzenle
                        </button>
                        <button data-id="${emp.id}" class="detailsBtn bg-purple-500 text-white px-2 py-1.5 rounded-lg hover:bg-purple-600 transition-colors text-[10px]">
                            <i class="fas fa-info-circle mr-0.5"></i>Detay
                        </button>
                        <!-- İşlemler Dropdown -->
                        <div class="relative">
                            <button data-id="${emp.id}" class="actionsMenuBtn bg-gray-700 text-white px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-[10px] flex items-center gap-0.5">
                                <i class="fas fa-ellipsis-v mr-0.5"></i>
                                <span>Diğer İşlemler</span>
                            </button>
                            <div class="actionsDropdown hidden absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 min-w-[150px] overflow-visible">
                                <button data-id="${emp.id}" class="absenceBtn w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
                                    <i class="fas fa-calendar-times w-4"></i>Devamsızlık
                                </button>
                                <button data-id="${emp.id}" class="toggleWorkBtn w-full flex items-center gap-2 px-3 py-2 text-xs ${emp.isStopped ? 'text-green-600 hover:bg-green-50' : 'text-yellow-600 hover:bg-yellow-50'} transition-colors">
                                    <i class="fas ${emp.isStopped ? 'fa-play' : 'fa-pause'} w-4"></i>
                                    <span>${emp.isStopped ? 'Devam Ettir' : 'İşi Durdur'}</span>
                                    ${!emp.isStopped ? `<span class="ml-auto group relative inline-block">
                                        <i class="fas fa-exclamation-circle text-yellow-400 cursor-help"></i>
                                        <div class="pointer-events-none absolute right-0 bottom-full mb-2 w-56 bg-gray-900 text-white text-[11px] rounded-xl px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-[999] leading-relaxed shadow-2xl" style="white-space:normal;">
                                            ⚠️ <strong>Dikkat:</strong> İşi durdurduğunuzda, siz tekrar <em>"Devam Ettir"</em> butonuna basana kadar bu işçinin borç ve hak ediş hesaplaması durur.
                                        </div>
                                    </span>` : ''}
                                </button>
                                <button data-id="${emp.id}" class="paymentBtn w-full flex items-center gap-2 px-3 py-2 text-xs text-green-600 hover:bg-green-50 transition-colors">
                                    <i class="fas fa-money-check-alt w-4"></i>Ödeme
                                </button>
                                <button data-id="${emp.id}" class="historyBtn w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 transition-colors">
                                    <i class="fas fa-history w-4"></i>Geçmiş
                                </button>
                                <div class="border-t border-gray-100"></div>
                                <button data-id="${emp.id}" class="terminateBtn w-full flex items-center gap-2 px-3 py-2 text-xs text-orange-600 hover:bg-orange-50 transition-colors">
                                    <i class="fas fa-door-open w-4"></i>İşten Çıkar
                                </button>
                            </div>
                        </div>
                    </div>
                    <!-- Masaüstü butonlar -->
                    <div class="hidden md:flex flex-wrap items-center gap-2">
                        <button data-id="${emp.id}" class="editBtn bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                            <i class="fas fa-edit mr-1"></i>Düzenle
                        </button>
                        <button data-id="${emp.id}" class="detailsBtn bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm">
                            <i class="fas fa-info-circle mr-1"></i>Detay
                        </button>
                        <div class="relative">
                            <button data-id="${emp.id}" class="actionsMenuBtn bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm flex items-center gap-1">
                                <i class="fas fa-ellipsis-v"></i>
                                <span>Diğer İşlemler</span>
                            </button>
                            <div class="actionsDropdown hidden absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 min-w-[170px] overflow-visible">
                                <button data-id="${emp.id}" class="absenceBtn w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                    <i class="fas fa-calendar-times w-4"></i>Devamsızlık
                                </button>
                                <button data-id="${emp.id}" class="toggleWorkBtn w-full flex items-center gap-2 px-3 py-2 text-sm ${emp.isStopped ? 'text-green-600 hover:bg-green-50' : 'text-yellow-600 hover:bg-yellow-50'} transition-colors">
                                    <i class="fas ${emp.isStopped ? 'fa-play' : 'fa-pause'} w-4"></i>
                                    <span>${emp.isStopped ? 'Devam Ettir' : 'İşi Durdur'}</span>
                                </button>
                                <button data-id="${emp.id}" class="paymentBtn w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors">
                                    <i class="fas fa-money-check-alt w-4"></i>Ödeme
                                </button>
                                <button data-id="${emp.id}" class="historyBtn w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors">
                                    <i class="fas fa-history w-4"></i>Geçmiş
                                </button>
                                <div class="border-t border-gray-100"></div>
                                <button data-id="${emp.id}" class="terminateBtn w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors">
                                    <i class="fas fa-door-open w-4"></i>İşten Çıkar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        employeesSection.innerHTML = `
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4">
                <div class="w-full bg-white rounded-xl shadow-lg p-3 md:p-5 border-l-4 border-emerald-500 md:flex-1 min-w-0">
                    <div class="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200 gap-y-3 md:gap-y-0">
                        <div class="flex items-center justify-between gap-2 px-2 md:px-4 first:pl-0">
                            <div class="min-w-0">
                                <p class="text-[10px] md:text-xs text-gray-500 uppercase font-semibold tracking-wide truncate">Toplam Çalışan</p>
                                <p class="text-lg md:text-2xl font-bold text-gray-800">${activeEmployees.length}</p>
                            </div>
                            <div class="bg-emerald-100 p-1.5 md:p-2 rounded-full shrink-0">
                                <i class="fas fa-users text-emerald-500 text-sm md:text-xl"></i>
                            </div>
                        </div>
                        <div class="flex items-center justify-between gap-2 px-2 md:px-4">
                            <div class="min-w-0">
                                <p class="text-[10px] md:text-xs text-gray-500 uppercase font-semibold tracking-wide truncate">Aktif Çalışan</p>
                                <p class="text-base md:text-xl font-bold text-emerald-600">${activeWorkingEmployees}</p>
                            </div>
                            <div class="bg-emerald-50 p-1.5 md:p-2 rounded-full shrink-0">
                                <i class="fas fa-user-check text-emerald-500 text-sm md:text-lg"></i>
                            </div>
                        </div>
                        <div class="flex items-center justify-between gap-2 px-2 md:px-4">
                            <div class="min-w-0">
                                <p class="text-[10px] md:text-xs text-gray-500 uppercase font-semibold tracking-wide truncate">Toplam Borç</p>
                                <p class="text-base md:text-xl font-bold text-red-600 truncate">${formattedTotalDebt} TL</p>
                            </div>
                            <div class="bg-red-100 p-1.5 md:p-2 rounded-full shrink-0">
                                <i class="fas fa-wallet text-red-500 text-sm md:text-lg"></i>
                            </div>
                        </div>
                        <div class="flex items-center justify-between gap-2 px-2 md:px-4">
                            <div class="min-w-0">
                                <p class="text-[10px] md:text-xs text-gray-500 uppercase font-semibold tracking-wide truncate">Toplam Maaş</p>
                                <p class="text-base md:text-xl font-bold text-blue-600 truncate">${formattedTotalSalary} TL</p>
                            </div>
                            <div class="bg-blue-100 p-1.5 md:p-2 rounded-full shrink-0">
                                <i class="fas fa-coins text-blue-500 text-sm md:text-lg"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="w-full md:w-auto">
                    <button id="addEmployeeBtn" class="w-full md:w-auto bg-emerald-500 text-white px-3 py-2 md:px-6 md:py-3 rounded-lg hover:bg-emerald-600 transition-colors text-xs md:text-base flex items-center justify-center md:justify-start gap-2">
                        <i class="fas fa-user-plus"></i>
                        <span>Yeni İşçi Ekle</span>
                    </button>
                </div>
            </div>
            <div class="grid gap-3 md:gap-4">
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
        
        let employeesHTML = inactiveEmployees.map((emp) => {
            const departureDate = emp.departureDate ? new Date(emp.departureDate) : null;
            const departureDateStr = departureDate ? departureDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirtilmemiş';
            const fixedDebt = this.calculateCurrentDebt(emp);
            
            return `
            <div class="bg-white rounded-xl shadow-lg p-3 md:p-6 hover:shadow-xl transition-shadow border-l-4 border-gray-400">
                <div class="flex items-center justify-between mb-2 md:mb-4">
                    <div class="flex items-center min-w-0">
                        <div class="bg-gray-100 p-1.5 md:p-3 rounded-full mr-2 md:mr-4 shrink-0">
                            <i class="fas fa-user-slash text-gray-500 text-base md:text-xl"></i>
                        </div>
                        <div class="min-w-0">
                            <h3 class="font-bold text-gray-800 text-sm md:text-base truncate">${emp.name}</h3>
                            <p class="text-gray-500 text-[10px] md:text-sm truncate">${emp.phone}</p>
                            <div class="flex items-center mt-1 text-[10px] md:text-xs text-gray-400">
                                <i class="fas fa-calendar-times mr-1"></i>
                                <span class="truncate">Ayrılma: ${departureDateStr}</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right shrink-0 ml-1">
                        <p class="text-sm md:text-lg font-bold text-gray-800">${emp.salaryAmount.toLocaleString('tr-TR')} TL</p>
                        <p class="text-[10px] md:text-sm text-gray-500">${emp.salaryType === 'weekly' ? 'Haft.' : emp.salaryType === 'monthly' ? 'Ayl.' : 'Günl.'}</p>
                    </div>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-2 md:p-3 mb-2 md:mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-coins text-gray-500 mr-1.5 md:mr-2 text-xs md:text-sm"></i>
                        <span class="text-xs md:text-sm text-gray-700 font-medium truncate">Borç: ${fixedDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</span>
                    </div>
                </div>
                
                <div class="flex flex-col gap-1.5 md:gap-2">
                    <button data-id="${emp.id}" class="showPastHistoryBtn bg-blue-500 text-white px-2 py-1.5 md:px-3 md:py-2 rounded-lg hover:bg-blue-600 transition-colors text-xs md:text-sm">
                        <i class="fas fa-history mr-1"></i>
                        Geçmiş
                    </button>
                    <button data-id="${emp.id}" class="permanentlyDeleteBtn bg-red-500 text-white px-2 py-1.5 md:px-3 md:py-2 rounded-lg hover:bg-red-600 transition-colors text-xs md:text-sm">
                        <i class="fas fa-trash mr-1"></i>
                        Sil
                    </button>
                </div>
            </div>
            `;
        }).join('');
        
        pastEmployeesSection.innerHTML = `
            <div class="grid grid-cols-2 gap-3 md:gap-4">
                ${employeesHTML}
            </div>
        `;
    }
    
    // Geçmiş çalışan geçmişini göster
    showPastEmployeeHistory(employeeId) {
        const employee = this.findEmployeeById(employeeId);
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
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-user-cog text-blue-500 mr-2"></i>
                        Hesabım
                    </h2>
                    
                    <p class="text-gray-600 mb-6">
                        Hesap bilgilerinizi buradan yönetebilir, ad soyad bilginizi güncelleyebilir ve şifrenizi değiştirebilirsiniz. Bilgileriniz güvenle saklanır ve sizin dışınızda paylaşılmaz.
                    </p>
                    
                    <form id="accountForm" class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">E-posta Adresi</label>
                            <input type="email" value="${user.email}" disabled class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed">
                            <p class="text-xs text-gray-500 mt-1">E-posta adresi değiştirilemez</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">İsim Soyisim</label>
                            <input type="text" id="accountName" value="${user.displayName || ''}" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <p class="text-xs text-gray-500 mt-1">Bu isim uygulama içinde size hitap etmek için kullanılır</p>
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
                    
                    <div class="border-t border-red-200 pt-6 mt-6 bg-red-50 rounded-lg p-5 border">
                        <h3 class="font-semibold text-red-800 mb-3 flex items-center">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            Tehlikeli Bölge
                        </h3>
                        <p class="text-sm text-red-700 mb-4">
                            Hesabınızı sildiğinizde tüm çalışan verileriniz, ödeme geçmişiniz ve hesap bilgileriniz kalıcı olarak silinir. Bu işlem geri alınamaz.
                        </p>
                        <button id="openDeleteAccountModalBtn" class="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold">
                            <i class="fas fa-trash-alt mr-2"></i>
                            Hesabı Sil
                        </button>
                    </div>
                    
                    <div class="mt-6 bg-blue-50 rounded-lg p-5 border border-blue-100">
                        <h3 class="font-semibold text-blue-800 mb-3 flex items-center">
                            <i class="fas fa-shield-alt mr-2"></i>
                            Hesap Güvenliği İpuçları
                        </h3>
                        <ul class="text-sm text-blue-700 space-y-2 list-disc list-inside">
                            <li>Şifrenizi düzenli aralıklarla güncelleyin ve kolay tahmin edilebilir şifrelerden kaçının.</li>
                            <li>Hesabınıza ait e-posta adresinin güncel ve aktif olduğundan emin olun.</li>
                            <li>Şüpheli bir aktivite fark ederseniz hemen şifrenizi değiştirin.</li>
                            <li>Ortak veya halka açık bilgisayarlarda oturumunuzu kapatmayı unutmayın.</li>
                        </ul>
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
        effectiveDate.setHours(0, 0, 0, 0);
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
        const salaryAmount = parseTurkishNumber(salaryAmountInput);
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
    async addEmployee() {
        const name = document.getElementById('employeeName').value.trim();
        const phone = document.getElementById('employeePhone').value.trim();
        const salaryType = document.getElementById('salaryType').value;
        const salaryAmount = parseTurkishNumber(document.getElementById('salaryAmount').value);
        const photoInput = document.getElementById('employeePhoto');
        
        // Get selected closed days from checkboxes
        const closedDaysCheckboxes = document.querySelectorAll('input[name="closedDays"]:checked');
        const closedDays = Array.from(closedDaysCheckboxes).map(cb => parseInt(cb.value));
        
        if (!name || !salaryType || isNaN(salaryAmount) || salaryAmount <= 0) {
            showNotification('Lütfen zorunlu alanları doldurun', 'error');
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

        // Başlangıç tarihini seçilen tarih olarak kaydet (saat kontrolü borç hesaplamasında yapılır)
        const effectiveStartDate = this.getEffectiveEmployeeStartDate(selectedStartDate, now);

        // Opsiyonel fotoğrafı base64 olarak oku
        let photo = null;
        if (photoInput && photoInput.files && photoInput.files[0]) {
            const file = photoInput.files[0];
            if (file.size > 2 * 1024 * 1024) {
                showNotification('Fotoğraf boyutu 2 MB üzerinde olamaz', 'error');
                return;
            }
            try {
                photo = await this.readFileAsBase64(file);
            } catch (err) {
                console.error('Fotoğraf okuma hatası:', err);
                showNotification('Fotoğraf yüklenemedi', 'error');
                return;
            }
        }

        const employee = {
            id: this.generateEmployeeId(),
            name,
            phone: phone || null,
            photo,
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
        this.clearEmployeePhotoPreview();
        closeModal('employeeModal');
        
        showNotification('İşçi başarıyla eklendi', 'success');
        this.renderEmployeesPage();
    }
    
    // Dosyayı base64'e çevir
    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }
    
    // Çalışan fotoğrafı önizlemesini temizle
    clearEmployeePhotoPreview() {
        const preview = document.getElementById('employeePhotoPreview');
        const previewImg = document.getElementById('employeePhotoPreviewImg');
        const photoInput = document.getElementById('employeePhoto');
        const placeholder = document.getElementById('employeePhotoPlaceholder');
        if (preview) preview.classList.add('hidden');
        if (previewImg) previewImg.src = '';
        if (photoInput) photoInput.value = '';
        if (placeholder) placeholder.classList.remove('hidden');
    }

    // Rastgele demo çalışanları ekle
    addDemoEmployees() {
        const firstNames = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Ali', 'Veli', 'Zeynep', 'Elif', 'Burak', 'Can', 'Emre', 'Sibel', 'Hakan', 'Murat', 'Selin', 'Cem', 'Buse', 'Gökhan', 'Derya', 'İbrahim'];
        const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Kara', 'Koç', 'Yıldız', 'Akın'];
        const salaryTypes = ['daily', 'weekly', 'monthly'];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const generatePhone = () => {
            const prefixes = ['530', '531', '532', '533', '534', '535', '536', '537', '538', '539', '540', '541', '542', '543', '544', '545', '546', '547', '548', '549', '505', '506', '507', '508', '509', '551', '552', '553', '554', '555', '559'];
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
            const full = '0' + prefix + suffix;
            return full.slice(0, 4) + ' ' + full.slice(4, 7) + ' ' + full.slice(7, 9) + ' ' + full.slice(9, 11);
        };

        const generateName = () => {
            const first = firstNames[Math.floor(Math.random() * firstNames.length)];
            const last = lastNames[Math.floor(Math.random() * lastNames.length)];
            return `${first} ${last}`;
        };

        const generateStartDate = () => {
            const daysAgo = Math.floor(Math.random() * 60) + 1;
            const date = new Date(today);
            date.setDate(date.getDate() - daysAgo);
            return date.getTime();
        };

        const generateSalaryAmount = (type) => {
            if (type === 'daily') return Math.floor(Math.random() * 1500) + 500;
            if (type === 'weekly') return Math.floor(Math.random() * 8000) + 3000;
            return Math.floor(Math.random() * 30000) + 10000;
        };

        const generateClosedDays = () => {
            const allDays = [0, 1, 2, 3, 4, 5, 6];
            const count = Math.floor(Math.random() * 3);
            const shuffled = [...allDays].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, count);
        };

        const salaryType = salaryTypes[Math.floor(Math.random() * salaryTypes.length)];
        const employee = {
            id: this.generateEmployeeId(),
            name: generateName(),
            phone: generatePhone(),
            salaryType,
            salaryAmount: generateSalaryAmount(salaryType),
            closedDays: generateClosedDays(),
            debt: 0,
            startDate: generateStartDate(),
            absenceHistory: [],
            paymentHistory: [],
            dailyLogs: []
        };
        this.employees.push(employee);

        this.saveData();
        showNotification(`${employee.name} demo olarak eklendi`, 'success');
        this.renderEmployeesPage();
        this.renderHomePage();
    }

    // İşçiyi işten çıkar (status: inactive)
    terminateEmployee(employeeId) {
        const employeeIndex = this.findEmployeeIndexById(employeeId);
        if (employeeIndex !== -1) {
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
    toggleWorkStatus(employeeId) {
        const employeeIndex = this.findEmployeeIndexById(employeeId);
        if (employeeIndex !== -1) {
            const employee = this.employees[employeeIndex];
            const currentStatus = employee.isStopped || false;
            const newStatus = !currentStatus;
            
            if (newStatus) {
                // İş durdurulacak - custom modal göster
                this.pendingWorkStopId = employee.id;
                const modal = document.getElementById('workStopModal');
                if (modal) modal.classList.remove('hidden');
            } else {
                // İş devam ettirilecek - modal göster
                this.pendingWorkResumeId = employee.id;
                const resumeModal = document.getElementById('workResumeModal');
                if (resumeModal) resumeModal.classList.remove('hidden');
            }
        }
    }

    // İş durdurmayı onayla
    confirmWorkStop() {
        const employee = this.pendingWorkStopId ? this.findEmployeeById(this.pendingWorkStopId) : null;
        if (employee) {
            employee.isStopped = true;
            employee.workStopDate = Date.now();
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
            
            // Günlük detaylar modalı açıksa ve aynı çalışanı gösteriyorsa, yenile
            if (window.currentDailyDetailsEmployeeId === employee.id) {
                const dailyDetailsModal = document.getElementById('dailyDetailsModal');
                if (dailyDetailsModal && !dailyDetailsModal.classList.contains('hidden')) {
                    openDailyDetails(employee.id);
                }
            }
        }
        this.closeWorkStopModal();
    }

    // İş durdurma modalını kapat
    closeWorkStopModal() {
        const modal = document.getElementById('workStopModal');
        if (modal) modal.classList.add('hidden');
        this.pendingWorkStopId = null;
    }

    // İşi devam ettir (bugünden veya yarından)
    confirmWorkResume(startFromToday) {
        const employee = this.pendingWorkResumeId ? this.findEmployeeById(this.pendingWorkResumeId) : null;
        if (employee) {
            employee.isStopped = false;
            const now = new Date();
            if (startFromToday) {
                // Bugün gece yarısından itibaren
                const today = new Date(now);
                today.setHours(0, 0, 0, 0);
                employee.workResumeDate = today.getTime();
            } else {
                // Yarın gece yarısından itibaren
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                employee.workResumeDate = tomorrow.getTime();
            }
            this.saveData();
            this.renderEmployeesPage();
            showNotification('Çalışanın işi devam ettirildi', 'success');

            if (!employee.activityHistory) employee.activityHistory = [];
            employee.activityHistory.push({
                type: 'work_resumed',
                employeeName: employee.name,
                message: startFromToday ? 'İşi bugünden devam ettirildi' : 'İşi yarından devam ettirildi',
                timestamp: Date.now()
            });
            this.saveData();

            if (window.currentDailyDetailsEmployeeId === employee.id) {
                const dailyDetailsModal = document.getElementById('dailyDetailsModal');
                if (dailyDetailsModal && !dailyDetailsModal.classList.contains('hidden')) {
                    openDailyDetails(employee.id);
                }
            }
        }
        this.closeWorkResumeModal();
    }

    closeWorkResumeModal() {
        const modal = document.getElementById('workResumeModal');
        if (modal) modal.classList.add('hidden');
        this.pendingWorkResumeId = null;
    }

    // Günün durumunu belirle
    getStatusForDate(date, employee = null) {
        const now = new Date();
        const currentHour = now.getHours();
        
        const today = new Date(now.toDateString());
        const target = new Date(date.toDateString());

        // 1. Kapalı gün kontrolü (çalışan bilgisi varsa)
        if (employee && this.isClosedDay(target, employee)) {
            return "Kapalı Gün";
        }

        // 2. Aylık maaşlı çalışanlar için ödeme günü kontrolü
        if (employee && employee.salaryType === 'monthly' && employee.startDate) {
            const paymentDate = this.getMonthlyPaymentDate(target.getFullYear(), target.getMonth(), employee);
            const isPaymentDay = target.getTime() === paymentDate.getTime();
            
            if (target > today) return "Bekleniyor";
            if (target.getTime() === today.getTime()) {
                if (!isPaymentDay) return "Bekleniyor";
                return currentHour >= 18 ? "Eklendi" : "Bekleniyor";
            }
            // Geçmiş ödeme günleri: eklendi, diğer günler: bekleniyor
            return isPaymentDay ? "Eklendi" : "Bekleniyor";
        }

        // 3. Gelecek günler: Kesinlikle "Bekleniyor"
        if (target > today) return "Bekleniyor";

        // 4. Bugün:
        if (target.getTime() === today.getTime()) {
            if (currentHour >= 0 && currentHour < 6) return "Gece Kapalı"; // 00:00 - 06:00 iş yeri kapalı
            if (currentHour >= 6 && currentHour < 18) return "Bekleniyor"; // 06:00 - 18:00 arası
            return "Eklendi"; // 18:00 sonrası
        }

        // 5. Geçmiş günler: Kesinlikle "Eklendi"
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
        
        // İş durdurma ve geri başlatma tarihleri
        const workStopDate = employee.workStopDate ? new Date(employee.workStopDate) : null;
        const workResumeDate = employee.workResumeDate ? new Date(employee.workResumeDate) : null;
        
        // startDate'dan bugüne kadar olan günleri hesapla (off-by-one hatası düzeltildi)
        while (currentDate <= endDate) {
            const dateStr = toDateString(currentDate);
            const dayOfWeek = currentDate.getDay();
            const currentDateMidnight = new Date(dateStr + 'T00:00:00');
            
            // Check if this day is a closed day
            const isClosedDay = employee.closedDays && employee.closedDays.includes(dayOfWeek);
            
            // Check if there's an existing log for this date
            const existingLog = employee.dailyLogs && employee.dailyLogs.find(log => log.date === dateStr);
            
            if (existingLog) {
                logs.push(existingLog);
            } else {
                // İş durdurulmuşsa ve geri başlatılmamışsa, durdurma tarihinden sonraki günleri atla
                if (workStopDate && !workResumeDate && currentDateMidnight >= workStopDate) {
                    currentDate.setDate(currentDate.getDate() + 1);
                    continue;
                }
                
                // İş durdurulmuş ve geri başlatılmışsa, durdurma ve geri başlatma arasındaki günleri atla
                if (workStopDate && workResumeDate) {
                    if (currentDateMidnight >= workStopDate && currentDateMidnight < workResumeDate) {
                        currentDate.setDate(currentDate.getDate() + 1);
                        continue;
                    }
                }
                
                // Calculate daily amount based on salary type
                let dailyAmount = 0;
                if (employee.salaryType === 'daily') {
                    dailyAmount = employee.salaryAmount;
                } else if (employee.salaryType === 'weekly') {
                    const closedDays = employee.closedDays || [];
                    const workingDaysPerWeek = 7 - closedDays.length;
                    dailyAmount = employee.salaryAmount / workingDaysPerWeek;
                } else if (employee.salaryType === 'monthly') {
                    // Aylık maaşlı çalışanlarda sadece ödeme gününde tam maaş göster
                    const paymentDate = this.getMonthlyPaymentDate(currentDate.getFullYear(), currentDate.getMonth(), employee);
                    const isPaymentDay = currentDate.getTime() === paymentDate.getTime();
                    const todayMidnight = new Date(today);
                    todayMidnight.setHours(0, 0, 0, 0);
                    if (isPaymentDay && (currentDate < todayMidnight || (currentDate.getTime() === todayMidnight.getTime() && currentHour >= 18))) {
                        dailyAmount = employee.salaryAmount;
                    } else {
                        dailyAmount = 0;
                    }
                }
                
                // If it's a closed day, no payment
                if (isClosedDay) {
                    dailyAmount = 0;
                }
                
                // Determine status based on getStatusForDate function
                const statusText = this.getStatusForDate(currentDate, employee);
                const status = statusText === 'Eklendi' ? 'added' : (statusText === 'Kapalı Gün' ? 'closed' : 'pending');
                
                // Check if work was stopped on this day
                const isStopped = employee.isStopped || false;
                
                // Check if this day is an absence day
                const isAbsent = employee.absenceHistory && employee.absenceHistory.some(absence => absence.date === dateStr);
                
                logs.push({
                    date: dateStr,
                    status: status,
                    amount: dailyAmount,
                    isStopped: isStopped,
                    isClosedDay: isClosedDay,
                    isAbsent: isAbsent
                });
            }
            
            // Bir sonraki güne geç
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // En yeni gün en üstte olacak şekilde ters çevir
        return logs.reverse();
    }
    
    // İşçiyi kalıcı olarak sil (şifre doğrulaması ile)
    permanentlyDeleteEmployee(employeeId, password) {
        const employeeIndex = this.findEmployeeIndexById(employeeId);
        if (employeeIndex !== -1) {
            const user = auth.currentUser;
            if (!user) {
                showNotification('Kullanıcı oturumu bulunamadı', 'error');
                return;
            }
            
            reauthenticateCurrentUser(password)
                .then(() => {
                    // Doğrulama başarılı, çalışanı sil
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
                    console.error('Doğrulama hatası:', error);
                    if (error.message === 'Şifre gerekli') {
                        showNotification('Lütfen şifrenizi girin', 'error');
                    } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        showNotification('Hatalı şifre, silme işlemi reddedildi!', 'error');
                    } else {
                        showNotification('Doğrulama başarısız, lütfen tekrar deneyin', 'error');
                    }
                });
        }
    }
    
    // İşçi sil
    deleteEmployee(employeeId) {
        const employeeIndex = this.findEmployeeIndexById(employeeId);
        if (employeeIndex !== -1) {
            this.employees.splice(employeeIndex, 1);
            this.saveData();
            this.renderEmployeesPage();
            this.renderHomePage();
            showNotification('Çalışan başarıyla silindi', 'success');
        }
    }
    
    // Ödemeyi sil
    deletePayment(employeeId, recordIndex) {
        const employee = this.findEmployeeById(employeeId);
        if (!employee) return;
        
        if (!employee.paymentHistory || recordIndex < 0 || recordIndex >= employee.paymentHistory.length) return;
        
        // Kaydı sil
        employee.paymentHistory.splice(recordIndex, 1);
        
        this.saveData();
        
        // Geçmiş modalını güncelle
        showHistory(employeeId);
        
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
        
        // Tarih kontrolü
        const startDate = new Date(employee.startDate);
        startDate.setHours(0, 0, 0, 0);
        const selectedDate = parseLocalDate(date);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tenDaysAgo = new Date(today);
        tenDaysAgo.setDate(today.getDate() - 10);
        
        // İşe başlamadan önceki tarihleri engelle
        if (selectedDate < startDate) {
            showNotification('İşe başlamadan önceki tarih için devamsızlık ekleyemezsiniz', 'error');
            return;
        }
        
        // Sadece bugün ve geçmiş 10 gün için izin ver
        if (selectedDate > today) {
            showNotification('Gelecek tarihe devamsızlık ekleyemezsiniz', 'error');
            return;
        }
        
        if (selectedDate < tenDaysAgo) {
            showNotification('En fazla geçmiş 10 güne devamsızlık ekleyebilirsiniz', 'error');
            return;
        }
        
        // Tarih kontrolü: Tatil günlerini engelle
        if (this.isClosedDay(selectedDate, employee)) {
            showNotification('Bu gün tatil günü, devamsızlık ekleyemezsiniz', 'error');
            return;
        }
        
        // Aynı güne tekrar devamsızlık verilmemesini engelle
        const selectedDateStr = toLocalDateStr(selectedDate);
        if (employee.absenceHistory && employee.absenceHistory.some(absence => toLocalDateStr(parseLocalDate(absence.date)) === selectedDateStr)) {
            showNotification('Bu güne zaten devamsızlık kaydedilmiş', 'error');
            return;
        }
        
        // İş durdurulan günlere devamsızlık verilmemesini engelle
        const dailyLogs = this.calculateDailyLogs(employee);
        const isWorkStoppedOnDay = dailyLogs.some(log => log.date === selectedDateStr && log.isStopped);
        
        if (isWorkStoppedOnDay) {
            showNotification('İş durdurulan güne devamsızlık ekleyemezsiniz', 'error');
            return;
        }
        
        const isToday = selectedDate.getTime() === today.getTime();
        const isPast = selectedDate < today;
        
        const deduction = this.calculateDailyWage(employee);
        
        // Devamsızlık geçmişine ekle
        if (!employee.absenceHistory) {
            employee.absenceHistory = [];
        }
        
        // Devamsızlık geçmişine ekle
        // Not: calculateCurrentDebt zaten devamsızlık günlerinde borç artışını engelliyor
        // absenceEntry.deduction sadece görünüm/geçmiş için tutulur
        const absenceEntry = {
            date: selectedDateStr,
            timestamp: Date.now()
        };
        
        if (isPast) {
            absenceEntry.deduction = deduction;
            showNotification(`Geçmiş devamsızlık kaydedildi. Kesinti: ${deduction.toFixed(2)} TL`, 'success');
        } else if (isToday) {
            absenceEntry.deduction = 0;
            showNotification(`Bugün için devamsızlık kaydedildi. Para eklenmeyecek`, 'success');
        }
        
        employee.absenceHistory.push(absenceEntry);
        
        this.saveData();
        closeModal('absenceModal');
        
        this.renderEmployeesPage();
        this.renderHomePage();
        
        // Günlük detaylar modalı açıksa ve aynı çalışanı gösteriyorsa, yenile
        const dailyDetailsModal = document.getElementById('dailyDetailsModal');
        if (dailyDetailsModal && !dailyDetailsModal.classList.contains('hidden')) {
            openDailyDetails(employeeId);
        }
    }

    // Ödeme ekle
    addPayment() {
        const employeeId = parseInt(document.getElementById('paymentEmployeeId').value);
        const amount = parseTurkishNumber(document.getElementById('paymentAmount').value);
        
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
            date: toLocalDateStr(new Date()),
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
            // Aylık maaş / 26 gün (günlük loglarda ve devamsızlık hesabında geçici kullanılır)
            const workingDaysPerMonth = Math.round(workingDaysPerWeek * 4);
            return workingDaysPerMonth > 0 ? employee.salaryAmount / workingDaysPerMonth : employee.salaryAmount / 26;
        }
    }
    
    // Aylık maaşlı çalışan için ödeme gününü hesapla (ayın son günü sınırı)
    getMonthlyPaymentDay(employee) {
        const startDate = new Date(employee.startDate);
        return startDate.getDate();
    }
    
    // Belirli ay/yıl için ödeme tarihini hesapla (gün yoksa ayın son günü)
    getMonthlyPaymentDate(year, month, employee) {
        const paymentDay = this.getMonthlyPaymentDay(employee);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const day = Math.min(paymentDay, daysInMonth);
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    
    // İki tarih arasındaki aylık ödeme tarihlerini listele
    calculateMonthlyPaymentDates(startDate, endDate, employee) {
        const dates = [];
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        
        // İlk ödeme tarihi: başlangıç ayının ödeme gününden SONRAKI ilk ödeme günü
        let current = this.getMonthlyPaymentDate(start.getFullYear(), start.getMonth(), employee);
        
        // Başlangıç günü ödeme gününden önce veya aynı günse, ilk ödeme bir sonraki ayın ödeme günüdür
        // Çünkü çalışan tam ay çalışmadan o gün ödeme alamaz
        if (start <= current) {
            current = this.getMonthlyPaymentDate(start.getFullYear(), start.getMonth() + 1, employee);
        }
        
        while (current <= end) {
            dates.push(new Date(current));
            current = this.getMonthlyPaymentDate(current.getFullYear(), current.getMonth() + 1, employee);
        }
        
        return dates;
    }
    
    // Bugün aylık ödeme günü mü?
    isMonthlyPaymentDayToday(employee) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const paymentDate = this.getMonthlyPaymentDate(today.getFullYear(), today.getMonth(), employee);
        return today.getTime() === paymentDate.getTime();
    }
    
    // Aylık maaşlı çalışan için borç hesapla
    // Her dönem için gerçek gün sayısına göre günlük ücret hesaplanır
    // Kapalı günler ve devamsızlıklar düşülür
    calculateMonthlyDebt(employee, endDate) {
        const startDate = new Date(employee.startDate);
        startDate.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (startDate > end) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentHour = new Date().getHours();
        const isEndDateToday = end.getTime() === today.getTime();

        const toLocalStr = (d) => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');

        const paymentDates = this.calculateMonthlyPaymentDates(startDate, end, employee);

        let totalDebt = 0;
        let periodStart = new Date(startDate);
        let skipPartial = false;

        // Her tam ödeme dönemi için: günlük ücret × çalışılan gün sayısı
        paymentDates.forEach(paymentDate => {
            // Eğer son tarih bugünse ve bu ödeme günü bugünse, saat 18'den önce ekleme
            if (isEndDateToday && paymentDate.getTime() === today.getTime() && currentHour < 18) {
                // Bugünün ödemesi 18:00'den önce henüz yapılmadı; kısmi dönem de eklenmesin
                periodStart = new Date(paymentDate);
                skipPartial = true;
                return;
            }

            // Dönem gün sayısı (periodStart'dan paymentDate'e kadar, paymentDate hariç)
            const totalDaysInPeriod = Math.round((paymentDate - periodStart) / (1000 * 60 * 60 * 24));

            if (totalDaysInPeriod > 0) {
                // Kapalı gün ve devamsızlık sayısını hesapla
                let workingDays = 0;
                const currentDate = new Date(periodStart);
                while (currentDate < paymentDate) {
                    const dateStr = toLocalStr(currentDate);
                    const isClosed = this.isClosedDay(currentDate, employee);
                    const isAbsent = employee.absenceHistory && employee.absenceHistory.some(absence => toLocalDateStr(parseLocalDate(absence.date)) === dateStr);

                    if (!isClosed && !isAbsent) {
                        workingDays++;
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                // Günlük ücret = Aylık maaş / dönem gün sayısı
                const dailyRate = Number(employee.salaryAmount) / totalDaysInPeriod;
                totalDebt += dailyRate * workingDays;
            }

            // Sonraki dönem için başlangıç
            periodStart = new Date(paymentDate);
        });

        // Son ödeme tarihinden endDate'e kadar olan kısmi dönem
        if (!skipPartial && periodStart < end) {
            let partialEnd = new Date(end);
            // Eğer bugünse ve 18'den önceyse, bugünü sayma
            if (isEndDateToday && currentHour < 18) {
                partialEnd = new Date(today);
                partialEnd.setDate(partialEnd.getDate() - 1);
            }

            if (periodStart <= partialEnd) {
                // Bu dönemin tam gün sayısını hesapla (bir sonraki ödeme tarihine kadar)
                const nextPaymentDate = this.getMonthlyPaymentDate(periodStart.getFullYear(), periodStart.getMonth() + 1, employee);
                const fullPeriodDays = Math.round((nextPaymentDate - periodStart) / (1000 * 60 * 60 * 24));

                if (fullPeriodDays > 0) {
                    let workingDays = 0;
                    const currentDate = new Date(periodStart);
                    while (currentDate <= partialEnd) {
                        const dateStr = toLocalStr(currentDate);
                        const isClosed = this.isClosedDay(currentDate, employee);
                        const isAbsent = employee.absenceHistory && employee.absenceHistory.some(absence => toLocalDateStr(parseLocalDate(absence.date)) === dateStr);

                        if (!isClosed && !isAbsent) {
                            workingDays++;
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                    }

                    const dailyRate = Number(employee.salaryAmount) / fullPeriodDays;
                    totalDebt += dailyRate * workingDays;
                }
            }
        }

        // Ödemeleri çıkar
        if (employee.paymentHistory && employee.paymentHistory.length > 0) {
            employee.paymentHistory.forEach(payment => {
                const paymentDate = parseLocalDate(payment.date);
                if (!isNaN(paymentDate.getTime()) && paymentDate <= end) {
                    totalDebt -= Math.abs(Number(payment.amount) || 0);
                }
            });
        }

        return totalDebt;
    }
    
    // Günün kapalı olup olmadığını kontrol et
    isClosedDay(date, employee) {
        const closedDays = employee.closedDays || [];
        // UTC/yerel saat farkından etkilenmemesi için yerel tarih string'i üzerinden gün hesapla
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayOfWeek = localDate.getDay();
        return closedDays.includes(dayOfWeek);
    }
    
    // Bugünün kazanç bilgisini al (küçük kutucuk formatında)
    getTodayEarningSmallInfo(employee) {
        if (!employee.startDate) return '';
        
        const today = new Date();
        const currentHour = today.getHours();
        const startDate = new Date(employee.startDate);
        startDate.setHours(0, 0, 0, 0);
        const todayDate = new Date(today);
        todayDate.setHours(0, 0, 0, 0);
        
        // Bugün işe başlama tarihinden önceyse
        if (startDate > todayDate) return '';
        
        // Aylık maaşlı çalışanlar için ödeme günü bazlı gösterim
        if (employee.salaryType === 'monthly') {
            const paymentDate = this.getMonthlyPaymentDate(today.getFullYear(), today.getMonth(), employee);
            const isPaymentDay = todayDate.getTime() === paymentDate.getTime();
            const paymentDateStr = paymentDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
            const formattedSalary = Number(employee.salaryAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            if (isPaymentDay && currentHour >= 18) {
                return `
                    <div class="bg-emerald-500/10 border border-emerald-500/10 px-3 py-1.5 rounded-lg text-xs">
                        <span class="text-emerald-400">Aylık Ödeme: </span>
                        <span class="text-emerald-300 font-bold">+${formattedSalary} TL</span>
                    </div>
                `;
            }
            return `
                <div class="bg-orange-500/10 border border-orange-500/10 px-3 py-1.5 rounded-lg text-xs">
                    <span class="text-orange-400">Aylık Ödeme: </span>
                    <span class="text-orange-300 font-bold">${formattedSalary} TL — ${paymentDateStr}</span>
                </div>
            `;
        }
        
        const dailyWage = this.calculateDailyWage(employee);
        
        // Bugün kapalı gün ise
        if (this.isClosedDay(today, employee)) {
            return `
                <div class="bg-indigo-500/10 border border-indigo-500/10 px-3 py-1.5 rounded-lg text-xs">
                    <span class="text-indigo-400">Durum: </span>
                    <span class="text-indigo-300 font-bold">Kapalı Gün</span>
                </div>
            `;
        }
        
        // Saat 18:00'den önce bekleniyor
        if (currentHour < 18) {
            return `
                <div class="bg-orange-500/10 border border-orange-500/10 px-3 py-1.5 rounded-lg text-xs">
                    <span class="text-orange-400">Kazanç: </span>
                    <span class="text-orange-300 font-bold">${dailyWage.toFixed(2)} TL</span>
                </div>
            `;
        }
        
        // Saat 18:00'den sonra eklendi
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
        if (this.isClosedDay(today, employee)) {
            return `
                <div class="bg-indigo-500/10 backdrop-blur-md border border-indigo-500/20 p-4 rounded-xl flex justify-between items-center">
                    <span class="text-indigo-400 text-sm font-medium">Bugünün Durumu</span>
                    <span class="text-indigo-300 font-bold text-lg">Kapalı Gün</span>
                </div>
            `;
        }
        
        // Aylık maaşlı çalışanlar için ödeme günü bazlı gösterim
        if (employee.salaryType === 'monthly') {
            const paymentDate = this.getMonthlyPaymentDate(today.getFullYear(), today.getMonth(), employee);
            const isPaymentDay = todayDate.getTime() === paymentDate.getTime();
            const paymentDateStr = paymentDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
            const formattedSalary = Number(employee.salaryAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            if (isPaymentDay && currentHour >= 18) {
                return `
                    <div class="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 p-4 rounded-xl flex justify-between items-center hover:bg-emerald-500/20 transition-all">
                        <span class="text-emerald-400 text-sm font-medium">Aylık Ödeme Eklendi</span>
                        <span class="text-emerald-300 font-bold text-lg">+${formattedSalary} TL</span>
                    </div>
                `;
            }
            return `
                <div class="bg-orange-500/10 backdrop-blur-md border border-orange-500/20 p-4 rounded-xl flex justify-between items-center">
                    <span class="text-orange-400 text-sm font-medium">Aylık Ödeme Bekleniyor</span>
                    <span class="text-orange-300 font-bold text-lg">${formattedSalary} TL — ${paymentDateStr}</span>
                </div>
            `;
        }
        
        const dailyWage = this.calculateDailyWage(employee);
        
        // Saat 08:00'den önceyse kazanç henüz beklenmiyor
        if (currentHour < 8) {
            return `
                <div class="bg-orange-500/10 backdrop-blur-md border border-orange-500/20 p-4 rounded-xl flex justify-between items-center">
                    <span class="text-orange-400 text-sm font-medium">Bugünün Kazancı</span>
                    <span class="text-orange-300 font-bold text-lg">${dailyWage.toFixed(2)} TL Eklenecek</span>
                </div>
            `;
        }
        
        // Saat 08:00 - 18:00 arası
        if (currentHour >= 8 && currentHour < 18) {
            return `
                <div class="bg-orange-500/10 backdrop-blur-md border border-orange-500/20 p-4 rounded-xl flex justify-between items-center">
                    <span class="text-orange-400 text-sm font-medium">Bugünün Kazancı</span>
                    <span class="text-orange-300 font-bold text-lg">${dailyWage.toFixed(2)} TL Eklenecek</span>
                </div>
            `;
        }
        
        // Saat 18:00'den sonra
        return `
            <div class="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 p-4 rounded-xl flex justify-between items-center hover:bg-emerald-500/20 transition-all">
                <span class="text-emerald-400 text-sm font-medium">Bugünün Kazancı</span>
                <span class="text-emerald-300 font-bold text-lg">+${dailyWage.toFixed(2)} TL Eklendi</span>
            </div>
        `;
    }
    
    // Mevcut borcu hesapla (günlük bazda)
    calculateCurrentDebt(employee) {
        console.log('calculateCurrentDebt çağrıldı, çalışan:', employee.name);
        
        if (!employee.startDate) return 0;
        
        // İş durdurulmuşsa borç artışı durdur - workStopDate'e kadar hesapla
        if (employee.isStopped) {
            const stopDate = employee.workStopDate ? new Date(employee.workStopDate) : new Date();
            stopDate.setHours(0, 0, 0, 0);
            
            // Aylık maaşlı çalışanlar için özel hesaplama
            if (employee.salaryType === 'monthly') {
                return this.calculateMonthlyDebt(employee, stopDate);
            }
            
            const dailyWage = this.calculateDailyWage(employee);
            let totalDebt = 0;
            const toLocalStr = (d) => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
            
            const startDate = new Date(employee.startDate);
            startDate.setHours(0, 0, 0, 0);
            
            const currentDate = new Date(startDate);
            while (currentDate < stopDate) {
                if (!this.isClosedDay(currentDate, employee)) {
                    const currentDateStr = toLocalStr(currentDate);
                    const isAbsentDay = employee.absenceHistory && employee.absenceHistory.some(absence => absence.date === currentDateStr);
                    if (!isAbsentDay) {
                        totalDebt += dailyWage;
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // Ödemeleri çıkar
            if (employee.paymentHistory && employee.paymentHistory.length > 0) {
                employee.paymentHistory.forEach(payment => {
                    totalDebt -= Math.abs(Number(payment.amount) || 0);
                });
            }
            
            return totalDebt;
        }
        
        // İşten çıkarılmış çalışanlar için borç artışı durdur
        if (employee.status === 'inactive') {
            // Sabit borcu hesapla (ayrılma tarihine kadar)
            const departureDate = employee.departureDate ? new Date(employee.departureDate) : new Date();
            
            // Aylık maaşlı çalışanlar için özel hesaplama
            if (employee.salaryType === 'monthly') {
                return this.calculateMonthlyDebt(employee, departureDate);
            }
            
            const startDate = new Date(employee.startDate);
            const dailyWage = this.calculateDailyWage(employee);
            let totalDebt = 0;
            
            startDate.setHours(0, 0, 0, 0);
            departureDate.setHours(0, 0, 0, 0);
            
            // Başlangıç tarihinden ayrılma tarihine kadar her günü döngüye al (ayrılma günü dahil değil)
            const toLocalStr2 = (d) => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
            const currentDate = new Date(startDate);
            while (currentDate < departureDate) {
                if (!this.isClosedDay(currentDate, employee)) {
                    const currentDateStr = toLocalStr2(currentDate);
                    const isAbsentDay = employee.absenceHistory && employee.absenceHistory.some(absence => absence.date === currentDateStr);
                    
                    // Devamsızlık gününde borç eklenmez; normal gün için borç ekle
                    if (!isAbsentDay) {
                        totalDebt += dailyWage;
                    }
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
            
            // Devamsızlık kesintilerini EKLEME - zaten devamsızlık günlerinde borç eklenmedi
            
            console.log('İşten çıkarılmış borç:', totalDebt);
            return totalDebt;
        }
        
        const toLocalDateStr = (d) => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');

        const startDate = new Date(employee.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        
        // Başlangıç tarihi bugünden sonra ise borç yok
        if (startDate > today) return 0;
        
        // Aylık maaşlı çalışanlar için özel hesaplama
        if (employee.salaryType === 'monthly') {
            const currentHour = new Date().getHours();
            const todayPaymentDate = this.getMonthlyPaymentDate(today.getFullYear(), today.getMonth(), employee);
            let effectiveEnd = todayPaymentDate;
            // Ödeme günü henüz 18:00'e gelmediyse (veya bugün ödeme gününden önceyse)
            // sadece önceki ödeme gününe kadar olan tam dönemleri hesapla
            if (today < todayPaymentDate || (today.getTime() === todayPaymentDate.getTime() && currentHour < 18)) {
                const prevYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
                const prevMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
                effectiveEnd = this.getMonthlyPaymentDate(prevYear, prevMonth, employee);
            }
            return this.calculateMonthlyDebt(employee, effectiveEnd);
        }
        
        const currentHour = new Date().getHours();
        const dailyWage = this.calculateDailyWage(employee);
        let totalDebt = 0;
        
        // Başlangıç tarihinden bugüne kadar her günü döngüye al
        const currentDate = new Date(startDate);
        while (currentDate <= today) {
            const isToday = currentDate.getTime() === today.getTime();
            const currentDateStr = toLocalDateStr(currentDate);
            
            // Gün kapalı değilse
            if (!this.isClosedDay(currentDate, employee)) {
                // Devamsızlık günü kontrolü
                const isAbsentDay = employee.absenceHistory && employee.absenceHistory.some(absence => absence.date === currentDateStr);
                
                // Devamsızlık gününde borç eklenmez; normal günler için ekle
                if (!isAbsentDay) {
                    // Bugün için saat kontrolü: 18:00'den önce ise dahil etme
                    if (isToday) {
                        if (currentHour >= 18) {
                            totalDebt += dailyWage;
                        }
                        // 00:00-06:00 ve 06:00-18:00 arası: borç ekleme (Bekleniyor/Gece Kapalı)
                    } else {
                        // Geçmiş günler için doğrudan ekle
                        totalDebt += dailyWage;
                    }
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
        
        // Devamsızlık kesintilerini EKLEME - zaten devamsızlık günlerinde borç eklenmedi
        
        console.log('Aktif borç:', totalDebt);
        return totalDebt;
    }

    // Belirli bir tarihe kadar olan borcu hesapla
    calculateDebtUpToDate(employee, upToDateStr) {
        if (!employee.startDate) return 0;
        
        const startDate = new Date(employee.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const upToDate = new Date(upToDateStr + 'T00:00:00');
        let endDate = new Date(upToDate);
        
        // İş durdurulmuşsa ve seçilen tarih durdurma tarihinden sonraysa, durdurma tarihine kadar hesapla
        if (employee.isStopped && employee.workStopDate) {
            const workStopDate = new Date(employee.workStopDate);
            workStopDate.setHours(0, 0, 0, 0);
            if (upToDate > workStopDate) {
                endDate = workStopDate;
            }
        }
        
        // İşten çıkarılmışsa ve seçilen tarih ayrılma tarihinden sonraysa, ayrılma tarihine kadar hesapla
        if (employee.status === 'inactive' && employee.departureDate) {
            const departureDate = new Date(employee.departureDate);
            departureDate.setHours(0, 0, 0, 0);
            if (upToDate >= departureDate) {
                endDate = new Date(departureDate);
                endDate.setDate(endDate.getDate() - 1);
            }
        }
        
        if (startDate > endDate) return 0;
        
        // Aylık maaşlı çalışanlar için özel hesaplama
        if (employee.salaryType === 'monthly') {
            return this.calculateMonthlyDebt(employee, endDate);
        }
        
        const dailyWage = this.calculateDailyWage(employee);
        let totalDebt = 0;
        
        const currentDate = new Date(startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentHour = new Date().getHours();
        
        while (currentDate <= endDate) {
            const currentDateStr = toLocalDateStr(currentDate);
            const isToday = currentDate.getTime() === today.getTime();
            
            if (!this.isClosedDay(currentDate, employee)) {
                const isAbsentDay = employee.absenceHistory && employee.absenceHistory.some(absence => absence.date === currentDateStr);
                
                if (!isAbsentDay) {
                    if (isToday) {
                        if (currentHour >= 18) {
                            totalDebt += dailyWage;
                        }
                    } else {
                        totalDebt += dailyWage;
                    }
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Seçilen tarihe kadar yapılan ödemeleri çıkar
        if (employee.paymentHistory && employee.paymentHistory.length > 0) {
            employee.paymentHistory.forEach(payment => {
                const paymentDate = new Date(payment.date);
                paymentDate.setHours(0, 0, 0, 0);
                if (paymentDate <= endDate) {
                    totalDebt -= Math.abs(Number(payment.amount) || 0);
                }
            });
        }
        
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
        
        const paymentAmount = parseTurkishNumber(document.getElementById('paymentAmount').value);
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
function openAbsenceModal(employeeId) {
    const employee = luxwage.findEmployeeById(employeeId);
    if (!employee) return;
    
    document.getElementById('absenceEmployeeId').value = employee.id;
    document.getElementById('absenceEmployeeName').value = employee.name;
    document.getElementById('absenceDate').value = '';
    document.getElementById('absenceDeduction').textContent = '0 TL';
    document.getElementById('wageCalculation').textContent = 'Yevmiye hesaplanıyor...';
    
    // Tarih seçimini kısıtla: bugün ve geçmiş 10 gün, işe başlamadan önce değil
    const startDate = new Date(employee.startDate);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = toLocalDateStr(today);
    
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);
    
    const minDate = startDate > tenDaysAgo ? startDate : tenDaysAgo;
    const minDateStr = toLocalDateStr(minDate);
    
    const absenceDateInput = document.getElementById('absenceDate');
    absenceDateInput.min = minDateStr;
    absenceDateInput.max = todayStr;
    
    // Tarih değiştiğinde kontrol et
    const submitBtn = document.getElementById('absenceSubmitBtn');
    const warningEl = document.getElementById('absenceDateWarning');
    
    function validateAbsenceDate() {
        const selectedDate = parseLocalDate(absenceDateInput.value);
        const selectedDateStr = toLocalDateStr(selectedDate);
        
        // Varsayılan durumları sıfırla
        absenceDateInput.classList.remove('border-red-500', 'bg-red-50');
        absenceDateInput.classList.add('border-gray-300');
        if (warningEl) warningEl.classList.add('hidden');
        if (submitBtn) submitBtn.disabled = false;
        
        if (!absenceDateInput.value) return false;
        
        // İşe başlamadan önceki tarih kontrolü
        if (selectedDate < startDate) {
            showNotification('İşe başlamadan önceki tarih seçilemez', 'error');
            absenceDateInput.value = '';
            return false;
        }
        
        // En fazla geçmiş 10 gün kontrolü
        if (selectedDate < tenDaysAgo) {
            showNotification('En fazla geçmiş 10 güne devamsızlık ekleyebilirsiniz', 'error');
            absenceDateInput.value = '';
            return false;
        }
        
        // Gelecek tarih kontrolü
        if (selectedDate > today) {
            showNotification('Gelecek tarihe devamsızlık eklenemez', 'error');
            absenceDateInput.value = '';
            return false;
        }
        
        // Tatil günü kontrolü
        if (luxwage.isClosedDay(selectedDate, employee)) {
            showNotification('Bu gün tatil günü, devamsızlık eklenemez', 'error');
            absenceDateInput.value = '';
            return false;
        }
        
        // Aynı güne tekrar devamsızlık kontrolü - kırmızı pasif yap
        if (employee.absenceHistory && employee.absenceHistory.some(absence => toLocalDateStr(parseLocalDate(absence.date)) === selectedDateStr)) {
            absenceDateInput.classList.remove('border-gray-300');
            absenceDateInput.classList.add('border-red-500', 'bg-red-50');
            if (warningEl) warningEl.classList.remove('hidden');
            if (submitBtn) submitBtn.disabled = true;
            return false;
        }
        
        // İş durdurulan gün kontrolü
        const dailyLogs = luxwage.calculateDailyLogs(employee);
        const isWorkStoppedOnDay = dailyLogs.some(log => log.date === selectedDateStr && log.isStopped);
        
        if (isWorkStoppedOnDay) {
            showNotification('İş durdurulan güne devamsızlık eklenemez', 'error');
            absenceDateInput.value = '';
            return false;
        }
        
        return true;
    }
    
    absenceDateInput.onchange = validateAbsenceDate;
    
    openModal('absenceModal');
};

// Ödeme modalını aç
function openPaymentModal(employeeId) {
    const employee = luxwage.findEmployeeById(employeeId);
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
function showHistory(employeeId) {
    const employee = luxwage.findEmployeeById(employeeId);
    if (!employee) return;
    
    document.getElementById('historyEmployeeName').textContent = employee.name;
    
    const historyContent = document.getElementById('historyContent');
    
    // Son 12 ayı hesapla
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    // Ödeme geçmişini filtrele (son 12 ay)
    let recentPayments = [];
    if (employee.paymentHistory && employee.paymentHistory.length > 0) {
        recentPayments = employee.paymentHistory.filter(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate >= twelveMonthsAgo;
        });
    }
    
    // Devamsızlık geçmişini filtrele (son 12 ay)
    let recentAbsences = [];
    if (employee.absenceHistory && employee.absenceHistory.length > 0) {
        recentAbsences = employee.absenceHistory.filter(absence => {
            const absenceDate = new Date(absence.date);
            return absenceDate >= twelveMonthsAgo;
        });
    }
    
    // Varsayılan olarak geçerli yıl ve ay
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Yıl seçeneklerini oluştur (son 3 yıl)
    let yearOptions = '';
    for (let y = currentYear; y >= currentYear - 2; y--) {
        yearOptions += `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`;
    }
    
    // Ay seçeneklerini oluştur
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    let monthOptions = '';
    monthNames.forEach((name, index) => {
        const monthValue = index + 1;
        monthOptions += `<option value="${monthValue}" ${monthValue === currentMonth ? 'selected' : ''}>${name}</option>`;
    });
    
    // Kategori butonları ve içerik oluştur
    let html = `
        <div class="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-2">
                <label class="text-sm text-gray-600 font-medium">Yıl:</label>
                <select id="historyYearSelect" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" onchange="filterHistory('all', ${employee.id})">
                    ${yearOptions}
                </select>
            </div>
            <div class="flex items-center gap-2">
                <label class="text-sm text-gray-600 font-medium">Ay:</label>
                <select id="historyMonthSelect" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" onchange="filterHistory('all', ${employee.id})">
                    ${monthOptions}
                </select>
            </div>
        </div>
        <div class="mb-4 flex flex-nowrap gap-1 overflow-x-auto pb-1 md:gap-2">
            <button onclick="filterHistory('all', ${employee.id})" class="history-filter-btn shrink-0 whitespace-nowrap rounded-lg bg-blue-500 px-2 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-600 md:px-4 md:text-base" data-category="all">
                Tümü
            </button>
            <button onclick="filterHistory('payments', ${employee.id})" class="history-filter-btn shrink-0 whitespace-nowrap rounded-lg bg-gray-200 px-2 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300 md:px-4 md:text-base" data-category="payments">
                Ödemeler
            </button>
            <button onclick="filterHistory('absences', ${employee.id})" class="history-filter-btn shrink-0 whitespace-nowrap rounded-lg bg-gray-200 px-2 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300 md:px-4 md:text-base" data-category="absences">
                Devamsızlıklar
            </button>
            <button onclick="filterHistory('debt', ${employee.id})" class="history-filter-btn shrink-0 whitespace-nowrap rounded-lg bg-gray-200 px-2 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300 md:px-4 md:text-base" data-category="debt">
                Borç
            </button>
        </div>
        <div id="historyContentInner">
            ${generateHistoryContent(employee, recentPayments, recentAbsences, 'all', currentYear, currentMonth)}
        </div>
    `;
    
    historyContent.innerHTML = html;
    
    openModal('historyModal');
}

// Borç bilgisi hesapla
function calculateDebtInfo(employee) {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    let periodStart, periodEnd, periodLabel;
    const dayOfWeek = today.getDay();
    
    if (employee.salaryType === 'weekly' || employee.salaryType === 'daily') {
        // Haftalık ve günlük için: Her Pazar günü bildirim
        // Bu haftanın başlangıcı (Pazartesi)
        const daysSinceSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
        periodStart = new Date(today);
        periodStart.setDate(periodStart.getDate() - daysSinceSunday);
        periodStart.setHours(0, 0, 0, 0);
        
        periodEnd = new Date(today);
        periodEnd.setHours(23, 59, 59, 999);
        
        periodLabel = 'Bu Hafta';
    } else if (employee.salaryType === 'monthly') {
        // Aylık için: İşe başlama tarihine göre her ay aynı gün
        const startDate = new Date(employee.startDate);
        const startDay = startDate.getDate();
        
        periodStart = new Date(today.getFullYear(), today.getMonth(), startDay);
        if (periodStart > today) {
            // Eğer bu ayın start günü henüz gelmediyse, geçen ayın start gününden başla
            periodStart = new Date(today.getFullYear(), today.getMonth() - 1, startDay);
        }
        periodStart.setHours(0, 0, 0, 0);
        
        periodEnd = new Date(today);
        periodEnd.setHours(23, 59, 59, 999);
        
        periodLabel = 'Bu Ay';
    } else {
        periodStart = new Date(today);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(today);
        periodEnd.setHours(23, 59, 59, 999);
        periodLabel = 'Bugün';
    }
    
    // Dönem içindeki borç hesapla
    const dailyWage = luxwage.calculateDailyWage(employee);
    let periodDebt = 0;
    
    const currentDate = new Date(periodStart);
    while (currentDate <= periodEnd) {
        if (!luxwage.isClosedDay(currentDate, employee)) {
            const currentDateStr = toLocalDateStr(currentDate);
            const isAbsentDay = employee.absenceHistory && employee.absenceHistory.some(absence => absence.date === currentDateStr);
            
            if (!isAbsentDay) {
                const isToday = currentDate.getTime() === today.getTime();
                const currentHour = now.getHours();
                
                if (isToday) {
                    if (currentHour >= 18) {
                        periodDebt += dailyWage;
                    }
                } else {
                    periodDebt += dailyWage;
                }
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Toplam ödemeleri hesapla
    let totalPaid = 0;
    if (employee.paymentHistory && employee.paymentHistory.length > 0) {
        employee.paymentHistory.forEach(payment => {
            totalPaid += Math.abs(Number(payment.amount) || 0);
        });
    }
    
    // Toplam devamsızlık kesintisini hesapla
    let totalDeduction = 0;
    if (employee.absenceHistory && employee.absenceHistory.length > 0) {
        employee.absenceHistory.forEach(absence => {
            totalDeduction += Number(absence.deduction) || 0;
        });
    }
    
    // Toplam borcu hesapla
    const totalDebt = luxwage.calculateCurrentDebt(employee);
    
    return {
        totalDebt,
        periodDebt,
        totalPaid,
        totalDeduction,
        periodLabel
    };
}

// Borç bildirimlerini hesapla (geçmiş dönemler için)
function calculateDebtNotifications(employee) {
    const notifications = [];
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    if (!employee.startDate) return notifications;
    
    const startDate = new Date(employee.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const dailyWage = luxwage.calculateDailyWage(employee);
    
    if (employee.salaryType === 'weekly' || employee.salaryType === 'daily') {
        // Haftalık ve günlük için: Her Pazar günü bildirim
        // Son 12 haftayı hesapla
        let currentWeekEnd = new Date(today);
        const dayOfWeek = today.getDay();
        const daysUntilSunday = (7 - dayOfWeek) % 7;
        currentWeekEnd.setDate(currentWeekEnd.getDate() + daysUntilSunday);
        
        for (let i = 0; i < 12; i++) {
            const weekStart = new Date(currentWeekEnd);
            weekStart.setDate(weekStart.getDate() - 6);
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(currentWeekEnd);
            weekEnd.setHours(23, 59, 59, 999);
            
            // Hafta başlangıcı işe başlama tarihinden önceyse atla
            if (weekStart < startDate) {
                currentWeekEnd.setDate(currentWeekEnd.getDate() - 7);
                continue;
            }
            
            // Hafta içindeki borç hesapla
            let periodDebt = 0;
            const currentDate = new Date(weekStart);
            while (currentDate <= weekEnd) {
                if (!luxwage.isClosedDay(currentDate, employee)) {
                    const currentDateStr = toLocalDateStr(currentDate);
                    const isAbsentDay = employee.absenceHistory && employee.absenceHistory.some(absence => absence.date === currentDateStr);
                    
                    // Devamsızlık günü ise borç çıkar
                    if (isAbsentDay) {
                        periodDebt -= dailyWage;
                    } else {
                        const isToday = currentDate.getTime() === today.getTime();
                        const currentHour = now.getHours();
                        
                        if (isToday) {
                            if (currentHour >= 18) {
                                periodDebt += dailyWage;
                            }
                        } else {
                            periodDebt += dailyWage;
                        }
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // O tarihteki toplam borcu hesapla (tahmini)
            const totalDebtAtPeriod = calculateDebtAtDate(employee, weekEnd);
            
            if (periodDebt > 0 || totalDebtAtPeriod > 0) {
                notifications.push({
                    employeeName: employee.name,
                    date: weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
                    isoDate: toLocalDateStr(weekEnd),
                    periodDebt: periodDebt,
                    totalDebt: totalDebtAtPeriod,
                    periodLabel: 'Haftalık'
                });
            }
            
            currentWeekEnd.setDate(currentWeekEnd.getDate() - 7);
        }
    } else if (employee.salaryType === 'monthly') {
        // Aylık için: İşe başlama tarihine göre her ay aynı gün
        const startDay = startDate.getDate();
        
        for (let i = 0; i < 12; i++) {
            const monthStart = new Date(today.getFullYear(), today.getMonth() - i, startDay);
            monthStart.setHours(0, 0, 0, 0);
            
            const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, startDay - 1);
            monthEnd.setHours(23, 59, 59, 999);
            
            // Ay başlangıcı işe başlama tarihinden önceyse atla
            if (monthStart < startDate) {
                continue;
            }
            
            // Ay içindeki borç hesapla
            let periodDebt = 0;
            const currentDate = new Date(monthStart);
            while (currentDate <= monthEnd) {
                if (!luxwage.isClosedDay(currentDate, employee)) {
                    const currentDateStr = toLocalDateStr(currentDate);
                    const isAbsentDay = employee.absenceHistory && employee.absenceHistory.some(absence => absence.date === currentDateStr);
                    
                    // Devamsızlık günü ise borç çıkar
                    if (isAbsentDay) {
                        periodDebt -= dailyWage;
                    } else {
                        const isToday = currentDate.getTime() === today.getTime();
                        const currentHour = now.getHours();
                        
                        if (isToday) {
                            if (currentHour >= 18) {
                                periodDebt += dailyWage;
                            }
                        } else {
                            periodDebt += dailyWage;
                        }
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // O tarihteki toplam borcu hesapla (tahmini)
            const totalDebtAtPeriod = calculateDebtAtDate(employee, monthEnd);
            
            if (periodDebt > 0 || totalDebtAtPeriod > 0) {
                notifications.push({
                    employeeName: employee.name,
                    date: monthEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
                    isoDate: toLocalDateStr(monthEnd),
                    periodDebt: periodDebt,
                    totalDebt: totalDebtAtPeriod,
                    periodLabel: 'Aylık'
                });
            }
        }
    }
    
    return notifications;
}

// Belirli bir tarihteki borcu hesapla
function calculateDebtAtDate(employee, targetDate) {
    const startDate = new Date(employee.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const target = new Date(targetDate);
    target.setHours(23, 59, 59, 999);
    
    if (target < startDate) return 0;
    
    const dailyWage = luxwage.calculateDailyWage(employee);
    let totalDebt = 0;
    
    const currentDate = new Date(startDate);
    while (currentDate <= target) {
        if (!luxwage.isClosedDay(currentDate, employee)) {
            const currentDateStr = toLocalDateStr(currentDate);
            const isAbsentDay = employee.absenceHistory && employee.absenceHistory.some(absence => absence.date === currentDateStr);
            
            // Devamsızlık gününde borç eklenmez; normal gün için borç ekle
            if (!isAbsentDay) {
                totalDebt += dailyWage;
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // O tarihe kadar olan ödemeleri çıkar
    if (employee.paymentHistory && employee.paymentHistory.length > 0) {
        employee.paymentHistory.forEach(payment => {
            const paymentDate = new Date(payment.date);
            if (paymentDate <= target) {
                totalDebt -= Math.abs(Number(payment.amount) || 0);
            }
        });
    }
    
    // Devamsızlık kesintilerini EKLEME - zaten devamsızlık günlerinde borç eklenmedi
    
    return totalDebt;
}

// Geçmiş içeriğini oluştur
function generateHistoryContent(employee, recentPayments, recentAbsences, category, selectedYear, selectedMonth) {
    let html = '';
    
    if (category === 'debt' || category === 'all') {
        // Borç bildirimlerini göster (bildirim kartları formatında)
        let debtNotifications = calculateDebtNotifications(employee);
        
        // Seçili yıl ve aya göre filtrele
        if (selectedYear && selectedMonth) {
            debtNotifications = debtNotifications.filter(notification => {
                if (!notification.isoDate) return false;
                const notificationDate = new Date(notification.isoDate + 'T00:00:00');
                return notificationDate.getFullYear() === selectedYear && notificationDate.getMonth() + 1 === selectedMonth;
            });
        }
        
        if (debtNotifications.length === 0 && category === 'debt') {
            html = '<p class="text-gray-500 text-center">Henüz borç bildirimi yok</p>';
        } else if (debtNotifications.length > 0) {
            html += '<h3 class="font-bold text-gray-800 mb-3">Borç Bildirimleri</h3>';
            
            debtNotifications.forEach(notification => {
                html += `
                    <div class="bg-purple-50 rounded-lg p-4 mb-4 border-l-4 border-purple-500 hover:bg-purple-100 transition-colors">
                        <div class="flex justify-between items-center mb-2">
                            <div>
                                <p class="font-bold text-gray-800">${notification.employeeName}</p>
                                <p class="text-xs text-gray-500">${notification.date}</p>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-red-500">+${notification.periodDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</p>
                                <p class="text-xs text-gray-500">${notification.periodLabel}</p>
                            </div>
                        </div>
                        <div class="bg-white rounded-lg p-3 mt-2">
                            <p class="text-sm text-gray-700">
                                <span class="font-medium">Toplam Borç:</span> 
                                <span class="font-bold text-purple-700">${notification.totalDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</span>
                            </p>
                        </div>
                    </div>
                `;
            });
        }
        
        if (category === 'debt') {
            return html;
        }
    }
    
    if (category === 'all' || category === 'payments') {
        if (recentPayments.length > 0) {
            html += '<h3 class="font-bold text-gray-800 mb-3">Ödeme Geçmişi (Son 12 Ay)</h3>';
            
            // Maaş tipine göre ödemeleri grupla
            const groupedPayments = {};
            
            recentPayments.forEach((payment, index) => {
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
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        }
    }
    
    if (category === 'all' || category === 'absences') {
        if (recentAbsences.length > 0) {
            html += '<h3 class="font-bold text-gray-800 mb-3 mt-6">Devamsızlık Geçmişi (Son 12 Ay)</h3>';
            
            // Tarihe göre sırala (yeniden eskiye)
            const sortedAbsences = [...recentAbsences].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            sortedAbsences.forEach((absence, index) => {
                const deductionText = absence.deduction > 0 
                    ? `Kesinti: ${absence.deduction.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL` 
                    : 'Para eklenmeyecek (bugün)';
                
                html += `
                    <div class="bg-red-50 rounded-lg p-4 mb-4 border-l-4 border-red-500 flex justify-between items-center">
                        <div>
                            <p class="font-semibold text-gray-800 text-sm">Devamsızlık</p>
                            <p class="text-xs text-gray-500">${absence.date}</p>
                        </div>
                        <div class="flex items-center space-x-3">
                            <p class="font-bold text-red-500 text-sm">
                                ${deductionText}
                            </p>
                        </div>
                    </div>
                `;
            });
        }
    }
    
    if (html === '') {
        html = '<p class="text-gray-500 text-center">Seçili dönemde kayıt yok</p>';
    }
    
    return html;
}

// Geçmişi filtrele
function filterHistory(category, employeeId) {
    const employee = luxwage.findEmployeeById(employeeId);
    if (!employee) return;
    
    // Seçili yıl ve ayı al
    const yearSelect = document.getElementById('historyYearSelect');
    const monthSelect = document.getElementById('historyMonthSelect');
    const selectedYear = yearSelect ? parseInt(yearSelect.value) : new Date().getFullYear();
    const selectedMonth = monthSelect ? parseInt(monthSelect.value) : new Date().getMonth() + 1;
    
    // Buton stillerini güncelle
    document.querySelectorAll('.history-filter-btn').forEach(btn => {
        if (btn.getAttribute('data-category') === category) {
            btn.classList.remove('bg-gray-200', 'text-gray-700');
            btn.classList.add('bg-blue-500', 'text-white');
        } else {
            btn.classList.remove('bg-blue-500', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        }
    });
    
    // Ödeme geçmişini filtrele (seçili yıl ve ay)
    let recentPayments = [];
    if (employee.paymentHistory && employee.paymentHistory.length > 0) {
        recentPayments = employee.paymentHistory.filter(payment => {
            const paymentDate = new Date(payment.date + 'T00:00:00');
            return paymentDate.getFullYear() === selectedYear && paymentDate.getMonth() + 1 === selectedMonth;
        });
    }
    
    // Devamsızlık geçmişini filtrele (seçili yıl ve ay)
    let recentAbsences = [];
    if (employee.absenceHistory && employee.absenceHistory.length > 0) {
        recentAbsences = employee.absenceHistory.filter(absence => {
            const absenceDate = new Date(absence.date + 'T00:00:00');
            return absenceDate.getFullYear() === selectedYear && absenceDate.getMonth() + 1 === selectedMonth;
        });
    }
    
    // İçeriği güncelle
    const historyContentInner = document.getElementById('historyContentInner');
    if (historyContentInner) {
        historyContentInner.innerHTML = generateHistoryContent(employee, recentPayments, recentAbsences, category, selectedYear, selectedMonth);
    }
}

// Aylık / yıllık ödeme görünümünü ayarla
function setPaymentPeriodView(view) {
    const monthlyBtn = document.getElementById('paymentMonthlyBtn');
    const yearlyBtn = document.getElementById('paymentYearlyBtn');
    const titleEl = document.getElementById('paymentPeriodTitle');
    const valueEl = document.getElementById('paymentPeriodValue');
    const labelEl = document.getElementById('paymentPeriodLabel');
    
    if (!valueEl) return;
    
    const activeClass = 'bg-blue-600 text-white font-semibold shadow-sm';
    const inactiveClass = 'text-gray-600 hover:text-gray-800 hover:bg-gray-200 font-medium';
    
    if (view === 'yearly') {
        valueEl.textContent = window.yearlyPaymentsAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
        if (labelEl) labelEl.textContent = 'Bu yıl';
        if (titleEl) titleEl.textContent = 'Yıllık Toplam Ödeme';
        if (monthlyBtn) {
            monthlyBtn.className = monthlyBtn.className.replace(activeClass, inactiveClass).replace('bg-blue-600', '').replace('text-white', '');
            monthlyBtn.classList.remove('bg-blue-600', 'text-white', 'shadow-sm');
            monthlyBtn.classList.add('text-gray-600', 'hover:text-gray-800', 'hover:bg-gray-200', 'font-medium');
        }
        if (yearlyBtn) {
            yearlyBtn.classList.remove('text-gray-600', 'hover:text-gray-800', 'hover:bg-gray-200', 'font-medium');
            yearlyBtn.classList.add('bg-blue-600', 'text-white', 'shadow-sm', 'font-semibold');
        }
    } else {
        valueEl.textContent = window.monthlyPaymentsAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
        if (labelEl) labelEl.textContent = 'Bu ay';
        if (titleEl) titleEl.textContent = 'Aylık Toplam Ödeme';
        if (yearlyBtn) {
            yearlyBtn.classList.remove('bg-blue-600', 'text-white', 'shadow-sm', 'font-semibold');
            yearlyBtn.classList.add('text-gray-600', 'hover:text-gray-800', 'hover:bg-gray-200', 'font-medium');
        }
        if (monthlyBtn) {
            monthlyBtn.classList.remove('text-gray-600', 'hover:text-gray-800', 'hover:bg-gray-200', 'font-medium');
            monthlyBtn.classList.add('bg-blue-600', 'text-white', 'shadow-sm', 'font-semibold');
        }
    }
}

// calculateDebtInfo fonksiyonunu window objesine ekle (generateHistoryContent içinde kullanım için)
window.calculateDebtInfo = calculateDebtInfo;
window.setPaymentPeriodView = setPaymentPeriodView;

// Devamsızlığı sil
function deleteAbsence(employeeId, absenceIndex) {
    const employee = luxwage.findEmployeeById(employeeId);
    if (!employee) return;
    
    if (!employee.absenceHistory || employee.absenceHistory.length === 0) return;
    
    // Tarihe göre sıralı olduğu için, orijinal index'i bulmamız gerekiyor
    const sortedAbsences = [...employee.absenceHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    const absenceToDelete = sortedAbsences[absenceIndex];
    
    // Orijinal array'den bul ve sil
    const originalIndex = employee.absenceHistory.findIndex(a => a.date === absenceToDelete.date && a.timestamp === absenceToDelete.timestamp);
    if (originalIndex !== -1) {
        employee.absenceHistory.splice(originalIndex, 1);
        luxwage.saveData();
        showNotification('Devamsızlık silindi', 'success');
        showHistory(employeeId);
    }
}

// Günlük detayları göster
function openDailyDetails(employeeId) {
    window.currentDailyDetailsEmployeeId = employeeId;
    const employee = luxwage.employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    const dailyDetailsList = document.getElementById('dailyDetailsList');
    
    // Günlük hareket dökümünü hesapla ve son 30 günü göster
    const allDailyLogs = luxwage.calculateDailyLogs(employee);
    const dailyLogs = allDailyLogs.slice(0, 30);
    
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
        const daysWorked = allDailyLogs.length;
        
        const formattedStartDate = startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        
        // Çalışan aktif değilse uyarı göster
        let statusInfo = '';
        if (employee.isStopped) {
            statusInfo = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-user-slash text-red-500 mr-2"></i>
                        <span class="text-sm text-red-700 font-medium">Çalışan Aktif Değil - İş Durduruldu</span>
                    </div>
                </div>
            `;
        }
        
        workDurationInfo = statusInfo + `
            <div class="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-2 md:mb-4 md:p-4">
                <div class="flex flex-wrap items-center justify-between gap-1.5 md:gap-2">
                    <div>
                        <p class="text-xs text-blue-700 md:text-sm">
                            <i class="fas fa-calendar-check mr-1 md:mr-2"></i>
                            <strong>İşe Başlama:</strong> ${formattedStartDate}
                        </p>
                        <p class="mt-1 text-xs text-blue-700 md:text-sm">
                            <i class="fas fa-clock mr-1 md:mr-2"></i>
                            <strong>Çalışılan Gün:</strong> ${daysWorked} gün
                        </p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-blue-700 md:text-sm">
                            <i class="fas fa-list mr-1 md:mr-2"></i>
                            <strong>Gösterilen:</strong> Son 30 gün
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (dailyLogs.length === 0) {
        dailyDetailsList.innerHTML = workDurationInfo + '<p class="text-gray-500 text-center py-4">Henüz günlük kayıt yok</p>';
    } else {
        let dailyLogsHTML = workDurationInfo + '<table class="w-full min-w-[530px] md:min-w-0"><thead><tr class="bg-gray-200">';
        dailyLogsHTML += '<th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 md:px-4 md:text-sm">Tarih</th>';
        dailyLogsHTML += '<th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 md:px-4 md:text-sm">Günlük Tutar</th>';
        dailyLogsHTML += '<th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 md:px-4 md:text-sm">Durum</th>';
        dailyLogsHTML += '<th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 md:px-4 md:text-sm">Toplam Borç</th>';
        dailyLogsHTML += '</tr></thead><tbody>';
        
        dailyLogs.forEach(log => {
            const debtUpToDate = luxwage.calculateDebtUpToDate(employee, log.date);
            const formattedDebt = debtUpToDate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const dateObj = new Date(log.date);
            const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            
            let rowClass = '';
            let statusText = '';
            let statusClass = '';
            let deductionText = '';
            
            if (log.isAbsent) {
                rowClass = 'bg-red-50';
                statusText = 'Devamsızlık';
                statusClass = 'text-red-600 font-semibold';
                // Devamsızlık kesinti bilgisini al
                const absence = employee.absenceHistory.find(a => a.date === log.date);
                if (absence && absence.deduction) {
                    deductionText = ` (${absence.deduction.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL kesinti)`;
                }
            } else if (log.isStopped) {
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
                    <td class="px-2 py-2 text-xs text-gray-800 md:px-4 md:py-3 md:text-sm">${formattedDate}</td>
                    <td class="px-2 py-2 text-xs font-medium md:px-4 md:py-3 md:text-sm ${log.amount > 0 ? 'text-gray-800' : 'text-gray-400'}">
                        ${log.amount > 0 ? log.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL' : '-'}
                    </td>
                    <td class="px-2 py-2 text-xs md:px-4 md:py-3 md:text-sm ${statusClass}">${statusText}${deductionText}</td>
                    <td class="px-2 py-2 text-xs font-bold md:px-4 md:py-3 md:text-sm ${debtUpToDate >= 0 ? 'text-purple-700' : 'text-green-600'}">${formattedDebt} TL</td>
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

// Çalışan düzenleme modalını aç
function openEditEmployeeModal(employeeId) {
    const employee = luxwage.employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    document.getElementById('editEmployeeId').value = employee.id;
    document.getElementById('editEmployeeName').value = employee.name || '';
    document.getElementById('editEmployeePhone').value = employee.phone || '';
    
    const preview = document.getElementById('editEmployeePhotoPreview');
    const previewImg = document.getElementById('editEmployeePhotoPreviewImg');
    const placeholder = document.getElementById('editEmployeePhotoPlaceholder');
    const photoInput = document.getElementById('editEmployeePhoto');
    
    if (employee.photo) {
        previewImg.src = employee.photo;
        preview.classList.remove('hidden');
        if (placeholder) placeholder.classList.add('hidden');
    } else {
        preview.classList.add('hidden');
        previewImg.src = '';
        if (placeholder) placeholder.classList.remove('hidden');
    }
    if (photoInput) photoInput.value = '';
    
    const modal = document.getElementById('editEmployeeModal');
    if (modal) modal.classList.remove('hidden');
}

// Çalışan düzenleme modalını kapat
function closeEditEmployeeModal() {
    const modal = document.getElementById('editEmployeeModal');
    if (modal) modal.classList.add('hidden');
    clearEditEmployeePhotoPreview();
}

// Düzenleme fotoğraf önizlemesini temizle
function clearEditEmployeePhotoPreview() {
    const preview = document.getElementById('editEmployeePhotoPreview');
    const previewImg = document.getElementById('editEmployeePhotoPreviewImg');
    const photoInput = document.getElementById('editEmployeePhoto');
    if (preview) preview.classList.add('hidden');
    if (previewImg) previewImg.src = '';
    if (photoInput) photoInput.value = '';
}

// Çalışan düzenlemeyi kaydet
async function saveEditEmployee(e) {
    e.preventDefault();
    
    const employeeId = parseInt(document.getElementById('editEmployeeId').value);
    const employee = luxwage.employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    const name = document.getElementById('editEmployeeName').value.trim();
    const phone = document.getElementById('editEmployeePhone').value.trim();
    const photoInput = document.getElementById('editEmployeePhoto');
    
    if (!name) {
        showNotification('Ad soyad zorunludur', 'error');
        return;
    }
    
    employee.name = name;
    employee.phone = phone || null;
    
    if (photoInput && photoInput.files && photoInput.files[0]) {
        const file = photoInput.files[0];
        if (file.size > 2 * 1024 * 1024) {
            showNotification('Fotoğraf boyutu 2 MB üzerinde olamaz', 'error');
            return;
        }
        try {
            employee.photo = await luxwage.readFileAsBase64(file);
        } catch (err) {
            console.error('Fotoğraf okuma hatası:', err);
            showNotification('Fotoğraf yüklenemedi', 'error');
            return;
        }
    }
    
    luxwage.saveData();
    luxwage.renderEmployeesPage();
    closeEditEmployeeModal();
    showNotification('Çalışan bilgileri güncellendi', 'success');
}

// İşçi sil (global fonksiyon - güvenlik için ID bazlı)
function deleteEmployee(employeeId) {
    if (confirm('Bu çalışanı silmek istediğinize emin misiniz?')) {
        luxwage.deleteEmployee(employeeId);
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

// Firebase Auth State Listener - Dashboard
let luxwageInitialized = false;
onAuthStateChanged(auth, async (user) => {
    const serbestSayfalar = [
        'gizlilik-politikasi.html', 
        'kullanim-sartlari.html', 
        'hakkimizda.html', 
        'iletisim.html', 
        'cerez-politikasi.html'
    ];
    const suAnkiSayfa = window.location.pathname;
    const yasalSayfadaMiyim = serbestSayfalar.some(page => suAnkiSayfa.includes(page));
    if (yasalSayfadaMiyim) return;

    if (user) {
        // Kullanıcı giriş yaptı - dashboard'u başlat veya veriyi yenile
        if (!luxwageInitialized) {
            luxwageInitialized = true;
            await luxwage.init();
        } else {
            // Farklı bir kullanıcı oturumu açtıysa veriyi yeniden çek
            await luxwage.loadData();
            luxwage.renderHomePage();
        }
    } else {
        if (suAnkiSayfa.includes('dashboard.html')) {
            window.location.href = 'index.html';
        }
    }
});

// Kullanıcının oturum tipine göre yeniden doğrulama yap
async function reauthenticateCurrentUser(password) {
    const user = auth.currentUser;
    if (!user) throw new Error('Oturum bulunamadı');
    
    const hasPasswordProvider = user.providerData.some(p => p.providerId === 'password');
    const hasGoogleProvider = user.providerData.some(p => p.providerId === 'google.com');
    
    // Sadece Google provider varsa popup ile dogrula
    if (hasGoogleProvider && !hasPasswordProvider) {
        const provider = new GoogleAuthProvider();
        return await reauthenticateWithPopup(user, provider);
    }
    
    // Sifre provider varsa sifre ile dogrula
    if (hasPasswordProvider) {
        if (!password) throw new Error('Şifre gerekli');
        const credential = EmailAuthProvider.credential(user.email, password);
        return await reauthenticateWithCredential(user, credential);
    }
    
    // Hem Google hem sifre varsa, sifre ile dogrula (kullanici sifre girmisse)
    if (hasGoogleProvider && hasPasswordProvider && password) {
        const credential = EmailAuthProvider.credential(user.email, password);
        return await reauthenticateWithCredential(user, credential);
    }
    
    // Sadece Google varsa ve sifre girilmemisse popup ile
    if (hasGoogleProvider) {
        const provider = new GoogleAuthProvider();
        return await reauthenticateWithPopup(user, provider);
    }
    
    throw new Error('Desteklenmeyen oturum tipi');
}

// Global method'ları window objesine bağla (HTML onclick için)
window.showPage = function(pageName) {
    luxwage.showPage(pageName);
};

window.deletePayment = function(employeeId, recordIndex) {
    luxwage.deletePayment(employeeId, recordIndex);
};

window.filterHistory = function(category, employeeId) {
    filterHistory(category, employeeId);
};

window.openDailyDetails = function(employeeId) {
    openDailyDetails(employeeId);
};

window.openEditEmployeeModal = function(employeeId) {
    openEditEmployeeModal(employeeId);
};

window.closeEditEmployeeModal = function() {
    closeEditEmployeeModal();
};

window.showHistory = function(employeeId) {
    showHistory(employeeId);
};

window.openAbsenceModal = function(employeeId) {
    openAbsenceModal(employeeId);
};

window.openPaymentModal = function(employeeId) {
    openPaymentModal(employeeId);
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

    document.getElementById('studioPageBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        luxwage.showPage('studio');
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
    
    function closePasswordModal() {
        const passwordModal = document.getElementById('changePasswordModal');
        if (passwordModal) passwordModal.classList.add('hidden');
        document.getElementById('modalOldPassword').value = '';
        document.getElementById('modalNewPassword').value = '';
        const errBox = document.getElementById('passwordErrorBox');
        if (errBox) errBox.classList.add('hidden');
        const sent = document.getElementById('resetEmailSent');
        if (sent) sent.classList.add('hidden');
    }

    document.getElementById('closePasswordModalBtn')?.addEventListener('click', closePasswordModal);

    // Hesap silme modalı fonksiyonları
    function openDeleteAccountModal() {
        const modal = document.getElementById('deleteAccountModal');
        if (modal) modal.classList.remove('hidden');
    }
    
    function closeDeleteAccountModal() {
        const modal = document.getElementById('deleteAccountModal');
        if (modal) modal.classList.add('hidden');
        const passwordInput = document.getElementById('deleteAccountPassword');
        if (passwordInput) passwordInput.value = '';
        const confirmCheckbox = document.getElementById('confirmDeleteAccount');
        if (confirmCheckbox) confirmCheckbox.checked = false;
        const errorBox = document.getElementById('deleteAccountErrorBox');
        if (errorBox) errorBox.classList.add('hidden');
    }
    
    async function deleteAccount() {
        const passwordInput = document.getElementById('deleteAccountPassword');
        const confirmCheckbox = document.getElementById('confirmDeleteAccount');
        const errorBox = document.getElementById('deleteAccountErrorBox');
        const errorText = document.getElementById('deleteAccountErrorText');
        const confirmBtn = document.getElementById('confirmDeleteAccountBtn');
        
        const password = passwordInput?.value || '';
        const confirmed = confirmCheckbox?.checked || false;
        
        if (!confirmed) {
            if (errorText) errorText.textContent = 'Hesabınızı silmek için onay kutusunu işaretleyin.';
            if (errorBox) errorBox.classList.remove('hidden');
            return;
        }
        
        const user = auth.currentUser;
        if (!user || !user.email) {
            showNotification('Oturum bilgisi bulunamadı', 'error');
            return;
        }
        
        const hasPasswordProvider = user.providerData.some(p => p.providerId === 'password');
        if (hasPasswordProvider && !password) {
            if (errorText) errorText.textContent = 'Lütfen mevcut şifrenizi girin.';
            if (errorBox) errorBox.classList.remove('hidden');
            return;
        }
        
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Siliniyor...';
        }
        
        try {
            await reauthenticateCurrentUser(password);
            
            // Firestore kullanıcı verilerini sil
            try {
                const userDocRef = doc(db, 'users', user.uid);
                await deleteDoc(userDocRef);
            } catch (firestoreError) {
                console.error('Firestore veri silme hatası:', firestoreError);
            }
            
            // Firebase Authentication hesabını sil
            await deleteUser(user);
            
            showNotification('Hesabınız ve tüm verileriniz silindi', 'success');
            closeDeleteAccountModal();
            
            // Ana sayfaya yönlendir
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            console.error('Hesap silme hatası:', error);
            let message = 'Hesap silinemedi. Lütfen doğrulamanızı kontrol edin.';
            if (error.message === 'Şifre gerekli') {
                message = 'Lütfen mevcut şifrenizi girin.';
            } else if (error.code === 'auth/requires-recent-login') {
                message = 'Güvenlik için yeniden giriş yapmanız gerekiyor.';
            } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'Şifreniz hatalı.';
            } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                message = 'Google doğrulama penceresi kapatıldı.';
            }
            if (errorText) errorText.textContent = message;
            if (errorBox) errorBox.classList.remove('hidden');
        } finally {
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Hesabı Sil';
            }
        }
    }
    
    document.getElementById('closeDeleteAccountModalBtn')?.addEventListener('click', closeDeleteAccountModal);
    document.getElementById('cancelDeleteAccountBtn')?.addEventListener('click', closeDeleteAccountModal);
    document.getElementById('confirmDeleteAccountBtn')?.addEventListener('click', deleteAccount);

    // Şifremi unuttum butonu
    document.getElementById('forgotPasswordBtn')?.addEventListener('click', async function() {
        const user = auth.currentUser;
        if (!user || !user.email) return;
        this.disabled = true;
        this.textContent = 'Gönderiliyor...';
        try {
            await sendPasswordResetEmail(auth, user.email);
            const sent = document.getElementById('resetEmailSent');
            if (sent) sent.classList.remove('hidden');
            this.classList.add('hidden');
        } catch(e) {
            showNotification('E-posta gönderilemedi, lütfen tekrar deneyin', 'error');
            this.disabled = false;
            this.textContent = 'Şifremi unuttum — e-postama sıfırlama linki gönder';
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
    function closeTerminateModal() {
        const modal = document.getElementById('terminateConfirmModal');
        if (modal) modal.classList.add('hidden');
        const inp = document.getElementById('terminatePasswordInput');
        if (inp) inp.value = '';
        const err = document.getElementById('terminatePasswordError');
        if (err) err.classList.add('hidden');
        employeeIdToTerminate = null;
    }

    document.getElementById('closeTerminateConfirmModalBtn')?.addEventListener('click', closeTerminateModal);
    document.getElementById('cancelTerminateConfirmBtn')?.addEventListener('click', closeTerminateModal);

    // Göz ikonu toggle
    document.getElementById('toggleTerminatePassword')?.addEventListener('click', function() {
        const inp = document.getElementById('terminatePasswordInput');
        const icon = document.getElementById('terminatePasswordIcon');
        if (!inp) return;
        if (inp.type === 'password') {
            inp.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            inp.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });

    document.getElementById('confirmTerminateConfirmBtn')?.addEventListener('click', async function() {
        if (employeeIdToTerminate === null) return;

        const inp = document.getElementById('terminatePasswordInput');
        const err = document.getElementById('terminatePasswordError');
        const password = inp ? inp.value.trim() : '';

        const user = auth.currentUser;
        if (!user || !user.email) {
            showNotification('Kullanıcı bilgisi alınamadı', 'error');
            return;
        }
        
        const hasPasswordProvider = user.providerData.some(p => p.providerId === 'password');
        const hasGoogleProvider = user.providerData.some(p => p.providerId === 'google.com');
        
        // Sadece sifre provider'i varsa sifre zorunlu, Google kullanıcısı sifre girmez
        if (hasPasswordProvider && !hasGoogleProvider && !password) {
            if (err) { err.textContent = 'Şifre boş bırakılamaz.'; err.classList.remove('hidden'); }
            return;
        }

        this.disabled = true;
        this.textContent = 'Kontrol ediliyor...';

        try {
            await reauthenticateCurrentUser(password);
            // Doğrulama başarılı
            luxwage.terminateEmployee(employeeIdToTerminate);
            closeTerminateModal();
        } catch (e) {
            console.error('İşten çıkarma doğrulama hatası:', e);
            if (e.message === 'Şifre gerekli') {
                if (err) { err.textContent = 'Şifre boş bırakılamaz.'; err.classList.remove('hidden'); }
            } else {
                if (err) { err.textContent = 'Doğrulama başarısız, lütfen tekrar deneyin.'; err.classList.remove('hidden'); }
            }
            if (inp) inp.value = '';
        } finally {
            this.disabled = false;
            this.textContent = 'İşten Çıkar';
        }
    });
    
    // Delete activity modal
    document.getElementById('cancelDeleteActivityBtn')?.addEventListener('click', function() {
        const modal = document.getElementById('deleteActivityModal');
        if (modal) modal.classList.add('hidden');
    });

    document.getElementById('confirmDeleteActivityBtn')?.addEventListener('click', function() {
        const modal = document.getElementById('deleteActivityModal');
        if (!modal) return;
        const timestamp = modal._pendingTimestamp;
        modal.classList.add('hidden');

        let deleted = false;
        luxwage.employees.forEach(emp => {
            if (emp.paymentHistory) {
                const idx = emp.paymentHistory.findIndex(p => (p.timestamp || 0) === timestamp);
                if (idx !== -1) { emp.paymentHistory.splice(idx, 1); deleted = true; }
            }
            if (emp.absenceHistory) {
                const idx = emp.absenceHistory.findIndex(a => (a.timestamp || 0) === timestamp);
                if (idx !== -1) { emp.absenceHistory.splice(idx, 1); deleted = true; }
            }
            if (emp.activityHistory) {
                const idx = emp.activityHistory.findIndex(a => (a.timestamp || 0) === timestamp);
                if (idx !== -1) { emp.activityHistory.splice(idx, 1); deleted = true; }
            }
            if (emp.startDate && emp.startDate === timestamp) {
                if (!emp.hiddenNotifications) emp.hiddenNotifications = [];
                emp.hiddenNotifications.push(timestamp);
                deleted = true;
            }
        });

        if (deleted) {
            luxwage.saveToFirebase();
            luxwage.renderRecentActivities();
            showNotification('Bildirim silindi', 'success');
        } else {
            showNotification('Bildirim silinemedi', 'error');
        }
    });

    // Work stop modal event listeners
    document.getElementById('cancelWorkStopBtn')?.addEventListener('click', function() {
        luxwage.closeWorkStopModal();
    });
    
    document.getElementById('confirmWorkStopBtn')?.addEventListener('click', function() {
        luxwage.confirmWorkStop();
    });

    document.getElementById('resumeTodayBtn')?.addEventListener('click', function() {
        luxwage.confirmWorkResume(true);
    });

    document.getElementById('resumeTomorrowBtn')?.addEventListener('click', function() {
        luxwage.confirmWorkResume(false);
    });

    document.getElementById('cancelWorkResumeBtn')?.addEventListener('click', function() {
        luxwage.closeWorkResumeModal();
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
        const toggleBtn = e.target.closest('.togglePasswordBtn');
        if (toggleBtn) {
            const targetId = toggleBtn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = toggleBtn.querySelector('i');
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    if (icon) icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    if (icon) icon.className = 'fas fa-eye';
                }
            }
            return;
        }
        
        if (e.target.closest('#openPasswordModalBtn')) {
            const passwordModal = document.getElementById('changePasswordModal');
            if (passwordModal) {
                passwordModal.classList.remove('hidden');
            }
        }
        
        if (e.target.closest('#openDeleteAccountModalBtn')) {
            const deleteAccountModal = document.getElementById('deleteAccountModal');
            if (deleteAccountModal) {
                deleteAccountModal.classList.remove('hidden');
            }
        }
        
        if (e.target.closest('#closePasswordModalBtn')) {
            const passwordModal = document.getElementById('changePasswordModal');
            if (passwordModal) {
                passwordModal.classList.add('hidden');
                document.getElementById('modalOldPassword').value = '';
                document.getElementById('modalNewPassword').value = '';
            }
        }
        
        if (e.target.closest('#cancelPasswordBtn')) {
            const passwordModal = document.getElementById('changePasswordModal');
            if (passwordModal) {
                passwordModal.classList.add('hidden');
                document.getElementById('modalOldPassword').value = '';
                document.getElementById('modalNewPassword').value = '';
            }
        }
        
        if (e.target.closest('#confirmPasswordBtn')) {
            const oldPassword = document.getElementById('modalOldPassword').value;
            const newPassword = document.getElementById('modalNewPassword').value;
            
            const user = auth.currentUser;
            if (!user) return;
            
            const hasPasswordProvider = user.providerData.some(p => p.providerId === 'password');
            const hasGoogleProvider = user.providerData.some(p => p.providerId === 'google.com');
            
            if (!hasPasswordProvider && hasGoogleProvider) {
                showNotification('Google ile giriş yaptınız. Şifre değiştirmek için Google hesabınızı kullanın.', 'error');
                return;
            }
            
            if (!oldPassword || !newPassword) {
                showNotification('Lütfen tüm alanları doldurun', 'error');
                return;
            }
            
            if (newPassword.length < 6) {
                showNotification('Yeni şifre en az 6 karakter olmalıdır', 'error');
                return;
            }
            
            reauthenticateCurrentUser(oldPassword)
                .then(() => {
                    return updatePassword(user, newPassword);
                })
                .then(() => {
                    showNotification('Şifreniz başarıyla güncellendi', 'success');
                    const passwordModal = document.getElementById('changePasswordModal');
                    if (passwordModal) passwordModal.classList.add('hidden');
                    document.getElementById('modalOldPassword').value = '';
                    document.getElementById('modalNewPassword').value = '';
                    const errBox = document.getElementById('passwordErrorBox');
                    if (errBox) errBox.classList.add('hidden');
                })
                .catch((error) => {
                    console.error('Şifre güncelleme hatası:', error);
                    if (error.message === 'Şifre gerekli' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        const errBox = document.getElementById('passwordErrorBox');
                        if (errBox) errBox.classList.remove('hidden');
                        const sent = document.getElementById('resetEmailSent');
                        if (sent) sent.classList.add('hidden');
                    } else {
                        showNotification('Şifre güncellenirken hata oluştu', 'error');
                    }
                });
        }
    });
    
    // Add employee button event listener
    document.addEventListener('click', function(e) {
        if (e.target.closest('#addEmployeeBtn')) {
            openModal('employeeModal');
        }

        // İşlemler dropdown toggle
        const actionsBtn = e.target.closest('.actionsMenuBtn');
        if (actionsBtn) {
            const dropdown = actionsBtn.closest('.relative').querySelector('.actionsDropdown');
            // Diğer tüm dropdownları kapat
            document.querySelectorAll('.actionsDropdown').forEach(d => {
                if (d !== dropdown) d.classList.add('hidden');
            });
            dropdown.classList.toggle('hidden');
            e.stopPropagation();
            return;
        }

        // Dropdown dışına tıklanınca kapat
        if (!e.target.closest('.actionsDropdown') && !e.target.closest('.actionsMenuBtn')) {
            document.querySelectorAll('.actionsDropdown').forEach(d => d.classList.add('hidden'));
        }

        // Dropdown içindeki bir butona tıklanınca dropdown'ı kapat
        if (e.target.closest('.actionsDropdown')) {
            document.querySelectorAll('.actionsDropdown').forEach(d => d.classList.add('hidden'));
        }

        // Employee action buttons with data-id (employee ID)
        const absenceBtn = e.target.closest('.absenceBtn');
        if (absenceBtn) {
            const employeeId = parseInt(absenceBtn.getAttribute('data-id'));
            openAbsenceModal(employeeId);
        }
        
        const paymentBtn = e.target.closest('.paymentBtn');
        if (paymentBtn) {
            const employeeId = parseInt(paymentBtn.getAttribute('data-id'));
            openPaymentModal(employeeId);
        }
        
        const historyBtn = e.target.closest('.historyBtn');
        if (historyBtn) {
            const employeeId = parseInt(historyBtn.getAttribute('data-id'));
            showHistory(employeeId);
        }
        
        const terminateBtnEl = e.target.closest('.terminateBtn');
        if (terminateBtnEl) {
            const employeeId = parseInt(terminateBtnEl.getAttribute('data-id'));
            const employee = luxwage.findEmployeeById(employeeId);
            if (employee) {
                employeeIdToTerminate = employeeId;
                const terminateConfirmMessage = document.getElementById('terminateConfirmMessage');
                if (terminateConfirmMessage) {
                    terminateConfirmMessage.textContent = `${employee.name} adlı çalışanı işten çıkarmak istediğinize emin misiniz?`;
                }
                
                // Google kullanicisi ise sifre alani gizle, popup ile dogrulama yap
                const user = auth.currentUser;
                const isGoogleUser = user && user.providerData.some(p => p.providerId === 'google.com') && !user.providerData.some(p => p.providerId === 'password');
                const passwordField = document.getElementById('terminatePasswordInput')?.parentElement?.parentElement;
                if (passwordField) {
                    if (isGoogleUser) {
                        passwordField.classList.add('hidden');
                    } else {
                        passwordField.classList.remove('hidden');
                    }
                }
                
                const terminateConfirmModal = document.getElementById('terminateConfirmModal');
                if (terminateConfirmModal) {
                    terminateConfirmModal.classList.remove('hidden');
                }
            }
        }
        
        const toggleBtn = e.target.closest('.toggleWorkBtn');
        if (toggleBtn) {
            const employeeId = parseInt(toggleBtn.getAttribute('data-id'));
            luxwage.toggleWorkStatus(employeeId);
        }
        
        const permDeleteBtn = e.target.closest('.permanentlyDeleteBtn');
        if (permDeleteBtn) {
            const employeeId = parseInt(permDeleteBtn.getAttribute('data-id'));
            employeeIdToDelete = employeeId;
            const deleteConfirmModal = document.getElementById('deleteConfirmModal');
            if (deleteConfirmModal) {
                deleteConfirmModal.classList.remove('hidden');
            }
        }
        
        const pastHistoryBtn = e.target.closest('.showPastHistoryBtn');
        if (pastHistoryBtn) {
            const employeeId = parseInt(pastHistoryBtn.getAttribute('data-id'));
            luxwage.showPastEmployeeHistory(employeeId);
        }
        
        const editBtnEl = e.target.closest('.editBtn');
        if (editBtnEl) {
            const employeeId = parseInt(editBtnEl.getAttribute('data-id'));
            openEditEmployeeModal(employeeId);
        }

        const detailsBtnEl = e.target.closest('.detailsBtn');
        if (detailsBtnEl) {
            const employeeId = parseInt(detailsBtnEl.getAttribute('data-id'));
            openDailyDetails(employeeId);
        }

        // Bildirim silme
        const deleteBtn = e.target.closest('.delete-activity-btn');
        if (deleteBtn) {
            const timestamp = parseInt(deleteBtn.getAttribute('data-timestamp'));
            const modal = document.getElementById('deleteActivityModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal._pendingTimestamp = timestamp;
            }
        }
    });
    
    // Bildirime içerik ekle (mobil + desktop)
    window.addMobileNotification = function(title, message, type = 'info') {
        const icons = { info: 'fa-info-circle', success: 'fa-check-circle', warning: 'fa-exclamation-triangle', error: 'fa-times-circle' };
        const colors = { info: 'text-blue-500', success: 'text-green-500', warning: 'text-yellow-500', error: 'text-red-500' };
        const ic = icons[type] || 'fa-info-circle';
        const cl = colors[type] || 'text-blue-500';

        const buildItem = () => {
            const item = document.createElement('div');
            item.className = 'flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors';
            item.innerHTML = `
                <div class="shrink-0 mt-0.5"><i class="fas ${ic} ${cl}"></i></div>
                <div class="min-w-0">
                    <p class="text-xs font-semibold text-gray-800">${title}</p>
                    <p class="text-[11px] text-gray-500 mt-0.5 leading-relaxed">${message}</p>
                </div>`;
            return item;
        };

        ['mobileNotifList', 'desktopNotifList'].forEach(id => {
            const list = document.getElementById(id);
            if (!list) return;
            if (list.querySelector('.fa-bell-slash')) list.innerHTML = '';
            list.prepend(buildItem());
        });

        // Badge güncelle
        ['mobileNotifBadge', 'desktopNotifBadge'].forEach(id => {
            const badge = document.getElementById(id);
            if (!badge) return;
            const listId = id.replace('Badge', 'List');
            const count = document.getElementById(listId)?.querySelectorAll('.border-b').length || 0;
            badge.textContent = count > 9 ? '9+' : count;
            badge.classList.remove('hidden');
        });
    };

    // Mobil bildirim paneli toggle
    document.getElementById('mobileNotifBtn')?.addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('mobileNotifPanel')?.classList.toggle('hidden');
        document.getElementById('desktopNotifPanel')?.classList.add('hidden');
    });
    document.getElementById('mobileNotifClose')?.addEventListener('click', function() {
        document.getElementById('mobileNotifPanel')?.classList.add('hidden');
    });

    // Desktop bildirim paneli toggle
    document.getElementById('desktopNotifBtn')?.addEventListener('click', function(e) {
        e.stopPropagation();
        const panel = document.getElementById('desktopNotifPanel');
        if (panel) {
            const isHidden = panel.classList.contains('hidden');
            panel.classList.toggle('hidden', !isHidden);
            panel.classList.toggle('flex', isHidden);
        }
        document.getElementById('mobileNotifPanel')?.classList.add('hidden');
    });
    document.getElementById('desktopNotifClose')?.addEventListener('click', function() {
        const panel = document.getElementById('desktopNotifPanel');
        panel?.classList.add('hidden');
        panel?.classList.remove('flex');
    });
    document.getElementById('desktopNotifPanel')?.addEventListener('click', function(e) {
        if (e.target !== this) return;
        this.classList.add('hidden');
        this.classList.remove('flex');
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('#mobileNotifBtn') && !e.target.closest('#mobileNotifPanel')) {
            document.getElementById('mobileNotifPanel')?.classList.add('hidden');
        }
        if (!e.target.closest('#desktopNotifBtn') && !e.target.closest('#desktopNotifPanel')) {
            const panel = document.getElementById('desktopNotifPanel');
            panel?.classList.add('hidden');
            panel?.classList.remove('flex');
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
