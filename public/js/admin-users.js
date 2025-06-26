/**
 * Admin Users Management JavaScript
 * Admin kullanıcı yönetimi sayfası için tüm JavaScript işlevleri
 */

document.addEventListener('DOMContentLoaded', function() {
    // Kullanıcıları yükle
    loadUsers();
});

/**
 * Kullanıcıları API'den yükler ve kullanıcı tablosunda gösterir
 */
function loadUsers() {
    // Kullanıcı tablosu referansı
    const userTableBody = document.getElementById('users-table-body');
    if (!userTableBody) return;
    
    // Yükleniyor mesajı ekle
    userTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Kullanıcılar yükleniyor...</td></tr>';
    
    // Kullanıcı bilgilerini getir
    fetch('/api/users', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
        },
        credentials: 'include' // Cookie'leri dahil et
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'Kullanıcılar yüklenirken bir hata oluştu');
            });
        }
        return response.json();
    })
    .then(users => {
        if (users.length === 0) {
            userTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Henüz hiç kullanıcı yok.</td></tr>';
            return;
        }
        
        // Mevcut kullanıcı ID'sini al
        const currentUserId = document.body.getAttribute('data-user-id');
        
        // Kullanıcı tablosunu doldur
        userTableBody.innerHTML = '';
        
        users.forEach(user => {
            let row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            // İsim hücresi
            let nameCell = document.createElement('td');
            nameCell.className = 'px-6 py-4 whitespace-nowrap';
            nameCell.innerHTML = `
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        ${user.avatar 
                            ? `<img class="h-10 w-10 rounded-full" src="${user.avatar}" alt="${user.name}">`
                            : `<div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span class="text-blue-600 font-semibold">${user.name.charAt(0)}</span>
                              </div>`
                        }
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${user.name}</div>
                        ${user._id === currentUserId ? '<span class="text-xs text-blue-500">(Siz)</span>' : ''}
                    </div>
                </div>
            `;
            
            // Email hücresi
            let emailCell = document.createElement('td');
            emailCell.className = 'px-6 py-4 whitespace-nowrap';
            emailCell.innerHTML = `
                <div class="text-sm text-gray-900">${user.email}</div>
            `;
            
            // Rol hücresi
            let roleCell = document.createElement('td');
            roleCell.className = 'px-6 py-4 whitespace-nowrap';
            
            let roleBadgeClass = 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ';
            if (user.role === 'admin') {
                roleBadgeClass += 'bg-red-100 text-red-800';
            } else {
                roleBadgeClass += 'bg-green-100 text-green-800';
            }
            
            roleCell.innerHTML = `
                <span class="${roleBadgeClass}">
                    ${user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                </span>
            `;
            
            // Tarih hücresi
            let dateCell = document.createElement('td');
            dateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            
            const createdDate = new Date(user.createdAt);
            const formattedDate = createdDate.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            dateCell.textContent = formattedDate;
            
            // İşlemler hücresi
            let actionsCell = document.createElement('td');
            actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
            
            if (user._id !== currentUserId) {
                // Sadece diğer kullanıcılar için işlem butonları göster
                if (user.role !== 'admin') {
                    actionsCell.innerHTML += `
                        <button 
                            data-user-id="${user._id}" 
                            data-user-name="${user.name}"
                            class="make-admin-btn text-indigo-600 hover:text-indigo-900 mx-2"
                        >
                            Admin Yap
                        </button>
                    `;
                }
                
                actionsCell.innerHTML += `
                    <button 
                        data-user-id="${user._id}" 
                        data-user-name="${user.name}"
                        class="delete-user-btn text-red-600 hover:text-red-900 mx-2"
                    >
                        Sil
                    </button>
                `;
            } else {
                actionsCell.innerHTML = '<span class="text-gray-400">Mevcut kullanıcı</span>';
            }
            
            // Hücreleri satıra ekle
            row.appendChild(nameCell);
            row.appendChild(emailCell);
            row.appendChild(roleCell);
            row.appendChild(dateCell);
            row.appendChild(actionsCell);
            
            // Satırı tabloya ekle
            userTableBody.appendChild(row);
        });
        
        // "Admin yap" butonları için olay dinleyicileri ekle
        document.querySelectorAll('.make-admin-btn').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                const userName = this.getAttribute('data-user-name');
                makeUserAdmin(userId, userName);
            });
        });
        
        // "Sil" butonları için olay dinleyicileri ekle
        document.querySelectorAll('.delete-user-btn').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                const userName = this.getAttribute('data-user-name');
                deleteUser(userId, userName);
            });
        });
    })
    .catch(error => {
        userTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-red-500">
                    Kullanıcılar yüklenirken bir hata oluştu: ${error.message}
                </td>
            </tr>
        `;
    });
}

/**
 * Kullanıcıyı admin yapmak için API'ye istek gönderir
 * @param {string} userId - Admin yapılacak kullanıcının ID'si
 * @param {string} userName - Admin yapılacak kullanıcının adı
 */
function makeUserAdmin(userId, userName) {
    if (!confirm(`${userName} kullanıcısını admin yapmak istediğinize emin misiniz?\nBu işlem kullanıcıya tüm sistem üzerinde yönetici hakları verecektir.`)) {
        return;
    }
    
    fetch(`/api/users/${userId}/make-admin`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        credentials: 'include' // Cookie'leri dahil et
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'Kullanıcı admin yapılırken bir hata oluştu');
            });
        }
        return response.json();
    })
    .then(data => {
        alert(`${userName} başarıyla admin yapıldı.`);
        loadUsers(); // Kullanıcı listesini yenile
    })
    .catch(error => {
        alert(`Kullanıcı admin yapılırken bir hata oluştu: ${error.message}`);
    });
}

/**
 * Kullanıcıyı silmek için API'ye istek gönderir
 * @param {string} userId - Silinecek kullanıcının ID'si
 * @param {string} userName - Silinecek kullanıcının adı
 */
function deleteUser(userId, userName) {
    if (!confirm(`${userName} kullanıcısını silmek istediğinize emin misiniz?\nBu işlem geri alınamaz ve kullanıcıya ait tüm veriler silinecektir.`)) {
        return;
    }
    
    fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'include' // Cookie'leri dahil et
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'Kullanıcı silinirken bir hata oluştu');
            });
        }
        return response.json();
    })
    .then(data => {
        alert(`${userName} başarıyla silindi.`);
        loadUsers(); // Kullanıcı listesini yenile
    })
    .catch(error => {
        alert(`Kullanıcı silinirken bir hata oluştu: ${error.message}`);
    });
} 