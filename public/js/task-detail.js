document.addEventListener('DOMContentLoaded', function() {
    // Görev ID'sini al
    const taskId = document.body.getAttribute('data-task-id');
    // Kullanıcı atanmış mı?
    const isAssigned = document.body.getAttribute('data-is-assigned') === 'true' || document.body.getAttribute('data-is-assigned') === true;
    // Kullanıcı rolü
    const userRole = document.body.getAttribute('data-user-role');
    // Kullanıcı ID'si
    const userId = document.body.getAttribute('data-user-id');
    
    // Butonları seç
    const todoBtn = document.getElementById('status-todo-btn');
    const doingBtn = document.getElementById('status-doing-btn');
    const doneBtn = document.getElementById('status-done-btn');
    const deleteBtn = document.getElementById('delete-task-btn');
    const addAssigneeBtn = document.getElementById('add-assignee-btn');
    
    console.log('Görev ID:', taskId);
    console.log('Kullanıcı atanmış mı:', isAssigned);
    console.log('Kullanıcı rolü:', userRole);
    
    // Sadece admin veya atanmış kullanıcılar için butonları aktifleştir
    if (isAssigned || userRole === 'admin') {
        console.log('Durum değiştirme butonları etkinleştirildi');
        
        // Yapılacak butonuna tıklama işlevi
        todoBtn.addEventListener('click', function() {
            updateTaskStatus('todo');
        });
        
        // Yapılıyor butonuna tıklama işlevi
        doingBtn.addEventListener('click', function() {
            updateTaskStatus('doing');
        });
        
        // Tamamlandı butonuna tıklama işlevi
        doneBtn.addEventListener('click', function() {
            updateTaskStatus('done');
        });
    } else {
        // Atanmamış ve admin olmayan kullanıcılar için butonları devre dışı bırak
        console.log('Durum değiştirme butonları devre dışı bırakıldı');
        
        todoBtn.classList.add('opacity-50', 'cursor-not-allowed');
        todoBtn.disabled = true;
        todoBtn.title = 'Bu göreve atanmadığınız için durumu değiştiremezsiniz';
        
        doingBtn.classList.add('opacity-50', 'cursor-not-allowed');
        doingBtn.disabled = true;
        doingBtn.title = 'Bu göreve atanmadığınız için durumu değiştiremezsiniz';
        
        doneBtn.classList.add('opacity-50', 'cursor-not-allowed');
        doneBtn.disabled = true;
        doneBtn.title = 'Bu göreve atanmadığınız için durumu değiştiremezsiniz';
    }
    
    // Sadece admin kullanıcılar görevi silebilir
    if (userRole === 'admin') {
        deleteBtn.addEventListener('click', function() {
            if (confirm('Bu görevi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
                deleteTask();
            }
        });
        
        // Görevli ekle butonunu aktifleştir
        if (addAssigneeBtn) {
            addAssigneeBtn.addEventListener('click', function() {
                showAddAssigneeModal();
            });
        }
        
        // Görevli çıkar butonları için olay dinleyicileri ekle
        document.querySelectorAll('.remove-assignee-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const assigneeId = this.getAttribute('data-id');
                if (confirm('Bu kullanıcıyı görevden çıkarmak istediğinizden emin misiniz?')) {
                    removeAssignee(assigneeId);
                }
            });
        });
    } else {
        // Admin değilse silme butonunu gizle veya devre dışı bırak
        deleteBtn.classList.add('opacity-50', 'cursor-not-allowed');
        deleteBtn.disabled = true;
        deleteBtn.title = 'Sadece admin kullanıcılar görevi silebilir';
        
        // Görevli ekle butonunu gizle
        if (addAssigneeBtn) {
            addAssigneeBtn.style.display = 'none';
        }
    }
    
    /**
     * Görev durumunu güncelle
     */
    function updateTaskStatus(newStatus) {
        // Durum aynıysa, işlem yapma
        const currentStatus = getCurrentStatus();
        if (currentStatus === newStatus) return;
        
        // API isteği gönder - PUT metodu kullanılıyor
        fetch(`/api/tasks/${taskId}/status`, {
            method: 'PUT', // PATCH değil PUT kullanılmalı
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ status: newStatus }),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Durum güncellenirken bir hata oluştu');
            }
            return response.json();
        })
        .then(data => {
            // Başarılı olduğunda sayfayı yenile
            window.location.reload();
        })
        .catch(error => {
            console.error('Hata:', error);
            alert('Görev durumu güncellenirken bir hata oluştu.');
        });
    }
    
    /**
     * Görevi sil
     */
    function deleteTask() {
        fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Görev silinirken bir hata oluştu');
            }
            return response.json();
        })
        .then(data => {
            // Başarılı olduğunda görevler sayfasına yönlendir
            window.location.href = '/tasks';
        })
        .catch(error => {
            console.error('Hata:', error);
            alert('Görev silinirken bir hata oluştu.');
        });
    }
    
    /**
     * Görevli eklemek için modal göster
     */
    function showAddAssigneeModal() {
        // Basit bir modal oluştur
        const modalHTML = `
            <div id="assignee-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold text-gray-900">Görevli Ekle</h3>
                        <button id="close-modal-btn" class="text-gray-400 hover:text-gray-500">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <label for="search-user" class="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Ara</label>
                        <input type="text" id="search-user" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" placeholder="İsim veya e-posta ile ara...">
                        <p class="mt-1 text-xs text-gray-500">Aramak için en az 2 karakter girin</p>
                    </div>
                    
                    <div id="search-results" class="mb-4 max-h-60 overflow-y-auto">
                        <div class="text-center text-gray-500 py-4">
                            <p>Kullanıcıları görmek için arama yapın</p>
                        </div>
                    </div>
                    
                    <div class="flex justify-end">
                        <button id="cancel-add-btn" class="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">İptal</button>
                        <button id="confirm-add-btn" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700" disabled>Kapat</button>
                    </div>
                </div>
            </div>
        `;
        
        // Modal'ı DOM'a ekle
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // Modal kapatma butonları
        document.getElementById('close-modal-btn').addEventListener('click', closeModal);
        document.getElementById('cancel-add-btn').addEventListener('click', closeModal);
        document.getElementById('confirm-add-btn').addEventListener('click', closeModal);
        
        // Arama inputu için event listener ekle
        const searchUserInput = document.getElementById('search-user');
        if (searchUserInput) {
            let debounceTimeout;
            searchUserInput.addEventListener('input', function() {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    const searchTerm = searchUserInput.value.trim();
                    if (searchTerm.length >= 2) {
                        searchUsers(searchTerm);
                    } else {
                        document.getElementById('search-results').innerHTML = '<div class="text-center text-gray-500 py-4"><p>En az 2 karakter girerek arama yapın</p></div>';
                    }
                }, 300); // Debounce delay
            });
            
            // Otomatik focus
            setTimeout(() => searchUserInput.focus(), 100);
        }
        
        // Modal dışına tıklayınca kapat
        document.getElementById('assignee-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
        
        // Modal'ı kapatma fonksiyonu
        function closeModal() {
            document.getElementById('assignee-modal').remove();
        }
    }
    
    /**
     * Kullanıcı ara ve sonuçları listele
     * @param {string} searchTerm - Aranacak kelime
     */
    function searchUsers(searchTerm) {
        const searchResultsContainer = document.getElementById('search-results');
        if (!searchResultsContainer) return;
        
        searchResultsContainer.innerHTML = '<div class="text-center text-gray-500 py-4"><p>Aranıyor...</p></div>';
        
        // API'den kullanıcıları ara
        fetch('/api/users/search?term=' + encodeURIComponent(searchTerm), {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Kullanıcılar aranırken bir hata oluştu');
            }
            return response.json();
        })
        .then(users => {
            if (users.length === 0) {
                searchResultsContainer.innerHTML = '<div class="text-center text-gray-500 py-4"><p>Kullanıcı bulunamadı</p></div>';
                return;
            }
            
            // Kullanıcı listesini oluştur
            let html = '<div class="space-y-2">';
            users.forEach(user => {
                html += `
                    <div class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex justify-between items-center">
                        <div class="flex items-center">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}" alt="${user.name}" class="w-10 h-10 rounded-full mr-3">
                            <div>
                                <p class="font-medium text-gray-800">${user.name}</p>
                                <p class="text-sm text-gray-500">${user.email}</p>
                            </div>
                        </div>
                        <button class="add-user-btn px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md" data-email="${user.email}">
                            Ekle
                        </button>
                    </div>
                `;
            });
            html += '</div>';
            
            searchResultsContainer.innerHTML = html;
            
            // Kullanıcı ekleme butonlarına event listener ekle
            document.querySelectorAll('.add-user-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const email = this.getAttribute('data-email');
                    // Butonu devre dışı bırak ve durumunu değiştir
                    this.disabled = true;
                    this.textContent = 'Ekleniyor...';
                    this.classList.add('opacity-50');
                    
                    // Kullanıcıyı ekle
                    addAssignee(email, this);
                });
            });
        })
        .catch(error => {
            console.error('Kullanıcı arama hatası:', error);
            searchResultsContainer.innerHTML = `<div class="text-center text-red-500 py-4"><p>${error.message}</p></div>`;
        });
    }
    
    /**
     * Göreve görevli ekle
     * @param {string} email - Eklenecek kullanıcının e-posta adresi
     * @param {HTMLElement} button - Tıklanan buton (opsiyonel)
     */
    function addAssignee(email, button = null) {
        fetch(`/api/tasks/${taskId}/assignees`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                action: 'add',
                email: email
            }),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { 
                    throw new Error(err.message || 'Görevli eklenirken bir hata oluştu');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Görevli ekleme başarılı:', data);
            
            // Buton varsa durumunu güncelle
            if (button) {
                button.disabled = true;
                button.textContent = 'Eklendi';
                button.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                button.classList.add('bg-green-600');
                
                // Kapat butonunu aktif et
                const confirmButton = document.getElementById('confirm-add-btn');
                if (confirmButton) {
                    confirmButton.disabled = false;
                    confirmButton.textContent = 'Kapat';
                }
            } else {
                // Başarılı olduğunda sayfayı yenile
                window.location.reload();
            }
        })
        .catch(error => {
            console.error('Hata:', error);
            
            // Butonu yeniden etkinleştir
            if (button) {
                button.disabled = false;
                button.textContent = 'Ekle';
                button.classList.remove('opacity-50');
            }
            
            // Hata mesajını göster
            alert(error.message || 'Görevli eklenirken bir hata oluştu. Lütfen geçerli bir e-posta adresi girdiğinizden emin olun.');
        });
    }
    
    /**
     * Görevliyi çıkar
     */
    function removeAssignee(assigneeId) {
        fetch(`/api/tasks/${taskId}/assignees`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                action: 'remove',
                assigneeId: assigneeId
            }),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Görevli çıkarılırken bir hata oluştu'); });
            }
            return response.json();
        })
        .then(data => {
            // Başarılı olduğunda sayfayı yenile
            window.location.reload();
        })
        .catch(error => {
            console.error('Hata:', error);
            alert(error.message || 'Görevli çıkarılırken bir hata oluştu.');
        });
    }
    
    /**
     * Mevcut görev durumunu al
     */
    function getCurrentStatus() {
        if (todoBtn.classList.contains('bg-yellow-500')) return 'todo';
        if (doingBtn.classList.contains('bg-blue-500')) return 'doing';
        if (doneBtn.classList.contains('bg-green-500')) return 'done';
        return null;
    }
}); 