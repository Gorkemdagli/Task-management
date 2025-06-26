/**
 * Tasks Page JavaScript
 * Görevler sayfası için tüm JavaScript işlevleri
 */

// Global değişkenler
var taskTeams = []; // 'teams' değişkeninden çakışmaları önlemek için yeniden adlandırıldı
var taskItems = []; // 'tasks' değişkeninden çakışmaları önlemek için yeniden adlandırıldı
var currentFilters = {
    team: '',
    status: '',
    priority: ''
};
var taskUserRole = document.body.getAttribute('data-user-role'); // userRole -> taskUserRole
var userId = document.body.getAttribute('data-user-id');
var isSubmitting = false; // Form submit işlemi için flag

document.addEventListener('DOMContentLoaded', function() {
    // Sayfa yüklendiğinde form gönderim durumunu kesinlikle sıfırla
    isSubmitting = false;
    
    // Sayfa görünürlük değiştiğinde de sıfırla (kullanıcı sekme değiştirip geri geldiğinde)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            isSubmitting = false;
        }
    });
    
    // Tarayıcı yükleme performansı için önemli işlemleri hemen başlat
    // Diğerlerini zamanlayalım
    
    // Kullanıcı rolünü kontrol et
    if (taskUserRole === 'admin') {
        // Önemli UI işlemlerini hemen başlat, diğerlerini geciktirelim
        initializeTaskForm();
        
        // Şablonları daha sonra yükle (kritik olmayan UI öğesi)
        setTimeout(() => {
            setupSampleTasks();
        }, 100);
    }
    
    // Filtre dropdown'larını hemen ayarla (kullanıcı etkileşimi için kritik)
    setupFilters();
    
    try {
        // Takımları asenkron olarak yükle
        const loadTeamsPromise = loadTeams();
        
        // Takımları yüklerken hata olsa bile görev yükleme işlemine devam et
        loadTeamsPromise.then(function() {
            // Takımlar başarıyla yüklendiğinde dropdown'ları doldur
            const filterTeam = document.getElementById('filter-team');
            if (filterTeam) {
                fillTeamDropdown(filterTeam);
            }
        }).catch(function(err) {
            // Takım yükleme hatası durumunda dropdown'ları uygun şekilde güncelle
            const filterTeam = document.getElementById('filter-team');
            if (filterTeam) {
                filterTeam.innerHTML = '<option value="">Takımlar yüklenemedi</option>';
            }
        });
        
        // Görevleri bağımsız olarak yükle, takımlar yüklenmese bile görevler yüklenebilir
        loadTasks();
    } catch (error) {
        // En dıştaki try-catch, beklenmeyen hatalar için
        console.error("Sayfa yükleme hatası:", error);
    }
});

/**
 * Task formunu başlat
 */
