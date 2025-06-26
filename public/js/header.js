/**
 * Header JavaScript
 * Header bileşeni için tüm JavaScript işlevleri
 */

document.addEventListener('DOMContentLoaded', function() {
    const userDropdownBtn = document.getElementById('userDropdownBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    
    if (userDropdownBtn && userDropdownMenu) {
        // Toggle dropdown on button click
        userDropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdownMenu.classList.toggle('hidden');
            userDropdownMenu.classList.toggle('block');
            
            // Hide admin dropdown if open
            const adminDropdownMenu = document.getElementById('adminDropdownMenu');
            if (adminDropdownMenu && !adminDropdownMenu.classList.contains('hidden')) {
                adminDropdownMenu.classList.add('hidden');
                adminDropdownMenu.classList.remove('block');
            }
        });

        // Prevent dropdown from closing when clicking on its menu items
        userDropdownMenu.addEventListener('click', function(e) {
            // Yalnızca form submit işlemlerinin doğal yoldan çalışmasına izin ver
            if (!e.target.closest('form')) {
                e.stopPropagation();
            }
        });
    }
    
    // Admin dropdown toggle (if exists)
    const adminDropdownBtn = document.getElementById('adminDropdownBtn');
    const adminDropdownMenu = document.getElementById('adminDropdownMenu');
    
    if (adminDropdownBtn && adminDropdownMenu) {
        adminDropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            adminDropdownMenu.classList.toggle('hidden');
            adminDropdownMenu.classList.toggle('block');
            
            // Hide user dropdown if open
            if (userDropdownMenu && !userDropdownMenu.classList.contains('hidden')) {
                userDropdownMenu.classList.add('hidden');
                userDropdownMenu.classList.remove('block');
            }
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (userDropdownBtn && userDropdownMenu) {
            if (!userDropdownBtn.contains(e.target)) {
                userDropdownMenu.classList.add('hidden');
                userDropdownMenu.classList.remove('block');
            }
        }
        
        if (adminDropdownBtn && adminDropdownMenu) {
            if (!adminDropdownBtn.contains(e.target) && !adminDropdownMenu.contains(e.target)) {
                adminDropdownMenu.classList.add('hidden');
                adminDropdownMenu.classList.remove('block');
            }
        }
    });
}); 