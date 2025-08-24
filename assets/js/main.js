document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('nav ul');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                if (navMenu.classList.contains('active')) {
                    menuToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            }
        });
    });

    // FAQ accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close other open items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
            const answer = item.querySelector('.faq-answer');
            
            if (item.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                answer.style.maxHeight = null;
            }
        });
    });

    // Sticky header on scroll
    const header = document.querySelector('header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.classList.remove('scroll-up');
            return;
        }
        
        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
            // Scroll down
            header.classList.remove('scroll-up');
            header.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
            // Scroll up
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }
        
        lastScroll = currentScroll;
    });

    // Animate stats counter
    const statsSection = document.querySelector('.stats');
    const statNumbers = document.querySelectorAll('.stat-number');
    let animated = false;

    function animateStats() {
        if (animated) return;
        
        const statsPosition = statsSection.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;

        if (statsPosition < screenPosition) {
            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-target'));
                const count = parseInt(stat.textContent.replace('+', ''));
                const increment = target / 50; // Adjust speed of counting
                
                if (count < target) {
                    stat.textContent = Math.ceil(count + increment) + '+';
                    setTimeout(animateStats, 30);
                } else {
                    stat.textContent = target + '+';
                }
            });
            
            animated = true;
        }
    }

    // Initialize stats with 0
    statNumbers.forEach(stat => {
        const target = stat.textContent;
        stat.setAttribute('data-target', target.replace('+', ''));
        stat.textContent = '0+';
    });

    window.addEventListener('scroll', animateStats);
    
    // Trigger animation on page load if stats are already in view
    if (statsSection.getBoundingClientRect().top < window.innerHeight) {
        animateStats();
    }

    // Form submission handling
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (validateEmail(email)) {
                // Here you would typically send the email to your server
                alert('Obrigado por se inscrever em nossa newsletter!');
                emailInput.value = '';
            } else {
                alert('Por favor, insira um endereço de e-mail válido.');
            }
        });
    }
    
    // Email validation helper function
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Payment method selection
    const paymentMethods = document.querySelectorAll('.payment-method');
    
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            paymentMethods.forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            
            // Update the selected payment method in the form
            const paymentType = this.getAttribute('data-payment-type');
            document.querySelector('input[name="payment-type"]').value = paymentType;
        });
    });

    // Donation amount selection
    const customAmountInput = document.querySelector('.custom-amount input');
    const amountButtons = document.querySelectorAll('.amount-option');
    
    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            amountButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update the amount input
            const amount = this.getAttribute('data-amount');
            document.querySelector('input[name="donation-amount"]').value = amount;
            
            // Clear custom amount if a preset is selected
            if (customAmountInput) {
                customAmountInput.value = '';
            }
        });
    });
    
    if (customAmountInput) {
        customAmountInput.addEventListener('focus', function() {
            amountButtons.forEach(btn => btn.classList.remove('active'));
        });
        
        customAmountInput.addEventListener('input', function() {
            document.querySelector('input[name="donation-amount"]').value = this.value;
        });
    }

    // Initialize AOS (Animate On Scroll) if available
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }
});

// Add loading class to body which will be removed when everything is loaded
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});