function initializeTaskForm() {
    const taskForm = document.getElementById('task-form');
    const taskTeamSelect = document.getElementById('task-team');
    
    // Görünürlük ile ilgili öğeler
    const taskTitle = document.getElementById('task-title');
    const taskDescription = document.getElementById('task-description');
    const taskStatus = document.getElementById('task-status');
    const taskPriority = document.getElementById('task-priority');
    const taskDueDate = document.getElementById('task-due-date');
    const taskAssignee = document.getElementById('task-assignee');
    
    // Takım değiştiğinde atanabilecek kullanıcıları güncelle
    if (taskTeamSelect) {
        taskTeamSelect.addEventListener('change', handleTeamSelectChange);
    }
    
    // Submit butonu için ek koruma
    const submitButton = document.getElementById('task-submit-btn');
    if (submitButton) {
        submitButton.addEventListener('click', function(e) {
            // Eğer zaten işlem yapılıyorsa butona tıklamayı engelle
            if (isSubmitting) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
    }
    
    // Form gönderildiğinde
    if (taskForm) {
        // Mevcut kullanıcı ID'sini form container'a ekleyelim
        const currentUserId = document.body.getAttribute('data-user-id');
        if (currentUserId) {
            taskForm.setAttribute('data-user-id', currentUserId);
        }
        
        taskForm.addEventListener('submit', handleTaskFormSubmit);
    }
    
    // Takımları yükle ve dolaylı olarak selectbox'ları doldur
    loadTeams().then(() => {
        // Eğer takım select box'ı dolduysa ve bir değeri varsa, o takımın üyelerini yükle
        if (taskTeamSelect && taskTeamSelect.value) {
            loadTeamMembers(taskTeamSelect.value);
        }
    });
}

/**
 * Task form submit handler - event listener callback işlevi
 * @param {Event} e - Form submit event'i
 */
function handleTaskFormSubmit(e) {
    e.preventDefault();
    // Eğer zaten form gönderimi yapılıyorsa, işlemi engelle
    if (isSubmitting) return;
    createTask();
}

/**
 * Takım seçimi değişikliği için event handler
 */
function handleTeamSelectChange() {
    loadTeamMembers(this.value);
}

/**
 * Görev şablonları için event listenerlar ekle
 */
function setupSampleTasks() {
    const sampleTasks = document.querySelectorAll('.sample-task');
    sampleTasks.forEach(task => {
        task.addEventListener('click', function() {
            // Şablon verileri
            const title = this.getAttribute('data-title');
            const description = this.getAttribute('data-desc');
            const priority = this.getAttribute('data-priority');
            const status = this.getAttribute('data-status');
            
            // Form alanlarını doldur
            document.getElementById('task-title').value = title;
            document.getElementById('task-description').value = description;
            document.getElementById('task-priority').value = priority;
            document.getElementById('task-status').value = status;
            
            // Forma odaklan
            document.getElementById('task-title').focus();
            
            // Sayfayı forma kaydır
            document.getElementById('task-form').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

/**
 * Filtre dropdownlarını ve olay dinleyicilerini ayarla
 */
function setupFilters() {
    // Takım filtresi
    const filterTeam = document.getElementById('filter-team');
    if (filterTeam) {
        fillTeamDropdown(filterTeam);
        filterTeam.addEventListener('change', function() {
            currentFilters.team = this.value;
            // Takım değiştiğinde, görevleri sunucudan tekrar yükle
            loadTasks();
        });
    }
    
    // Durum filtresi
    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) {
        filterStatus.addEventListener('change', function() {
            currentFilters.status = this.value;
            applyFilters();
        });
    }
    
    // Öncelik filtresi
    const filterPriority = document.getElementById('filter-priority');
    if (filterPriority) {
        filterPriority.addEventListener('change', function() {
            currentFilters.priority = this.value;
            applyFilters();
        });
    }
}

/**
 * Takımları listele ve dropdown'ları doldur
 * @returns {Promise} Takımların yüklendiği promise
 */
async function loadTeams() {
    try {
        const filterTeam = document.getElementById('filter-team');
        if (filterTeam) {
            filterTeam.innerHTML = '<option value="">Takımlar yükleniyor...</option>';
            filterTeam.disabled = true;
        }
        
        // Takımları yükle
        const response = await fetch('/api/teams', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Takımlar yüklenemedi: ' + response.status);
        }
        
        // JSON'a dönüştür
        const loadedTeams = await response.json();
        
        // Global değişkenimizi güncelle
        taskTeams = Array.isArray(loadedTeams) ? loadedTeams : [];
        
        // Admin ise görev oluşturma formundaki takım dropdown'ını doldur
        if (taskUserRole === 'admin') {
            const taskTeamSelect = document.getElementById('task-team');
            if (taskTeamSelect) {
                fillTeamDropdown(taskTeamSelect);
            }
        }
        
        // Filtre dropdown'u etkinleştir
        if (filterTeam) {
            filterTeam.disabled = false;
        }
        
        return taskTeams;
    } catch (error) {
        // Hata durumunda dropdown'ları düzelt
        const filterTeam = document.getElementById('filter-team');
        if (filterTeam) {
            filterTeam.innerHTML = '<option value="">Takımlar yüklenemedi</option>';
            filterTeam.disabled = false;
        }
        
        const taskTeamSelect = document.getElementById('task-team');
        if (taskTeamSelect) {
            taskTeamSelect.innerHTML = '<option value="">Takımlar yüklenemedi</option>';
            taskTeamSelect.disabled = false;
        }
        
        // Boş dizi döndür ama hata fırlat
        return Promise.reject(error);
    }
}

/**
 * Belirtilen takıma ait üyeleri getir ve "atanan kişi" dropdown'ını doldur
 * @param {string} teamId - Takım ID'si
 */
async function loadTeamMembers(teamId) {
    const assigneeSelect = document.getElementById('task-assignee');
    if (!assigneeSelect) return;
    
    // Takım ID boş ise, dropdown'ı sıfırla
    if (!teamId) {
        assigneeSelect.innerHTML = '<option value="">Atanan Kişi Seçin</option>';
        return;
    }
    
    try {
        // Önce loading state göster
        assigneeSelect.innerHTML = '<option value="">Yükleniyor...</option>';
        assigneeSelect.disabled = true;
        
        // Takım üyelerinin detaylarını getir
        const response = await fetch(`/api/teams/${teamId}/members/details`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`Takım üyeleri yüklenemedi: ${response.status}`);
        }
        
        const members = await response.json();
        
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
    } catch (error) {
        // Hata durumunda kullanıcıya bilgi ver
        assigneeSelect.innerHTML = '<option value="">Üyeler yüklenemedi</option>';
    } finally {
        // İşlem tamamlandığında dropdown'ı etkinleştir
        assigneeSelect.disabled = false;
    }
}

/**
 * Takım dropdown'ını doldur
 * @param {HTMLSelectElement} selectElement - Doldurulacak select elementi
 */
function fillTeamDropdown(selectElement) {
    if (!selectElement) {
        return;
    }
    
    // Default/boş seçenek
    selectElement.innerHTML = '<option value="">Takım Seçin</option>';
    
    // Takımlar yoksa uyarı göster
    if (!taskTeams || !Array.isArray(taskTeams) || taskTeams.length === 0) {
        const errorOption = document.createElement('option');
        errorOption.value = "";
        errorOption.textContent = "Henüz takım bulunmuyor";
        errorOption.disabled = true;
        selectElement.appendChild(errorOption);
        return;
    }
    
    // Takımları ekle
    try {
        taskTeams.forEach(team => {
            if (team && team._id && team.name) {
                const option = document.createElement('option');
                option.value = team._id;
                option.textContent = team.name;
                selectElement.appendChild(option);
            }
        });
        
        // Filtre için mevcut değeri koruyalım
        if (selectElement.id === 'filter-team' && currentFilters.team) {
            selectElement.value = currentFilters.team;
        }
    } catch (error) {
        // Herhangi bir hata durumunda hata mesajı göster
        selectElement.innerHTML = '<option value="">Takım listesi yüklenemedi</option>';
    }
}

/**
 * Görevleri API'den yükle ve göster
 */
async function loadTasks() {
    const tasksContainer = document.getElementById('tasks-container');
    if (!tasksContainer) return;
    
    // Yeni veriler gelene kadar mevcut içeriği koruyalım, sadece yükleme göstergesi ekleyelim
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    loadingIndicator.innerHTML = 'Yükleniyor...';
    document.body.appendChild(loadingIndicator);
    
    try {
        // URL parametreleri oluştur
        let url = '/api/tasks';
        
        // Eğer takım filtresi varsa, URL'e ekle
        if (currentFilters.team) {
            url += `?teamId=${currentFilters.team}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Görevler yüklenirken bir hata oluştu');
        }
        
        const loadedTasks = await response.json();
        taskItems = Array.isArray(loadedTasks) ? loadedTasks : [];
        
        // Filtreleri uygula
        applyFilters();
        
        return taskItems;
    } catch (error) {
        console.error('Görevleri yükleme hatası:', error);
        tasksContainer.innerHTML = `<div class="text-center text-red-500"><p>Görevler yüklenirken bir hata oluştu</p></div>`;
        return [];
    } finally {
        // Yükleme göstergesini kaldır
        const indicator = document.querySelector('.loading-indicator');
        if (indicator) indicator.remove();
    }
}

/**
 * Aktif filtrelere göre görevleri filtrele ve görüntüle
 */
function applyFilters() {
    let filteredTasks = [...taskItems];
    
    // Takım filtresi artık sunucu tarafında uygulandığı için burada yeniden uygulamıyoruz
    
    // Durum filtresi
    if (currentFilters.status) {
        filteredTasks = filteredTasks.filter(task => task.status === currentFilters.status);
    }
    
    // Öncelik filtresi
    if (currentFilters.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === currentFilters.priority);
    }
    
    // Görevleri görüntüle
    displayTasks(filteredTasks);
}

/**
 * Görevleri HTML olarak görüntüle
 * @param {Array} tasksToDisplay - Görüntülenecek görevler dizisi
 */
function displayTasks(tasksToDisplay) {
    const tasksContainer = document.getElementById('tasks-container');
    if (!tasksContainer) return;
    
    // Performans için: Fragment kullanarak DOM manipülasyonlarını azaltalım
    const fragment = document.createDocumentFragment();
    
    if (tasksToDisplay.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'text-center text-gray-500 py-4';
        emptyDiv.innerHTML = '<p>Görev bulunamadı</p>';
        fragment.appendChild(emptyDiv);
        tasksContainer.innerHTML = '';
        tasksContainer.appendChild(fragment);
        return;
    }
    
    // Öncelikle görevleri statusa göre grupla
    const groupedTasks = {
        todo: tasksToDisplay.filter(task => task.status === 'todo'),
        doing: tasksToDisplay.filter(task => task.status === 'doing'),
        done: tasksToDisplay.filter(task => task.status === 'done')
    };
    
    // Status gruplarını ekle
    const statusTitles = {
        todo: 'Yapılacak',
        doing: 'Yapılıyor',
        done: 'Tamamlandı'
    };
    
    for (const status in groupedTasks) {
        if (groupedTasks[status].length > 0) {
            const statusGroup = document.createElement('div');
            statusGroup.className = 'mb-6';
            
            const statusHeader = document.createElement('h3');
            statusHeader.className = 'text-xl font-medium text-gray-800 mb-3';
            statusHeader.textContent = statusTitles[status];
            statusGroup.appendChild(statusHeader);
            
            const tasksDiv = document.createElement('div');
            tasksDiv.className = 'space-y-3';
            
            // Grupta bulunan görevleri ekle
            groupedTasks[status].forEach(task => {
                // Takım adını bul
                const team = taskTeams.find(t => t._id === task.team);
                const teamName = team ? team.name : 'Bilinmeyen Takım';
                
                // Öncelik için sınıf
                let priorityClass = 'bg-gray-100 text-gray-800';
                if (task.priority === 'high') {
                    priorityClass = 'bg-red-100 text-red-800';
                } else if (task.priority === 'medium') {
                    priorityClass = 'bg-orange-100 text-orange-800';
                } else if (task.priority === 'low') {
                    priorityClass = 'bg-green-100 text-green-800';
                }
                
                // Durum için sınıf
                let statusClass = 'bg-gray-100 text-gray-800';
                if (task.status === 'todo') {
                    statusClass = 'bg-blue-100 text-blue-800';
                } else if (task.status === 'doing') {
                    statusClass = 'bg-yellow-100 text-yellow-800';
                } else if (task.status === 'done') {
                    statusClass = 'bg-green-100 text-green-800';
                }
                
                // Son tarihi formatla
                let dueDateStr = '';
                if (task.dueDate) {
                    const dueDate = new Date(task.dueDate);
                    dueDateStr = dueDate.toLocaleDateString('tr-TR');
                    
                    // Son tarihi geçmiş mi kontrol et
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (dueDate < today && task.status !== 'done') {
                        dueDateStr = `<span class="text-red-600 font-medium">${dueDateStr} (Gecikmiş)</span>`;
                    }
                }
                
                // Atanan kişileri kontrol et
                let assigneeStr = '';
                if (task.assignees && task.assignees.length > 0) {
                    // Atanan kişilerin adlarını göster (eğer populatelenmiş veri varsa)
                    if (typeof task.assignees[0] === 'object') {
                        assigneeStr = task.assignees.map(a => a.name).join(', ');
                    } else {
                        // Sadece ID varsa, kullanıcı bilgileri henüz yüklenmemiş
                        assigneeStr = `${task.assignees.length} kişi atanmış`;
                    }
                }
                
                const taskCard = document.createElement('div');
                taskCard.className = 'bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition p-4';
                taskCard.dataset.id = task._id;
                taskCard.style.cursor = 'pointer';
                
                // Karta tıklama olayı ekle
                taskCard.addEventListener('click', function(e) {
                    if (!e.target.closest('button')) {
                        window.location.href = `/tasks/${task._id}`;
                    }
                });
                
                taskCard.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="text-lg font-medium text-gray-900">${task.title}</h4>
                        <div class="flex space-x-2">
                            <span class="px-2 py-1 rounded text-xs font-medium ${priorityClass}">
                                ${task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                            </span>
                            <span class="px-2 py-1 rounded text-xs font-medium ${statusClass}">
                                ${task.status === 'todo' ? 'Yapılacak' : task.status === 'doing' ? 'Yapılıyor' : 'Tamamlandı'}
                            </span>
                        </div>
                    </div>
                    
                    <p class="text-gray-600 mb-3">${task.description}</p>
                    
                    <div class="flex flex-wrap justify-between items-center text-sm">
                        <div class="space-y-1">
                            <div class="text-gray-600">
                                <span class="font-medium">Takım:</span> ${teamName}
                            </div>
                            ${assigneeStr ? `
                            <div class="text-gray-600">
                                <span class="font-medium">Atanan:</span> ${assigneeStr}
                            </div>` : ''}
                            ${dueDateStr ? `
                            <div class="text-gray-600">
                                <span class="font-medium">Son Tarih:</span> ${dueDateStr}
                            </div>` : ''}
                        </div>
                        
                        <div class="flex space-x-2 mt-2">
                            ${task.status !== 'done' ? `
                            <button class="update-status-btn px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700" data-id="${task._id}" data-status="done">
                                Tamamlandı
                            </button>` : ''}
                            
                            ${task.status === 'todo' ? `
                            <button class="update-status-btn px-2 py-1 text-xs font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700" data-id="${task._id}" data-status="doing">
                                Yapılıyor
                            </button>` : ''}
                            
                            ${task.status === 'doing' ? `
                            <button class="update-status-btn px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700" data-id="${task._id}" data-status="todo">
                                Yapılacak
                            </button>` : ''}
                            
                            ${taskUserRole === 'admin' ? `
                            <button class="edit-task-btn px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700" data-id="${task._id}">
                                Düzenle
                            </button>
                            <button class="delete-task-btn px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700" data-id="${task._id}">
                                Sil
                            </button>` : ''}
                        </div>
                    </div>
                `;
                
                tasksDiv.appendChild(taskCard);
            });
            
            statusGroup.appendChild(tasksDiv);
            fragment.appendChild(statusGroup);
        }
    }
    
    // Tüm içeriği bir seferde değiştir (performans için önemli)
    tasksContainer.innerHTML = '';
    tasksContainer.appendChild(fragment);
    
    // Durum butonu işlevselliği ekle
    tasksContainer.querySelectorAll('.update-status-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Kartın tıklama olayını engelle
            const taskId = this.getAttribute('data-id');
            const newStatus = this.getAttribute('data-status');
            updateTaskStatus(taskId, newStatus);
        });
    });
    
    // Admin butonları için event listener'lar
    if (taskUserRole === 'admin') {
        // Düzenleme butonları
        tasksContainer.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const taskId = this.getAttribute('data-id');
                editTask(taskId);
            });
        });
        
        // Silme butonları
        tasksContainer.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const taskId = this.getAttribute('data-id');
                if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
                    deleteTask(taskId);
                }
            });
        });
    }
}

