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
    const authButtons = document.getElementById('authNav');
    const userNav = document.getElementById('userNav');
    const userEmail = document.getElementById('userEmail');
    
    if (user) {
        if (authButtons) authButtons.style.display = 'none';
        if (userNav) userNav.style.display = 'block';
        if (userEmail) userEmail.textContent = user.email;
    } else {
        if (authButtons) authButtons.style.display = 'block';
        if (userNav) userNav.style.display = 'none';
    }
});

// Logout button event listener
const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', logout);
}
