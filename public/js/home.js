/**
 * Home Page JavaScript
 * Ana sayfa için tüm JavaScript işlevleri
 */

document.addEventListener('DOMContentLoaded', function() {
    // Takımları yükle
    loadTeams();
    
    // Görevleri yükle
    loadTasks();
    
    // Kanban görevlerini yükle
    loadKanbanTasks();
    
    // Sürükle-bırak işlevselliğini etkinleştir
    initializeSortable();
    
    // Görev ekle butonları event listener
    const addTodoTaskBtn = document.getElementById('add-todo-task');
    if (addTodoTaskBtn) {
        addTodoTaskBtn.addEventListener('click', function() {
            // Görev ekleme modal'ını göster
            showAddTaskModal('todo');
        });
    }
    
    const addDoingTaskBtn = document.getElementById('add-doing-task');
    if (addDoingTaskBtn) {
        addDoingTaskBtn.addEventListener('click', function() {
            showAddTaskModal('doing');
        });
    }
    
    const addDoneTaskBtn = document.getElementById('add-done-task');
    if (addDoneTaskBtn) {
        addDoneTaskBtn.addEventListener('click', function() {
            showAddTaskModal('done');
        });
    }
    
    // Modalı kapat butonlarına event listener ekle
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            document.getElementById('task-modal').classList.add('hidden');
            document.getElementById('task-form').reset();
        });
    }
    
    const cancelTaskBtn = document.getElementById('cancel-task');
    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', function() {
            document.getElementById('task-modal').classList.add('hidden');
            document.getElementById('task-form').reset();
        });
    }
    
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
                dueDate: formData.get('dueDate')
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
                    document.getElementById('task-modal').classList.add('hidden');
                    document.getElementById('task-form').reset();
                    loadKanbanTasks();
                })
                .catch(error => {
                    console.error('Hata:', error);
                    alert('Görev güncellenirken bir hata oluştu.');
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
                    document.getElementById('task-modal').classList.add('hidden');
                    document.getElementById('task-form').reset();
                    loadKanbanTasks();
                })
                .catch(error => {
                    console.error('Hata:', error);
                    alert('Görev eklenirken bir hata oluştu.');
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
                            <p class="text-sm text-gray-500">${task.status}</p>
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
    
    let html = '';
    
    tasks.forEach(task => {
        let indicatorClass = '';
        let statusDisplay = '';
        
        // Duruma göre gösterge sınıfı ve metni belirle
        switch(container.getAttribute('data-status')) {
            case 'todo':
                indicatorClass = 'task-indicator-todo';
                statusDisplay = '';
                break;
            case 'doing':
                indicatorClass = 'task-indicator-doing';
                statusDisplay = `<div class="text-sm text-gray-600">${task.completedSubtasks || 0}/${task.totalSubtasks || 0}</div>`;
                break;
            case 'done':
                indicatorClass = 'task-indicator-done';
                statusDisplay = '<div class="text-sm text-gray-600">✔ Tamamlandı</div>';
                break;
        }
        
        html += `
            <div class="task-card" data-id="${task._id}">
                <div class="task-indicator ${indicatorClass}"></div>
                <h3 class="task-name">${task.title}</h3>
                ${statusDisplay}
                <div class="task-meta">
                    <div class="task-stats">
                        <span>👁 ${task.viewCount || 0}</span>
                        <span>💬 ${task.commentCount || 0}</span>
                    </div>
                    <div class="task-assignees">
                        ${task.assignees && task.assignees.map(assignee => 
                            `<img class="task-assignee-avatar" src="${assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name)}`}" alt="${assignee.name}">`
                        ).join('') || ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Görev kartlarına tıklama olayı ekle
    container.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('click', function() {
            const taskId = this.getAttribute('data-id');
            // Görev detay sayfasına yönlendir
            window.location.href = `/tasks/${taskId}`;
        });
    });
}

/**
 * Sürükle-bırak işlevselliğini başlat
 */
function initializeSortable() {
    const taskLists = document.querySelectorAll('.task-list');
    
    taskLists.forEach(list => {
        new Sortable(list, {
            group: 'tasks',
            animation: 150,
            ghostClass: 'task-ghost',
            chosenClass: 'task-chosen',
            dragClass: 'task-drag',
            onEnd: function(evt) {
                const taskId = evt.item.getAttribute('data-id');
                const newStatus = evt.to.getAttribute('data-status');
                
                // Görevi güncelle
                updateTaskStatus(taskId, newStatus);
            }
        });
    });
}

/**
 * Görev durumunu güncelle
 * @param {string} taskId - Görev ID'si
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
        // console.log('Görev durumu güncellendi:', data);
    })
    .catch(error => {
        alert('Görev durumu güncellenirken bir hata oluştu: ' + error.message);
    });
}

/**
 * Görev ekleme modalını göster
 * @param {string} status - Görev durumu (todo, doing, done)
 */
function showAddTaskModal(status) {
    // Modal'ı göster
    const modal = document.getElementById('task-modal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    // Form elemanlarını doldur
    const statusInput = document.querySelector('input[name="status"]');
    if (statusInput) statusInput.value = status;
    
    // Takım seçme öğesini doldur
    fetch('/api/users/teams', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
        .then(response => response.json())
        .then(teams => {
            const teamSelect = document.getElementById('team-select');
            if (!teamSelect) return;
            
            teamSelect.innerHTML = '<option value="">Takım Seçin (İsteğe Bağlı)</option>';
            teams.forEach(team => {
                teamSelect.innerHTML += `<option value="${team._id}">${team.name}</option>`;
            });
        });
} 