/**
 * Teams Page JavaScript
 * Takımlar sayfası için tüm JavaScript işlevleri
 */

/**
 * HTML özel karakterlerini escape et
 * @param {string} text - Escape edilecek metin
 * @return {string} Escape edilmiş metin
 */
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', function() {
    // Takımları yükle
    loadTeams();
    
    // Takım oluşturma formu
    const teamForm = document.getElementById('team-form');
    if (teamForm) {
        teamForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createTeam();
        });
    }
    
    // Örnek takım şablonlarına tıklama olayı
    const sampleTeams = document.querySelectorAll('.sample-team');
    sampleTeams.forEach(team => {
        team.addEventListener('click', function() {
            const teamName = this.getAttribute('data-name');
            const teamDesc = this.getAttribute('data-desc');
            
            document.getElementById('team-name').value = teamName;
            document.getElementById('team-description').value = teamDesc;
        });
    });
});

/**
 * Takımları listele
 */
function loadTeams() {
    const teamsContainer = document.getElementById('teams-container');
    if (!teamsContainer) return;

    teamsContainer.innerHTML = '<div class="text-center my-5"><p class="text-gray-500">Takımlar yükleniyor...</p></div>';

    // Tüm takımları getir
    fetch('/api/teams', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(teams => {
        if (!Array.isArray(teams)) {
            // Eğer dönen veri bir array değilse ve bir teams property'si varsa onu kullan
            if (teams && teams.teams && Array.isArray(teams.teams)) {
                teams = teams.teams;
            } else {
                teams = [];
            }
        }
        
        // Kullanıcının üye olduğu takımları işaretle
        if (teams.length > 0) {
            // Kullanıcının takımlarını getir
            fetch('/api/users/teams', {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                return []; // Hata olursa boş dizi dön
            })
            .then(userTeams => {
                if (Array.isArray(userTeams)) {
                    // Kullanıcının üye olduğu takımları işaretle
                    const userTeamIds = userTeams.map(team => team._id);
                    teams.forEach(team => {
                        team.isUserMember = userTeamIds.includes(team._id);
                    });
                }
                displayTeams(teams);
            })
            .catch(() => {
                // Kullanıcı takımları alınamazsa, işaretlemeden göster
                displayTeams(teams);
            });
        } else {
            displayTeams(teams);
        }
    })
    .catch(error => {
        teamsContainer.innerHTML = `
            <div class="text-center my-5">
                <p class="text-red-500">Takımlar yüklenirken bir hata oluştu.</p>
                <button id="retry-load-teams" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Tekrar Dene
                </button>
            </div>
        `;
        
        // Tekrar deneme butonu
        const retryButton = document.getElementById('retry-load-teams');
        if (retryButton) {
            retryButton.addEventListener('click', loadTeams);
        }
    });
}

/**
 * Takımları görüntüle
 * @param {Array} teams - Takımlar dizisi
 */
function displayTeams(teams) {
    const teamsContainer = document.getElementById('teams-container');
    const isAdmin = document.body.getAttribute('data-user-role') === 'admin';
    
    if (!teamsContainer) return;
    
    if (!Array.isArray(teams) || teams.length === 0) {
        teamsContainer.innerHTML = `
            <div class="text-center my-5">
                <p class="text-gray-500">Henüz takım bulunmuyor.</p>
                ${isAdmin ? `
                <button id="create-sample-team" class="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    Örnek Takım Oluştur
                </button>` : ''}
            </div>
        `;
        
        // Örnek takım oluşturma butonu
        const sampleTeamButton = document.getElementById('create-sample-team');
        if (sampleTeamButton) {
            sampleTeamButton.addEventListener('click', createSampleTeam);
        }
        
        return;
    }
    
    let teamsHtml = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-4">
    `;
    
    teams.forEach(team => {
        const memberCount = team.members ? team.members.length : 0;
        const isUserMember = team.isUserMember;
        
        teamsHtml += `
            <div class="bg-white rounded-lg shadow-md overflow-hidden border ${isUserMember ? 'border-blue-400' : 'border-gray-200'}">
                <div class="p-5">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-gray-800 truncate">
                            ${escapeHtml(team.name)}
                        </h3>
                        ${isUserMember ? '<span class="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Üyesi olduğunuz takım</span>' : ''}
                    </div>
                    <p class="text-gray-600 mt-2 text-sm">
                        ${escapeHtml(team.description || 'Açıklama bulunmuyor.')}
                    </p>
                    <div class="mt-4 flex items-center text-sm text-gray-500">
                        <i class="fas fa-users mr-2"></i>
                        <span>${memberCount} Üye</span>
                    </div>
                    <div class="mt-4 flex justify-end">
                        <a href="/teams/${team._id}" class="text-blue-500 hover:text-blue-700 font-medium">
                            Detaylar <i class="fas fa-arrow-right ml-1"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    });
    
    teamsHtml += `</div>`;
    teamsContainer.innerHTML = teamsHtml;
}

/**
 * Takım oluştur
 */
// Check if the variable is already defined to prevent redeclaration errors
var isCreatingTeam = (typeof isCreatingTeam !== 'undefined') ? isCreatingTeam : false;

function createTeam() {
    // Eğer zaten bir oluşturma işlemi devam ediyorsa, çift gönderimi engelle
    if (isCreatingTeam) {
        return;
    }

    const nameInput = document.getElementById('team-name');
    const descriptionInput = document.getElementById('team-description');
    const avatarInput = document.getElementById('team-avatar');
    const submitButton = document.querySelector('#team-form button[type="submit"]');
    
    if (!nameInput.value.trim()) {
        alert('Takım adı boş olamaz!');
        return;
    }
    
    // Oluşturma işlemini başlat
    isCreatingTeam = true;
    
    // Butonu devre dışı bırak
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Oluşturuluyor...';
    }
    
    const teamData = {
        name: nameInput.value.trim(),
        description: descriptionInput.value.trim(),
        avatar: avatarInput.value.trim()
    };
    
    fetch('/api/teams', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(teamData),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Takım oluşturulurken bir hata oluştu');
        }
        return response.json();
    })
    .then(data => {
        alert('Takım başarıyla oluşturuldu!');
        
        // Formu temizle
        nameInput.value = '';
        descriptionInput.value = '';
        avatarInput.value = '';
        
        // Sayfa yenile
        window.location.reload();
    })
    .catch(() => {
        alert('Takım oluşturulurken bir hata oluştu.');
        
        // Hata durumunda oluşturma durumunu sıfırla ve butonu tekrar etkinleştir
        isCreatingTeam = false;
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Takım Oluştur';
        }
    });
}

/**
 * Takım sil
 * @param {string} teamId - Silinecek takımın ID'si
 */
function deleteTeam(teamId) {
    fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Takım silinirken bir hata oluştu');
        }
        return response.json();
    })
    .then(data => {
        alert('Takım başarıyla silindi!');
        loadTeams(); // Takımları yeniden yükle
    })
    .catch(() => {
        alert('Takım silinirken bir hata oluştu.');
    });
} 