/**
 * Görev silme
 * @param {string} taskId - Görev ID'si
 */
async function deleteTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Görev silinirken bir hata oluştu');
        }
        
        // Lokalde görevleri de güncelle
        taskItems = taskItems.filter(task => task._id !== taskId);
        
        // UI'ı güncelle
        applyFilters();
        
        // Bildirim
        showSuccess('Görev başarıyla silindi');
    } catch (error) {
        console.error('Görev silme hatası:', error);
        showError('Görev silinirken bir hata oluştu');
    }
}

/**
 * Görev durumunu güncelle
 * @param {string} taskId - Görev ID'si
 * @param {string} newStatus - Yeni durum ('todo', 'doing', 'done')
 */
async function updateTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ status: newStatus }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Görev durumu güncellenirken bir hata oluştu');
        }
        
        // Güncellenen veriyi al
        const updatedTask = await response.json();
        
        // Lokal görev listesini güncelle
        const taskIndex = taskItems.findIndex(t => t._id === taskId);
        if (taskIndex !== -1) {
            taskItems[taskIndex].status = newStatus;
        }
        
        // UI'ı güncelle
        applyFilters();
    } catch (error) {
        console.error('Görev durumu güncelleme hatası:', error);
        showError('Görev durumu güncellenirken bir hata oluştu');
    }
}

