/**
 * Main Page JavaScript
 * Ana sayfa için tüm JavaScript işlevleri
 */

document.addEventListener('DOMContentLoaded', function() {
    // Takımları ve görevleri yükle
    loadTeams();
    loadTasks();
    loadKanbanTasks();
    
    // Kanban sürükle-bırak işlemlerini başlat
    initializeSortable();
    
    // "Kart ekle" butonlarına olay dinleyicileri ekle
    document.getElementById('add-todo-task')?.addEventListener('click', () => showAddTaskModal('todo'));
    document.getElementById('add-doing-task')?.addEventListener('click', () => showAddTaskModal('doing'));
    document.getElementById('add-done-task')?.addEventListener('click', () => showAddTaskModal('done'));
    
    // Modal kapatma
    document.getElementById('close-modal')?.addEventListener('click', function() {
        document.getElementById('task-modal').classList.add('hidden');
    });
    
    document.getElementById('cancel-task')?.addEventListener('click', function() {
        document.getElementById('task-modal').classList.add('hidden');
    });
    
    // Takım seçimi değiştiğinde kullanıcıları yükleme
    document.getElementById('task-team')?.addEventListener('change', function() {
        loadTeamMembers(this.value);
    });
    
    // Form gönderimi
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const taskData = {
                title: formData.get('title'),
                description: formData.get('description'),
                status: formData.get('status'),
                priority: formData.get('priority'),
                teamId: formData.get('teamId'),
                dueDate: formData.get('dueDate'),
                assigneeId: formData.get('assignee')
            };
            
            // Eğer taskId varsa, güncelleme yap
            const taskId = formData.get('taskId');
            
            if (taskId) {
                // Güncelleme API'si
                fetch(`/api/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(taskData),
                    credentials: 'include'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Görev güncellenirken bir hata oluştu');
                    }
                    return response.json();
                })
                .then(data => {
                    // Modalı kapat ve görevleri yeniden yükle
                    const taskModal = document.getElementById('task-modal');
                    const taskForm = document.getElementById('task-form');
                    
                    if (taskModal) {
                        taskModal.classList.add('hidden');
                    }
                    
                    if (taskForm) {
                        taskForm.reset();
                    }
                    
                    loadKanbanTasks();
                })
                .catch(error => {
                    console.error('Hata:', error);
                    showError('Görev güncellenirken bir hata oluştu.');
                });
            } else {
                // Yeni görev ekleme API'si
                fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(taskData),
                    credentials: 'include'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Görev eklenirken bir hata oluştu');
                    }
                    return response.json();
                })
                .then(data => {
                    // Modalı kapat ve görevleri yeniden yükle
                    const taskModal = document.getElementById('task-modal');
                    const taskForm = document.getElementById('task-form');
                    
                    if (taskModal) {
                        taskModal.classList.add('hidden');
                    }
                    
                    if (taskForm) {
                        taskForm.reset();
                    }
                    
                    loadKanbanTasks();
                })
                .catch(error => {
                    console.error('Hata:', error);
                    showError('Görev eklenirken bir hata oluştu.');
                });
            }
        });
    }
});

/**
 * Takımları yükle
 */
function loadTeams() {
    const teamsList = document.getElementById('teams-list');
    if (!teamsList) return;

    fetch('/api/users/teams', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
        .then(response => response.json())
        .then(teams => {
            if (teams.length === 0) {
                teamsList.innerHTML = '<p class="text-center text-gray-500">Henüz bir takıma üye değilsiniz.</p>';
            } else {
                teamsList.innerHTML = teams.slice(0, 3).map(team => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                            <h3 class="font-medium text-gray-900">${team.name}</h3>
                            <p class="text-sm text-gray-500">${team.members.length} üye</p>
                        </div>
                        <a href="/teams/${team._id}" class="text-blue-500 hover:text-blue-600">Görüntüle</a>
                    </div>
                `).join('');
            }
        })
        .catch(error => {
            console.error('Takımlar yüklenirken hata:', error);
            if (teamsList) {
                teamsList.innerHTML = '<p class="text-center text-red-500">Takımlar yüklenirken bir hata oluştu.</p>';
            }
        });
}

