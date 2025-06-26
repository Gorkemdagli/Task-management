/**
 * Register Page JavaScript
 * Kayıt sayfası için tüm JavaScript işlevleri
 */

document.addEventListener('DOMContentLoaded', function() {
    // Form doğrulama
    const registerForm = document.querySelector('form');
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            // Formdan girdileri al
            const fullNameInput = document.getElementById('fullName');
            const usernameInput = document.getElementById('username');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            const termsCheckbox = document.getElementById('terms');
            
            // Temel doğrulama
            let isValid = true;
            
            // Ad Soyad doğrulama
            if (!fullNameInput.value.trim()) {
                showError(fullNameInput, 'Ad Soyad alanı boş bırakılamaz');
                isValid = false;
            } else if (fullNameInput.value.trim().length < 3) {
                showError(fullNameInput, 'Ad Soyad en az 3 karakter olmalıdır');
                isValid = false;
            } else {
                removeError(fullNameInput);
            }
            
            // Kullanıcı adı doğrulama
            if (!usernameInput.value.trim()) {
                showError(usernameInput, 'Kullanıcı adı boş bırakılamaz');
                isValid = false;
            } else if (usernameInput.value.trim().length < 3) {
                showError(usernameInput, 'Kullanıcı adı en az 3 karakter olmalıdır');
                isValid = false;
            } else if (!/^[a-zA-Z0-9_]+$/.test(usernameInput.value)) {
                showError(usernameInput, 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir');
                isValid = false;
            } else {
                removeError(usernameInput);
            }
            
            // E-posta doğrulama
            if (!emailInput.value.trim()) {
                showError(emailInput, 'E-posta alanı boş bırakılamaz');
                isValid = false;
            } else if (!isValidEmail(emailInput.value)) {
                showError(emailInput, 'Geçerli bir e-posta adresi giriniz');
                isValid = false;
            } else {
                removeError(emailInput);
            }
            
            // Şifre doğrulama
            if (!passwordInput.value) {
                showError(passwordInput, 'Şifre alanı boş bırakılamaz');
                isValid = false;
            } else if (passwordInput.value.length < 6) {
                showError(passwordInput, 'Şifre en az 6 karakter olmalıdır');
                isValid = false;
            } else {
                removeError(passwordInput);
            }
            
            // Şifre tekrar doğrulama
            if (!confirmPasswordInput.value) {
                showError(confirmPasswordInput, 'Şifre tekrar alanı boş bırakılamaz');
                isValid = false;
            } else if (confirmPasswordInput.value !== passwordInput.value) {
                showError(confirmPasswordInput, 'Şifreler eşleşmiyor');
                isValid = false;
            } else {
                removeError(confirmPasswordInput);
            }
            
            // Şartları kabul et doğrulama
            if (!termsCheckbox.checked) {
                showError(termsCheckbox, 'Kullanım şartlarını kabul etmelisiniz');
                isValid = false;
            } else {
                removeError(termsCheckbox);
            }
            
            // Eğer form geçerli değilse gönderimi engelle
            if (!isValid) {
                event.preventDefault();
            }
        });
    }
    
    // Şifre göster/gizle işlevselliği
    setupPasswordToggle('password');
    setupPasswordToggle('confirmPassword');
});

/**
 * E-posta doğrulama yardımcı fonksiyonu
 * @param {string} email - Doğrulanacak e-posta adresi
 * @returns {boolean} - E-posta geçerli mi?
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Şifre görünürlüğünü değiştirme 
 * @param {string} inputId - Şifre input elementinin ID'si
 */
function setupPasswordToggle(inputId) {
    const passwordInput = document.getElementById(inputId);
    if (!passwordInput) return;
    
    // Toggle butonu oluştur
    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500';
    toggleButton.innerHTML = '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>';
    
    // Input container'ı relative yap
    passwordInput.parentElement.style.position = 'relative';
    
    // Toggle butonunu ekle
    passwordInput.parentElement.appendChild(toggleButton);
    
    // Toggle butonu tıklama olayı
    toggleButton.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // İkon değiştir
        if (type === 'text') {
            this.innerHTML = '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>';
        } else {
            this.innerHTML = '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>';
        }
    });
}

/**
 * Hata mesajı gösterme
 * @param {HTMLElement} inputElement - Hata gösterilecek input
 * @param {string} message - Hata mesajı
 */
function showError(inputElement, message) {
    // Eğer zaten bir hata mesajı varsa, tekrar ekleme
    let targetElement = inputElement;
    // Checkbox için label'ı hedefle
    if (inputElement.type === 'checkbox') {
        targetElement = inputElement.nextElementSibling;
    }
    
    const existingError = targetElement.nextElementSibling;
    if (existingError && existingError.classList.contains('error-message')) {
        existingError.textContent = message;
        return;
    }
    
    // Hata mesajı oluştur
    const errorElement = document.createElement('div');
    errorElement.classList.add('error-message', 'text-red-500', 'text-xs', 'mt-1');
    errorElement.textContent = message;
    
    // Element'in hemen altına ekle
    targetElement.parentNode.insertBefore(errorElement, targetElement.nextSibling);
    
    // Input'a hata sınıfı ekle
    if (inputElement.type !== 'checkbox') {
        inputElement.classList.add('border-red-500');
    }
}

/**
 * Hata mesajını kaldırma
 * @param {HTMLElement} inputElement - Hata kaldırılacak input
 */
function removeError(inputElement) {
    let targetElement = inputElement;
    // Checkbox için label'ı hedefle
    if (inputElement.type === 'checkbox') {
        targetElement = inputElement.nextElementSibling;
    }
    
    // Hata mesajını kaldır
    const existingError = targetElement.nextElementSibling;
    if (existingError && existingError.classList.contains('error-message')) {
        existingError.remove();
    }
    
    // Input'tan hata sınıfını kaldır
    if (inputElement.type !== 'checkbox') {
        inputElement.classList.remove('border-red-500');
    }
} 