/**
 * Team Detail Page JavaScript
 * Takım detay sayfası için tüm JavaScript işlevleri
 */

document.addEventListener('DOMContentLoaded', function() {
    // Takım görevlerini yükle
    loadTeamTasks();
    
    // Yeni görev butonu
    const newTaskBtn = document.getElementById('new-task-btn');
    if (newTaskBtn) {
        newTaskBtn.addEventListener('click', function() {
            // Takım ID'sini data attribute'ından al
            const teamId = document.body.getAttribute('data-team-id');
            window.location.href = `/?newTask=${teamId}`;
        });
    }
    
    // Üye ekleme butonu ve modal
    const addMemberBtn = document.getElementById('add-member-btn');
    const addMemberModal = document.getElementById('add-member-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const searchUserInput = document.getElementById('search-user');
    
    if (addMemberBtn && addMemberModal) {
        // Modal açma
        addMemberBtn.addEventListener('click', function() {
            addMemberModal.classList.remove('hidden');
            if (searchUserInput) {
                searchUserInput.focus();
            }
        });
        
        // Modal kapatma
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                addMemberModal.classList.add('hidden');
                if (searchUserInput) {
                    searchUserInput.value = '';
                    document.getElementById('users-list').innerHTML = '<div class="text-center text-gray-500 py-4"><p>Kullanıcıları görmek için arama yapın</p></div>';
                }
            });
        });
        
        // Dışarı tıklandığında modal kapanması
        addMemberModal.addEventListener('click', function(e) {
            if (e.target === addMemberModal) {
                addMemberModal.classList.add('hidden');
                if (searchUserInput) {
                    searchUserInput.value = '';
                    document.getElementById('users-list').innerHTML = '<div class="text-center text-gray-500 py-4"><p>Kullanıcıları görmek için arama yapın</p></div>';
                }
            }
        });
        
        // Arama input değişikliğini dinle
        if (searchUserInput) {
            let debounceTimeout;
            searchUserInput.addEventListener('input', function() {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    const searchTerm = searchUserInput.value.trim();
                    if (searchTerm.length >= 2) {
                        searchUsers(searchTerm);
                    } else {
                        document.getElementById('users-list').innerHTML = '<div class="text-center text-gray-500 py-4"><p>En az 2 karakter girerek arama yapın</p></div>';
                    }
                }, 300);
            });
        }
    }
    
    // Takımı düzenleme butonu
    const editTeamBtn = document.getElementById('edit-team-btn');
    if (editTeamBtn) {
        editTeamBtn.addEventListener('click', function() {
            // Takım düzenleme modal'ı gösterilecek (ileride eklenecek)
            alert('Takım düzenleme özelliği yakında eklenecek!');
        });
    }
    
    // Üye çıkarma butonları
    const removeMemberBtns = document.querySelectorAll('.remove-member-btn');
    removeMemberBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const memberId = this.getAttribute('data-id');
            if (confirm('Bu üyeyi takımdan çıkarmak istediğinize emin misiniz?')) {
                removeMember(memberId);
            }
        });
    });
    
    // Takımdan ayrılma butonu
    const leaveTeamBtn = document.getElementById('leave-team-btn');
    if (leaveTeamBtn) {
        leaveTeamBtn.addEventListener('click', function() {
            if (confirm('Bu takımdan ayrılmak istediğinize emin misiniz?')) {
                leaveTeam();
            }
        });
    }
});

/**
 * Takım görevlerini yükle
 */