/**
 * Görevleri yükle
 */
function loadTasks() {
    const tasksList = document.getElementById('tasks-list');
    if (!tasksList) return;

    fetch('/api/tasks', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
        .then(response => response.json())
        .then(tasks => {
            if (tasks.length === 0) {
                tasksList.innerHTML = '<p class="text-center text-gray-500">Henüz bir göreviniz yok.</p>';
            } else {
                tasksList.innerHTML = tasks.slice(0, 3).map(task => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                            <h3 class="font-medium text-gray-900">${task.title}</h3>
                            <p class="text-sm text-gray-500">${task.status === 'todo' ? 'Yapılacak' : task.status === 'doing' ? 'Yapılıyor' : 'Tamamlandı'}</p>
                        </div>
                        <a href="/tasks/${task._id}" class="text-blue-500 hover:text-blue-600">Görüntüle</a>
                    </div>
                `).join('');
            }
        })
        .catch(error => {
            console.error('Görevler yüklenirken hata:', error);
            if (tasksList) {
                tasksList.innerHTML = '<p class="text-center text-red-500">Görevler yüklenirken bir hata oluştu.</p>';
            }
        });
}

/**
 * Kanban görevlerini yükle
 */
function loadKanbanTasks() {
    // API'den görevleri çek
    fetch('/api/tasks', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            // Veriyi bir array olarak ele al
            const tasks = Array.isArray(data) ? data : [];
            
            // Her durum için görevleri filtrele
            const todoTasks = tasks.filter(task => task.status === 'todo');
            const doingTasks = tasks.filter(task => task.status === 'doing');
            const doneTasks = tasks.filter(task => task.status === 'done');
            
            // Görev listelerini güncelle
            updateTaskList('todo-tasks', todoTasks);
            updateTaskList('doing-tasks', doingTasks);
            updateTaskList('done-tasks', doneTasks);
        })
        .catch(error => {
            console.error('Görevler yüklenirken hata:', error);
        });
}

/**
 * Görev listesini güncelle
 * @param {string} containerId - Görev konteyneri ID
 * @param {Array} tasks - Görevler dizisi
 */
function updateTaskList(containerId, tasks) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Fragment kullanarak DOM manipülasyonlarını azaltalım
    const fragment = document.createDocumentFragment();
    
    // Duruma göre gösterge sınıfı ve metni belirle
    const statusInfo = {
        'todo': {
            indicatorClass: 'task-indicator-todo',
            statusDisplay: ''
        },
        'doing': {
            indicatorClass: 'task-indicator-doing',
            statusDisplay: ''
        },
        'done': {
            indicatorClass: 'task-indicator-done',
            statusDisplay: ''
        }
    };
    
    const containerStatus = container.getAttribute('data-status');
    const { indicatorClass, statusDisplay } = statusInfo[containerStatus] || statusInfo.todo;
    
    if (tasks.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'text-center text-gray-500 py-2';
        emptyDiv.innerHTML = '<p>Görev bulunamadı</p>';
        fragment.appendChild(emptyDiv);
    } else {
        tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.dataset.id = task._id;
            
            taskCard.innerHTML = `
                <div class="task-indicator ${indicatorClass}"></div>
                <h3 class="task-name">${task.title}</h3>
                ${typeof statusDisplay === 'function' ? statusDisplay(task) : statusDisplay}
            `;
            
            taskCard.addEventListener('click', () => {
                window.location.href = `/tasks/${task._id}`;
            });
            
            fragment.appendChild(taskCard);
        });
    }
    
    // İçeriği bir seferde güncelle
    container.innerHTML = '';
    container.appendChild(fragment);
}

/**
 * Sürükle-bırak işlevselliğini etkinleştir
 */
function initializeSortable() {
    // SortableJS için göreve listeleri için sürükle-bırak özelliğini etkinleştir
    const taskLists = document.querySelectorAll('.task-list');
    taskLists.forEach(list => {
        new Sortable(list, {
            group: 'tasks',
            animation: 150,
            ghostClass: 'task-card-ghost',
            chosenClass: 'task-card-chosen',
            dragClass: 'task-card-drag',
            onEnd: function(evt) {
                const taskId = evt.item.getAttribute('data-id');
                const newStatus = evt.to.getAttribute('data-status');
                
                // Görevi güncelle
                if (taskId && newStatus) {
                    updateTaskStatus(taskId, newStatus);
                }
            }
        });
    });
}

/**
 * Görev durumunu güncelle
 * @param {string} taskId - Görev ID
 * @param {string} newStatus - Yeni durum
 */
function updateTaskStatus(taskId, newStatus) {
    fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Görev durumu güncellenirken bir hata oluştu');
        }
        return response.json();
    })
    .then(data => {
        // Görevleri yeniden yükle
        loadKanbanTasks();
    })
    .catch(error => {
        console.error('Hata:', error);
        showError('Görev durumu güncellenirken bir hata oluştu.');
        // Hata durumunda görevleri yeniden yükleyerek UI'ı sıfırla
        loadKanbanTasks();
    });
}

/**
 * Görev ekleme modalını göster
 * @param {string} status - Görev durumu
 */
function showAddTaskModal(status) {
    // Modal'ı göster
    const modal = document.getElementById('task-modal');
    if (!modal) return;
    
    // Form sıfırla ve durum belirle
    const form = document.getElementById('task-form');
    if (!form) return;
    
    form.reset();
    
    // Başlığı güncelle
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Yeni Görev Ekle';
    }
    
    // Durum değerini ayarla
    const taskStatus = document.getElementById('task-status');
    if (taskStatus) {
        taskStatus.value = status;
    }
    
    // Modal'ı göster
    modal.classList.remove('hidden');
    
    // Takımları yükle
    fetch('/api/teams', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(teams => {
        const teamSelect = document.getElementById('task-team');
        if (!teamSelect) return;
        
        teamSelect.innerHTML = '<option value="">Takım Seçin</option>';
        
        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team._id;
            option.textContent = team.name;
            teamSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Takımlar yüklenirken hata:', error);
    });
}

/**
 * Takım üyelerini yükle
 * @param {string} teamId - Takım ID
 */
function loadTeamMembers(teamId) {
    const assigneeSelect = document.getElementById('task-assignee');
    if (!assigneeSelect) return;
    
    // Takım ID boş ise, dropdown'ı sıfırla
    if (!teamId) {
        assigneeSelect.innerHTML = '<option value="">Atanan Kişi Seçin</option>';
        return;
    }
    
    // Önce loading state göster
    assigneeSelect.innerHTML = '<option value="">Yükleniyor...</option>';
    assigneeSelect.disabled = true;
    
    fetch(`/api/teams/${teamId}/members/details`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Takım üyeleri yüklenemedi: ${response.status}`);
            }
            return response.json();
        })
        .then(members => {
            // Dropdown'ı doldur
            assigneeSelect.innerHTML = '<option value="">Atanan Kişi Seçin</option>';
            
            if (!members || !Array.isArray(members) || members.length === 0) {
                const emptyOption = document.createElement('option');
                emptyOption.value = "";
                emptyOption.textContent = "Bu takımda üye yok";
                assigneeSelect.appendChild(emptyOption);
            } else {
                members.forEach(member => {
                    if (member && member._id && member.name) {
                        const option = document.createElement('option');
                        option.value = member._id;
                        option.textContent = member.name;
                        assigneeSelect.appendChild(option);
                    }
                });
            }
        })
        .catch(error => {
            // Hata durumunda kullanıcıya bilgi ver
            console.error('Takım üyeleri yüklenirken hata:', error);
            assigneeSelect.innerHTML = '<option value="">Üyeler yüklenemedi</option>';
        })
        .finally(() => {
            // İşlem tamamlandığında dropdown'ı etkinleştir
            assigneeSelect.disabled = false;
        });
} 