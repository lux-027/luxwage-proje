/**
 * LuxWage SPA - Çalışan Yönetim Sistemi
 * Modern, modüler ve temiz JavaScript mimarisi
 */

class LuxWageApp {
    constructor() {
        this.employees = [];
        this.currentPage = 'home';
        this.currentEmployee = null;
        this.init();
    }

    /**
     * Uygulamayı başlat
     */
    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateCurrentDate();
        this.cleanupOldData();
        
        // İlk yükleme kontrolü
        if (localStorage.getItem('luxwage-first-visit') !== 'false') {
            this.showLandingPage();
        } else {
            this.showDashboard();
        }
    }

    /**
     * Event listener'ları ayarla
     */
    setupEventListeners() {
        // Form event listeners
        document.getElementById('employeeForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEmployee();
        });

        // Modal dışına tıklayınca kapatma
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    const modalId = modal.id;
                    this.closeModal(modalId);
                }
            });
        });

        // Escape tuşu ile modal kapatma
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * LocalStorage'dan verileri yükle
     */
    loadData() {
        try {
            const employeesData = localStorage.getItem('luxwage-employees');
            if (employeesData) {
                this.employees = JSON.parse(employeesData);
            }
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            this.employees = [];
        }
    }

    /**
     * LocalStorage'a verileri kaydet
     */
    saveData() {
        try {
            localStorage.setItem('luxwage-employees', JSON.stringify(this.employees));
        } catch (error) {
            console.error('Veri kaydetme hatası:', error);
            this.showNotification('error', 'Veriler kaydedilemedi!');
        }
    }

    /**
     * Landing page'i göster
     */
    showLandingPage() {
        document.getElementById('landingPage').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }

    /**
     * Dashboard'u göster
     */
    showDashboard() {
        document.getElementById('landingPage').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        localStorage.setItem('luxwage-first-visit', 'false');
        this.showPage('home');
    }

    /**
     * Sayfa göster
     */
    showPage(pageName) {
        this.currentPage = pageName;
        this.updateNavigation(pageName);
        this.updatePageTitle(pageName);
        
        const pageContent = document.getElementById('pageContent');
        
        switch(pageName) {
            case 'home':
                this.loadHomePage();
                break;
            case 'employees':
                this.loadEmployeesPage();
                break;
            case 'employee-detail':
                this.loadEmployeeDetailPage();
                break;
            default:
                this.loadHomePage();
        }
    }

    /**
     * Navigasyonu güncelle
     */
    updateNavigation(pageName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('bg-blue-800', 'text-white');
            item.classList.add('hover:bg-blue-800');
        });

        const activeLink = document.querySelector(`[onclick*="showPage('${pageName}')"]`);
        if (activeLink) {
            activeLink.classList.add('bg-blue-800', 'text-white');
            activeLink.classList.remove('hover:bg-blue-800');
        }
    }

    /**
     * Sayfa başlığını güncelle
     */
    updatePageTitle(pageName) {
        const titles = {
            'home': 'Ana Sayfa',
            'employees': 'Çalışanlarım',
            'employee-detail': 'Çalışan Detayı'
        };
        document.getElementById('pageTitle').textContent = titles[pageName] || 'LuxWage';
    }

    /**
     * Ana sayfayı yükle
     */
    loadHomePage() {
        const stats = this.calculateStats();
        
        document.getElementById('pageContent').innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="stat-card scale-in">
                    <div class="stat-icon info">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-value">${stats.totalEmployees}</div>
                    <div class="stat-label">Toplam İşçi Adeti</div>
                </div>
                
                <div class="stat-card danger scale-in" style="animation-delay: 0.1s">
                    <div class="stat-icon danger">
                        <i class="fas fa-money-bill-wave"></i>
                    </div>
                    <div class="stat-value">${this.formatCurrency(stats.totalDebt)}</div>
                    <div class="stat-label">Toplam Ödenecek Borç</div>
                </div>
                
                <div class="stat-card warning scale-in" style="animation-delay: 0.2s">
                    <div class="stat-icon warning">
                        <i class="fas fa-calendar-times"></i>
                    </div>
                    <div class="stat-value">${this.formatCurrency(stats.totalDeductions)}</div>
                    <div class="stat-label">Bu Ayki Toplam Kesinti</div>
                </div>
            </div>
            
            <div class="card fade-in">
                <div class="card-header">
                    <h3 class="text-lg font-semibold text-gray-800">
                        <i class="fas fa-chart-line text-emerald-500 mr-2"></i>
                        Hızlı Özet
                    </h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 class="font-medium text-gray-700 mb-3">Son Ödemeler</h4>
                            <div class="space-y-2">
                                ${this.getRecentPayments().slice(0, 3).map(payment => `
                                    <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <span class="text-sm text-gray-600">${payment.employeeName}</span>
                                        <span class="text-sm font-medium text-green-600">+${this.formatCurrency(payment.amount)}</span>
                                    </div>
                                `).join('') || '<p class="text-sm text-gray-500">Henüz ödeme kaydı yok</p>'}
                            </div>
                        </div>
                        
                        <div>
                            <h4 class="font-medium text-gray-700 mb-3">Son Devamsızlıklar</h4>
                            <div class="space-y-2">
                                ${this.getRecentAbsences().slice(0, 3).map(absence => `
                                    <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <span class="text-sm text-gray-600">${absence.employeeName}</span>
                                        <span class="text-sm font-medium text-red-600">-${this.formatCurrency(absence.deduction)}</span>
                                    </div>
                                `).join('') || '<p class="text-sm text-gray-500">Henüz devamsızlık kaydı yok</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Çalışanlar sayfasını yükle
     */
    loadEmployeesPage() {
        document.getElementById('pageContent').innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Çalışanlarım</h2>
                <button onclick="luxwage.openModal('employeeModal')" class="btn btn-primary">
                    <i class="fas fa-user-plus mr-2"></i>
                    Yeni İşçi Ekle
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${this.employees.map(employee => `
                    <div class="employee-card" onclick="luxwage.showEmployeeDetail('${employee.id}')">
                        <div class="employee-avatar">
                            ${this.getInitials(employee.name)}
                        </div>
                        <div class="employee-name">${employee.name}</div>
                        <div class="employee-info">
                            <i class="fas fa-phone mr-1"></i> ${employee.phone}
                        </div>
                        <div class="employee-info">
                            <i class="fas fa-calendar mr-1"></i> ${this.formatDate(employee.startDate)}
                        </div>
                        <div class="employee-info">
                            <i class="fas fa-money-bill-wave mr-1"></i> ${this.formatCurrency(employee.salary)}
                            <span class="badge ${employee.salaryType === 'monthly' ? 'badge-info' : 'badge-warning'} ml-2">
                                ${employee.salaryType === 'monthly' ? 'Aylık' : 'Haftalık'}
                            </span>
                        </div>
                        <div class="employee-debt ${this.getCurrentDebt(employee) > 0 ? 'positive' : 'zero'}">
                            <i class="fas fa-wallet mr-1"></i>
                            ${this.getCurrentDebt(employee) > 0 ? 'Borç: ' : 'Borç Yok'}
                            ${this.formatCurrency(this.getCurrentDebt(employee))}
                        </div>
                    </div>
                `).join('') || '<div class="col-span-full text-center py-12 text-gray-500">Henüz çalışan eklenmemiş</div>'}
            </div>
        `;
    }

    /**
     * Kapalı günlerin isimlerini getir
     */
    getClosedDaysNames(closedDays) {
        const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
        return closedDays.map(day => dayNames[day]).join(', ');
    }

    /**
     * Aylık tahmini kazancı hesapla
     */
    calculateMonthlyEstimate(employee) {
        const dailyWage = this.calculateDailyWage(employee);
        const workingDays = this.calculateWorkingDays(employee);
        
        if (employee.salaryType === 'monthly') {
            // Aylık maaş için direkt maaşı dön
            return employee.salary;
        } else {
            // Haftalık maaş için aylık tahmin
            return dailyWage * workingDays * 4.33; // 52 hafta / 12 ay = 4.33
        }
    }

    /**
     * Çalışanın güncel borcunu hesapla
     */
    getCurrentDebt(employee) {
        const activePeriod = this.createActivePeriod(employee);
        return activePeriod.amount;
    }

    /**
     * Çalışan detayını göster
     */
    showEmployeeDetail(employeeId) {
        const employee = this.employees.find(e => e.id === employeeId);
        if (!employee) {
            this.showNotification('error', 'Çalışan bulunamadı!');
            return;
        }
        
        this.currentEmployee = employee;
        this.showPage('employee-detail');
    }

    /**
     * Çalışan detay sayfasını yükle
     */
    loadEmployeeDetailPage() {
        if (!this.currentEmployee) return;

        const employee = this.currentEmployee;
        const periods = this.getEmployeePeriods(employee.id);
        
        document.getElementById('pageContent').innerHTML = `
            <div class="mb-6">
                <button onclick="luxwage.showPage('employees')" class="btn btn-secondary mb-4">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Çalışanlar Listesine Dön
                </button>
                
                <div class="employee-detail-header">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-3xl font-bold mb-2">${employee.name}</h2>
                            <div class="flex flex-wrap gap-4 text-blue-100">
                                <span><i class="fas fa-phone mr-2"></i>${employee.phone}</span>
                                <span><i class="fas fa-calendar mr-2"></i>İşe Başlama: ${this.formatDate(employee.startDate)}</span>
                                <span><i class="fas fa-money-bill-wave mr-2"></i>${this.formatCurrency(employee.salary)} ${employee.salaryType === 'monthly' ? 'Aylık' : 'Haftalık'}</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold text-white mb-2">
                                ${this.formatCurrency(this.getCurrentDebt(employee))}
                            </div>
                            <div class="text-blue-100">
                                ${this.getCurrentDebt(employee) > 0 ? 'Mevcut Borç' : 'Borç Yok'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div class="lg:col-span-2">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-semibold text-gray-800">
                                <i class="fas fa-history text-blue-500 mr-2"></i>
                                Yevmiye ve Ödeme Geçmişi
                            </h3>
                        </div>
                        <div class="card-body">
                            ${periods.length > 0 ? periods.map(period => `
                                <div class="period-card" onclick="luxwage.showPeriodDetail('${period.id}')">
                                    <div class="period-card-header">
                                        <div class="period-card-title">
                                            ${period.type === 'payment' ? 'Ödeme Dönemi' : 'Aktif Dönem'}
                                        </div>
                                        <div class="period-card-amount">
                                            ${period.type === 'payment' ? '+' : '-'}${this.formatCurrency(period.amount)}
                                        </div>
                                    </div>
                                    <div class="period-card-details">
                                        <div class="flex justify-between text-sm">
                                            <span>${this.formatDate(period.startDate)} - ${this.formatDate(period.endDate)}</span>
                                            <span>${period.workingDays} çalışma günü</span>
                                        </div>
                                        ${period.absences.length > 0 ? `
                                            <div class="mt-2 text-sm text-red-600">
                                                <i class="fas fa-calendar-times mr-1"></i>
                                                ${period.absences.length} gün devamsızlık (${this.formatCurrency(period.totalDeduction)} kesinti)
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('') : '<p class="text-gray-500 text-center py-8">Henüz dönem kaydı yok</p>'}
                        </div>
                    </div>
                </div>
                
                <div>
                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-semibold text-gray-800">
                                <i class="fas fa-tools text-emerald-500 mr-2"></i>
                                İşlemler
                            </h3>
                        </div>
                        <div class="card-body space-y-3">
                            <button onclick="luxwage.openAbsenceModal('${employee.id}')" class="btn btn-danger w-full">
                                <i class="fas fa-calendar-times mr-2"></i>
                                Devamsızlık Ekle
                            </button>
                            <button onclick="luxwage.openPaymentModal('${employee.id}')" class="btn btn-primary w-full">
                                <i class="fas fa-money-check-alt mr-2"></i>
                                Ödeme Yap
                            </button>
                        </div>
                    </div>
                    
                    <div class="card mt-4">
                        <div class="card-header">
                            <h3 class="text-lg font-semibold text-gray-800">
                                <i class="fas fa-calculator text-blue-500 mr-2"></i>
                                Yevmiye ve İstatistikler
                            </h3>
                        </div>
                        <div class="card-body">
                            <div class="space-y-3 text-sm">
                                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span class="text-gray-600"><i class="fas fa-briefcase mr-2"></i>Maaş Tipi:</span>
                                    <span class="font-medium">${employee.salaryType === 'monthly' ? 'Aylık' : 'Haftalık'}</span>
                                </div>
                                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span class="text-gray-600"><i class="fas fa-money-bill-wave mr-2"></i>Brüt Maaş:</span>
                                    <span class="font-medium text-green-600">${this.formatCurrency(employee.salary)}</span>
                                </div>
                                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span class="text-gray-600"><i class="fas fa-door-closed mr-2"></i>Kapalı Günler:</span>
                                    <span class="font-medium">${employee.closedDays.length} gün (${this.getClosedDaysNames(employee.closedDays)})</span>
                                </div>
                                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span class="text-gray-600"><i class="fas fa-calendar-check mr-2"></i>Haftalık Çalışma:</span>
                                    <span class="font-medium">${this.calculateWorkingDays(employee)} gün</span>
                                </div>
                                <div class="flex justify-between items-center p-2 bg-emerald-50 rounded border border-emerald-200">
                                    <span class="text-gray-700 font-medium"><i class="fas fa-coins mr-2"></i>Günlük Yevmiye:</span>
                                    <span class="font-bold text-emerald-600 text-lg">${this.formatCurrency(this.calculateDailyWage(employee))}</span>
                                </div>
                                <div class="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200">
                                    <span class="text-gray-700 font-medium"><i class="fas fa-chart-line mr-2"></i>Aylık Tahmin:</span>
                                    <span class="font-bold text-blue-600">${this.formatCurrency(this.calculateMonthlyEstimate(employee))}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Çalışan detayını göster
     */
    showEmployeeDetail(employeeId) {
        const employee = this.employees.find(e => e.id === employeeId);
        if (!employee) return;
        
        this.currentEmployee = employee;
        this.showPage('employee-detail');
    }

    /**
     * Yeni çalışan ekle
     */
    addEmployee() {
        const formData = this.getEmployeeFormData();
        
        if (!this.validateEmployeeForm(formData)) {
            return;
        }

        const employee = {
            id: this.generateId(),
            ...formData,
            debt: 0, // Yeni çalışan için başlangıçta borç yok
            createdAt: new Date().toISOString(),
            history: [],
            periods: []
        };

        this.employees.push(employee);
        this.saveData();
        
        this.closeModal('employeeModal');
        this.showPage('employees');
        this.showNotification('success', `${employee.name} başarıyla eklendi`);
    }

    /**
     * Çalışan form verilerini al
     */
    getEmployeeFormData() {
        const closedDays = Array.from(document.querySelectorAll('input[name="closedDays"]:checked'))
            .map(cb => parseInt(cb.value));

        return {
            name: document.getElementById('employeeName').value.trim(),
            phone: document.getElementById('employeePhone').value.trim(),
            startDate: document.getElementById('startDate').value,
            salaryType: document.getElementById('salaryType').value,
            salary: parseFloat(document.getElementById('salaryAmount').value),
            closedDays: closedDays
        };
    }

    /**
     * Çalışan formunu doğrula
     */
    validateEmployeeForm(data) {
        if (!data.name || !data.phone || !data.startDate || !data.salaryType || !data.salary) {
            this.showNotification('error', 'Lütfen tüm alanları doldurun');
            return false;
        }

        if (data.closedDays.length === 0) {
            this.showNotification('error', 'Lütfen en az bir kapalı gün seçin');
            return false;
        }

        return true;
    }

    /**
     * Gerçek yevmiyeyi hesapla (çoklu kapalı günler dikkate alınarak)
     */
    calculateDailyWage(employee) {
        const workingDays = this.calculateWorkingDays(employee);
        return employee.salary / workingDays;
    }

    /**
     * Çalışma gün sayısını hesapla
     */
    calculateWorkingDays(employee) {
        if (employee.salaryType === 'weekly') {
            return 7 - employee.closedDays.length;
        } else {
            // Aylık: 30 gün - (haftalık kapalı günler * 4)
            return 30 - (employee.closedDays.length * 4);
        }
    }

    /**
     * Çalışan dönemlerini getir
     */
    getEmployeePeriods(employeeId) {
        const employee = this.employees.find(e => e.id === employeeId);
        if (!employee) return [];

        // Aktif dönem oluştur
        const activePeriod = this.createActivePeriod(employee);
        const periods = [activePeriod];

        // Geçmiş ödeme dönemlerini ekle
        employee.history
            .filter(item => item.type === 'payment')
            .forEach(payment => {
                periods.push({
                    id: payment.id,
                    type: 'payment',
                    amount: payment.amount,
                    startDate: payment.startDate,
                    endDate: payment.date,
                    workingDays: this.calculateWorkingDays(employee),
                    absences: this.getPeriodAbsences(employee, payment.startDate, payment.date),
                    totalDeduction: this.getPeriodDeductions(employee, payment.startDate, payment.date)
                });
            });

        return periods.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    }

    /**
     * Aktif dönem oluştur
     */
    createActivePeriod(employee) {
        const today = new Date();
        const periodStart = this.getPeriodStart(employee, today);
        
        // Dönem içinde geçen gün sayısını hesapla
        const periodDays = Math.ceil((today - new Date(periodStart)) / (1000 * 60 * 60 * 24));
        const workingDays = this.calculateWorkingDays(employee);
        const dailyWage = this.calculateDailyWage(employee);
        
        // Dönemdeki biriken maaş (çalışılan gün sayısı × yevmiye)
        const periodDaysWorked = Math.min(periodDays, workingDays);
        const accumulatedSalary = periodDaysWorked * dailyWage;
        
        // Dönemdeki toplam kesinti
        const totalDeduction = this.getPeriodDeductions(employee, periodStart, today.toISOString().split('T')[0]);
        
        // Güncel borç = biriken maaş - kesintiler - ödenenler
        const currentDebt = Math.max(0, accumulatedSalary - totalDeduction - this.getTotalPayments(employee, periodStart));
        
        return {
            id: 'active',
            type: 'active',
            amount: currentDebt,
            accumulatedSalary: accumulatedSalary,
            startDate: periodStart,
            endDate: today.toISOString().split('T')[0],
            workingDays: workingDays,
            periodDaysWorked: periodDaysWorked,
            absences: this.getPeriodAbsences(employee, periodStart, today.toISOString().split('T')[0]),
            totalDeduction: totalDeduction
        };
    }

    /**
     * Dönemdeki toplam ödemeleri hesapla
     */
    getTotalPayments(employee, startDate) {
        return employee.history
            .filter(item => 
                item.type === 'payment' && 
                item.date >= startDate
            )
            .reduce((total, payment) => total + payment.amount, 0);
    }

    /**
     * Dönem başlangıcını hesapla
     */
    getPeriodStart(employee, date) {
        const d = new Date(date);
        
        if (employee.salaryType === 'weekly') {
            // Haftalık: 7 gün geri
            d.setDate(d.getDate() - 7);
        } else {
            // Aylık: 30 gün geri
            d.setDate(d.getDate() - 30);
        }
        
        return d.toISOString().split('T')[0];
    }

    /**
     * Dönem devamsızlıklarını getir
     */
    getPeriodAbsences(employee, startDate, endDate) {
        return employee.history
            .filter(item => 
                item.type === 'absence' && 
                item.date >= startDate && 
                item.date <= endDate
            );
    }

    /**
     * Dönem kesintilerini hesapla
     */
    getPeriodDeductions(employee, startDate, endDate) {
        return this.getPeriodAbsences(employee, startDate, endDate)
            .reduce((total, absence) => total + (absence.deduction || 0), 0);
    }

    /**
     * İstatistikleri hesapla
     */
    calculateStats() {
        const totalEmployees = this.employees.length;
        const totalDebt = this.employees.reduce((sum, emp) => sum + emp.debt, 0);
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const totalDeductions = this.employees.reduce((sum, emp) => {
            const monthDeductions = emp.history
                .filter(item => item.type === 'absence')
                .filter(item => {
                    const itemDate = new Date(item.date);
                    return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
                })
                .reduce((monthSum, item) => monthSum + (item.deduction || 0), 0);
            return sum + monthDeductions;
        }, 0);

        return {
            totalEmployees,
            totalDebt,
            totalDeductions
        };
    }

    /**
     * Son ödemeleri getir
     */
    getRecentPayments() {
        const allPayments = [];
        
        this.employees.forEach(employee => {
            employee.history
                .filter(item => item.type === 'payment')
                .forEach(item => {
                    allPayments.push({
                        employeeName: employee.name,
                        amount: item.amount,
                        date: item.date,
                        createdAt: item.createdAt
                    });
                });
        });

        return allPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Son devamsızlıkları getir
     */
    getRecentAbsences() {
        const allAbsences = [];
        
        this.employees.forEach(employee => {
            employee.history
                .filter(item => item.type === 'absence')
                .forEach(item => {
                    allAbsences.push({
                        employeeName: employee.name,
                        deduction: item.deduction,
                        date: item.date,
                        createdAt: item.createdAt
                    });
                });
        });

        return allAbsences.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Modal aç
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.querySelector('.bg-white')?.classList.add('scale-in');
        }, 10);
    }

    /**
     * Modal kapat
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.querySelector('.bg-white')?.classList.remove('scale-in');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    /**
     * Tüm modalları kapat
     */
    closeAllModals() {
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
            this.closeModal(modal.id);
        });
    }

    /**
     * Bildirim göster
     */
    showNotification(type, message) {
        const container = document.getElementById('notificationContainer');
        const notificationId = this.generateId();
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${icons[type]} notification-icon"></i>
            <div class="notification-content">${message}</div>
            <button class="notification-close" onclick="luxwage.closeNotification('${notificationId}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        notification.id = notificationId;

        container.appendChild(notification);

        // Otomatik kapanış
        setTimeout(() => {
            this.closeNotification(notificationId);
        }, 5000);
    }

    /**
     * Bildirim kapat
     */
    closeNotification(notificationId) {
        const notification = document.getElementById(notificationId);
        if (notification) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }

    /**
     * Yasal bilgileri göster
     */
    showLegalInfo(type) {
        const legalData = {
            privacy: {
                title: 'Gizlilik Politikası',
                content: `
                    <h2>Gizlilik Politikası</h2>
                    <p><strong>Son Güncelleme:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
                    
                    <h3>1. Veri Toplama</h3>
                    <p>LuxWage olarak, çalışan yönetim sistemi kapsamında aşağıdaki verileri toplarız:</p>
                    <ul>
                        <li>Çalışan adı, soyadı ve iletişim bilgileri</li>
                        <li>Maaş ve ödeme bilgileri</li>
                        <li>Devamsızlık kayıtları</li>
                        <li>Ödeme geçmişi</li>
                    </ul>
                    
                    <h3>2. Veri Güvenliği</h3>
                    <p>Tüm verileriniz LocalStorage üzerinde saklanır. Verilerinizi korumak için düzenli backup yapın.</p>
                `
            },
            terms: {
                title: 'Kullanım Şartları',
                content: `
                    <h2>Kullanım Şartları</h2>
                    <p><strong>Son Güncelleme:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
                    
                    <h3>1. Kabul Edilme</h3>
                    <p>LuxWage'i kullanarak bu şartları kabul etmiş olursunuz.</p>
                    
                    <h3>2. Kullanıcı Sorumlulukları</h3>
                    <ul>
                        <li>Doğru ve güncel bilgi girmek</li>
                        <li>Yasalara uygun kullanım</li>
                        <li>Üçüncü şahısların bilgilerini korumak</li>
                    </ul>
                `
            }
        };

        const data = legalData[type];
        if (!data) return;

        document.getElementById('legalTitle').textContent = data.title;
        document.getElementById('legalContent').innerHTML = data.content;
        this.openModal('legalModal');
    }

    /**
     * Eski verileri temizle (1 yıldan eski)
     */
    cleanupOldData() {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        this.employees.forEach(employee => {
            employee.history = employee.history.filter(item => {
                const itemDate = new Date(item.createdAt);
                return itemDate > oneYearAgo;
            });
        });

        this.saveData();
    }

    /**
     * Tarih formatla
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Para formatla
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    }

    /**
     * Güncel tarihi güncelle
     */
    updateCurrentDate() {
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = this.formatDate(new Date().toISOString());
        }
        
        // Her gün güncellemek için
        setTimeout(() => this.updateCurrentDate(), 60000);
    }

    /**
     * İsimlerden baş harfleri al
     */
    getInitials(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 2);
    }

    /**
     * Benzersiz ID oluştur
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Global instance oluştur
let luxwage;

// DOM yüklendiğinde uygulamayı başlat
document.addEventListener('DOMContentLoaded', () => {
    luxwage = new LuxWageApp();
});

// Global fonksiyonlar (HTML'den erişim için)
function showDashboard() {
    luxwage.showDashboard();
}

function showPage(pageName) {
    luxwage.showPage(pageName);
}

function openModal(modalId) {
    luxwage.openModal(modalId);
}

function closeModal(modalId) {
    luxwage.closeModal(modalId);
}

function showLegalInfo(type) {
    luxwage.showLegalInfo(type);
}

function showNotification(type, message) {
    luxwage.showNotification(type, message);
}