/**
 * Yeni görev oluştur
 */
async function createTask() {
    // Çift gönderim kontrolü - eğer zaten işlem yapılıyorsa çık
    if (isSubmitting) {
        return;
    }
    
    // Form verilerini al
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const priority = document.getElementById('task-priority').value;
    const status = document.getElementById('task-status').value;
    const teamId = document.getElementById('task-team').value;
    const assigneeSelect = document.getElementById('task-assignee');
    const dueDateInput = document.getElementById('task-due-date');
    const submitButton = document.getElementById('task-submit-btn');
    const taskForm = document.getElementById('task-form');
    
    // İşlem başladığını işaretle
    isSubmitting = true;
    
    // Buton kontrolü - öncelikle devre dışı bırak (çift gönderimi engelle)
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = 'Görev Oluşturuluyor...';
        submitButton.classList.add('opacity-75', 'cursor-not-allowed');
    }
    
    // Gerekli alanları kontrol et
    if (!title || !teamId) {
        showWarning('Başlık ve takım zorunludur');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = 'Görev Oluştur';
            submitButton.classList.remove('opacity-75', 'cursor-not-allowed');
        }
        // İşlem başarısız olduğu için bayrağı sıfırla
        isSubmitting = false;
        return;
    }
    
    // Görev verilerini hazırla
    const taskData = {
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        teamId
    };
    
    // Seçilen kullanıcıyı assignees dizisine ekle
    if (assigneeSelect && assigneeSelect.value) {
        // Atanan kişiyi MongoDB'ye kaydetmek için assignees dizisi olarak gönderiyoruz
        taskData.assignees = [assigneeSelect.value];
        
        // Geriye dönük uyumluluk için assigneeId alanını da ekleyelim
        // Hem assignees hem assigneeId ile kullanıcı ID'sini gönderiyoruz
        taskData.assigneeId = assigneeSelect.value;
        
        console.log("Görev atanan kullanıcı ID'si:", assigneeSelect.value);
    } else {
        // Eğer kullanıcı seçilmediyse, mevcut kullanıcıyı ekleyelim
        const currentUserId = taskForm ? taskForm.getAttribute('data-user-id') : document.body.getAttribute('data-user-id');
        if (currentUserId) {
            taskData.assignees = [currentUserId];
            // Geriye dönük uyumluluk için
            taskData.assigneeId = currentUserId;
            console.log("Varsayılan olarak mevcut kullanıcı atandı:", currentUserId);
        } else {
            console.warn("Kullanıcı ID'si bulunamadı, görev atama yapılamıyor");
        }
    }
    
    if (dueDateInput && dueDateInput.value) {
        taskData.dueDate = dueDateInput.value;
    }
    
    try {
        // Duplike istek kontrolü için timestamp ekleme
        taskData._requestTime = Date.now();
        
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Request-ID': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Unique istek ID'si
            },
            body: JSON.stringify(taskData),
            credentials: 'include'
        });
        
        if (!response.ok && response.status !== 200) {
            throw new Error('Görev oluşturulurken bir hata oluştu.');
        }
        
        const responseData = await response.json();
        
        // Duplike görev kontrolü - sunucu duplike görev tespit ettiyse
        if (responseData.isDuplicate) {
            showWarning('Bu görev zaten oluşturuldu.');
            
            setTimeout(() => {
                window.location.reload();
            }, 500);
            return;
        }
        
        // Yeni görev sunucudan alındı
        const newTask = responseData;
        
        // Başarı mesajını göster
        showSuccess('Görev başarıyla oluşturuldu');
        
        // Kısa bir gecikme ile sayfa yenile (toast mesajının görünmesi için)
        setTimeout(() => {
            window.location.reload();
        }, 500);
    } catch (error) {
        console.error('Görev oluşturma hatası:', error);
        showError(error.message || 'Görev oluşturulurken bir hata oluştu');
    } finally {
        // İşlem tamamlandığında butonu tekrar etkinleştir
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = 'Görev Oluştur';
            submitButton.classList.remove('opacity-75', 'cursor-not-allowed');
        }
        
        // Form gönderim bayrağını sıfırla
        isSubmitting = false;
        
        // Güvenlik için 5 saniye sonra bayrağı kesinlikle sıfırla (network timeout durumları için)
        setTimeout(() => {
            isSubmitting = false;
        }, 5000);
    }
}

/**
 * Görev formunu temizle
 */
function resetTaskForm() {
    const titleInput = document.getElementById('task-title');
    const descriptionInput = document.getElementById('task-description');
    const prioritySelect = document.getElementById('task-priority');
    const statusSelect = document.getElementById('task-status');
    const assigneeSelect = document.getElementById('task-assignee');
    const dueDateInput = document.getElementById('task-due-date');
    
    if (titleInput) titleInput.value = '';
    if (descriptionInput) descriptionInput.value = '';
    if (prioritySelect) prioritySelect.value = 'medium';
    if (statusSelect) statusSelect.value = 'todo';
    if (assigneeSelect) assigneeSelect.value = '';
    if (dueDateInput) dueDateInput.value = '';
}

/**
 * Görevi düzenleme modalını aç
 * @param {string} taskId - Görev ID'si
 */
function editTask(taskId) {
    // Şu an için mock fonksiyon
    showInfo(`Görev düzenleme özelliği yakında eklenecek! (ID: ${taskId})`);
} 