function loadTeamTasks() {
    const teamId = document.body.getAttribute('data-team-id');
    if (!teamId) return;
    
    const tasksContainer = document.getElementById('team-tasks');
    if (!tasksContainer) return;
    
    fetch(`/api/tasks?teamId=${teamId}`)
        .then(response => response.json())
        .then(tasks => {
            if (tasks.length === 0) {
                tasksContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Bu takıma henüz bir görev atanmamış.</p>';
            } else {
                tasksContainer.innerHTML = '';
                
                tasks.forEach(task => {
                    let statusClass = '';
                    let statusText = '';
                    
                    switch(task.status) {
                        case 'todo':
                            statusClass = 'bg-blue-100 text-blue-800';
                            statusText = 'Yapılacak';
                            break;
                        case 'doing':
                            statusClass = 'bg-yellow-100 text-yellow-800';
                            statusText = 'Yapılıyor';
                            break;
                        case 'done':
                            statusClass = 'bg-green-100 text-green-800';
                            statusText = 'Tamamlandı';
                            break;
                    }
                    
                    const html = `
                    <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div class="flex justify-between">
                            <h3 class="font-medium text-gray-900">${task.title}</h3>
                            <span class="px-2 py-1 rounded text-xs font-medium ${statusClass}">${statusText}</span>
                        </div>
                        <p class="text-gray-600 text-sm mt-1">${task.description || 'Açıklama yok'}</p>
                        <div class="flex justify-between items-center mt-3">
                            <div class="text-sm text-gray-500">
                                <span>Bitiş: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Belirlenmedi'}</span>
                            </div>
                            <a href="/tasks/${task._id}" class="text-blue-600 hover:text-blue-800 text-sm">Görüntüle →</a>
                        </div>
                    </div>
                    `;
                    
                    tasksContainer.innerHTML += html;
                });
            }
        })
        .catch(error => {
            console.error('Görevler yüklenirken hata oluştu:', error);
            tasksContainer.innerHTML = 
                '<p class="text-center text-red-500">Görevler yüklenirken bir hata oluştu.</p>';
        });
}

/**
 * Üye çıkar
 * @param {string} memberId - Çıkarılacak üyenin ID'si
 */
function removeMember(memberId) {
    const teamId = document.body.getAttribute('data-team-id');
    if (!teamId) return;
    
    fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Üye çıkarılırken bir hata oluştu');
        }
        return response.json();
    })
    .then(data => {
        // Sayfayı yenile
        window.location.reload();
    })
    .catch(error => {
        console.error('Hata:', error);
        alert('Üye çıkarılırken bir hata oluştu.');
    });
}

/**
 * Takımdan ayrıl
 */
function leaveTeam() {
    const teamId = document.body.getAttribute('data-team-id');
    const userId = document.body.getAttribute('data-user-id');
    if (!teamId || !userId) return;
    
    fetch(`/api/teams/${teamId}/leave`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Takımdan ayrılırken bir hata oluştu');
        }
        return response.json();
    })
    .then(data => {
        // Takımlar sayfasına yönlendir
        window.location.href = '/teams';
    })
    .catch(error => {
        console.error('Hata:', error);
        alert('Takımdan ayrılırken bir hata oluştu.');
    });
}

/**
 * Kullanıcı ara
 * @param {string} searchTerm - Aranacak metin
 */
function searchUsers(searchTerm) {
    const usersListContainer = document.getElementById('users-list');
    if (!usersListContainer) return;
    
    usersListContainer.innerHTML = '<div class="text-center text-gray-500 py-4"><p>Aranıyor...</p></div>';
    
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
            usersListContainer.innerHTML = '<div class="text-center text-gray-500 py-4"><p>Kullanıcı bulunamadı</p></div>';
            return;
        }
        
        const teamId = document.body.getAttribute('data-team-id');
        
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
                    <button class="add-user-btn px-3 py-1 text-sm font-medium text-blue-700 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-md" data-id="${user._id}">
                        Ekle
                    </button>
                </div>
            `;
        });
        html += '</div>';
        
        usersListContainer.innerHTML = html;
        
        // Kullanıcı ekleme butonlarına event listener ekle
        document.querySelectorAll('.add-user-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                addMember(userId);
            });
        });
    })
    .catch(error => {
        console.error('Hata:', error);
        usersListContainer.innerHTML = '<div class="text-center text-red-500 py-4"><p>Kullanıcılar aranırken bir hata oluştu</p></div>';
    });
}

/**
 * Takıma üye ekle
 * @param {string} userId - Eklenecek kullanıcının ID'si
 */
function addMember(userId) {
    const teamId = document.body.getAttribute('data-team-id');
    if (!teamId) return;
    
    fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ userId }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.message || 'Üye eklenirken bir hata oluştu');
            });
        }
        return response.json();
    })
    .then(data => {
        // Modal'ı kapat
        document.getElementById('add-member-modal').classList.add('hidden');
        
        // Sayfayı yenile
        alert('Kullanıcı takıma başarıyla eklendi!');
        window.location.reload();
    })
    .catch(error => {
        console.error('Hata:', error);
        alert(error.message || 'Üye eklenirken bir hata oluştu');
    });
} 