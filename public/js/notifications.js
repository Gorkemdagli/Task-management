/**
 * Modern Toast Bildirim Sistemi
 */

// Toast container'ı oluştur
function createToastContainer() {
    if (document.getElementById('toast-container')) return;
    
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(container);
}

/**
 * Toast bildirimi göster
 * @param {string} message - Gösterilecek mesaj
 * @param {string} type - Bildirim tipi: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Gösterim süresi (ms), varsayılan 3000
 */
function showToast(message, type = 'info', duration = 3000) {
    createToastContainer();
    
    const toast = document.createElement('div');
    const toastId = 'toast-' + Date.now();
    toast.id = toastId;
    
    // Tip değerine göre stil ve ikon belirle
    let bgColor, icon, textColor;
    switch(type) {
        case 'success':
            bgColor = 'bg-green-500';
            textColor = 'text-white';
            icon = '✅';
            break;
        case 'error':
            bgColor = 'bg-red-500';
            textColor = 'text-white';
            icon = '❌';
            break;
        case 'warning':
            bgColor = 'bg-yellow-500';
            textColor = 'text-black';
            icon = '⚠️';
            break;
        default: // info
            bgColor = 'bg-blue-500';
            textColor = 'text-white';
            icon = 'ℹ️';
    }
    
    toast.className = `${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 min-w-80 max-w-md transform transition-all duration-300 translate-x-full opacity-0`;
    
    toast.innerHTML = `
        <span class="text-lg">${icon}</span>
        <span class="flex-1 text-sm font-medium">${message}</span>
        <button onclick="removeToast('${toastId}')" class="text-white hover:text-gray-200 focus:outline-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    
    // Animasyon ile göster
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);
    
    // Belirtilen süre sonra kaldır
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toastId);
        }, duration);
    }
}

/**
 * Toast'ı kaldır
 * @param {string} toastId - Kaldırılacak toast ID'si
 */
function removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Kısa yollar
function showSuccess(message, duration = 3000) {
    showToast(message, 'success', duration);
}

function showError(message, duration = 5000) {
    showToast(message, 'error', duration);
}

function showWarning(message, duration = 4000) {
    showToast(message, 'warning', duration);
}

function showInfo(message, duration = 3000) {
    showToast(message, 'info', duration);
}

// Global olarak erişilebilir yap
window.showToast = showToast;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.removeToast = removeToast; 