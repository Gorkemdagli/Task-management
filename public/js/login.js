/**
 * Login Page JavaScript
 * Giriş sayfası için tüm JavaScript işlevleri
 */

document.addEventListener('DOMContentLoaded', function() {
    // Form doğrulama
    const loginForm = document.querySelector('form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            // E-posta ve şifre alanlarını al
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            // Temel doğrulama
            let isValid = true;
            
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
            
            // Eğer form geçerli değilse gönderimi engelle
            if (!isValid) {
                event.preventDefault();
            }
        });
    }
    
    // Şifremi unuttum linkine tıklandığında
    const forgotPasswordLink = document.querySelector('a[href="/forgot-password"]');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(event) {
            const emailInput = document.getElementById('email');
            // E-posta alanı doluysa, şifremi unuttum sayfasına e-postayı parametre olarak ekle
            if (emailInput.value.trim() && isValidEmail(emailInput.value)) {
                event.preventDefault();
                window.location.href = `/forgot-password?email=${encodeURIComponent(emailInput.value)}`;
            }
        });
    }
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
 * Hata mesajı gösterme
 * @param {HTMLElement} inputElement - Hata gösterilecek input
 * @param {string} message - Hata mesajı
 */
function showError(inputElement, message) {
    // Eğer zaten bir hata mesajı varsa, tekrar ekleme
    const existingError = inputElement.nextElementSibling;
    if (existingError && existingError.classList.contains('error-message')) {
        existingError.textContent = message;
        return;
    }
    
    // Hata mesajı oluştur
    const errorElement = document.createElement('div');
    errorElement.classList.add('error-message', 'text-red-500', 'text-xs', 'mt-1');
    errorElement.textContent = message;
    
    // Input'un hemen altına ekle
    inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
    
    // Input'a hata sınıfı ekle
    inputElement.classList.add('border-red-500');
}

/**
 * Hata mesajını kaldırma
 * @param {HTMLElement} inputElement - Hata kaldırılacak input
 */
function removeError(inputElement) {
    // Hata mesajını kaldır
    const existingError = inputElement.nextElementSibling;
    if (existingError && existingError.classList.contains('error-message')) {
        existingError.remove();
    }
    
    // Input'tan hata sınıfını kaldır
    inputElement.classList.remove('border-red-500');
} 