document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    const html = document.documentElement;
    
    // Function to close the menu
    function closeMenu() {
        if (menuToggle && nav) {
            menuToggle.classList.remove('active');
            nav.classList.remove('active');
            html.classList.remove('menu-open');
            document.removeEventListener('click', handleOutsideClick);
        }
    }
    
    // Function to handle clicks outside the menu
    function handleOutsideClick(event) {
        if (!nav.contains(event.target) && !menuToggle.contains(event.target)) {
            closeMenu();
        }
    }
    
    // Toggle menu when clicking the hamburger button
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function(event) {
            event.stopPropagation();
            const isOpen = this.classList.toggle('active');
            nav.classList.toggle('active', isOpen);
            html.classList.toggle('menu-open', isOpen);
            
            if (isOpen) {
                document.addEventListener('click', handleOutsideClick);
            } else {
                document.removeEventListener('click', handleOutsideClick);
            }
        });
        
        // Close menu when clicking on a nav link
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }
    
    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && nav && nav.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Handle window resize
    function handleResize() {
        if (window.innerWidth > 992) {
            closeMenu();
        }
    }
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
});
