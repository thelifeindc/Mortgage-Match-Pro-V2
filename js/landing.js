/**
 * Landing page animations and interactions for Mortgage Match Pro
 * Inspired by Buzzworthy Studio's design aesthetics
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations
    initPageLoader();
    initScrollAnimations();
    initBlobAnimations();
    initButtonEffects();
    initTextAnimation();
    initHorizontalScroll();
});

/**
 * Page loading animation
 */
function initPageLoader() {
    const loader = document.querySelector('.loading-overlay');
    if (!loader) return;
    
    // Simulate loading time (remove in production and use actual asset loading)
    setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }, 1500);
}

/**
 * Text reveal animation for hero title
 */
function initTextAnimation() {
    const titleElement = document.querySelector('.hero-title');
    if (!titleElement) return;
    
    const text = titleElement.textContent;
    titleElement.innerHTML = '';
    titleElement.style.opacity = '1';
    
    // Wrap each letter in a span with animation
    [...text].forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.display = 'inline-block';
        span.style.opacity = '0';
        span.style.transform = 'translateY(20px)';
        span.style.transition = `opacity 0.3s ease, transform 0.3s ease`;
        span.style.transitionDelay = `${0.05 * index}s`;
        
        titleElement.appendChild(span);
        
        // Trigger the animation after a short delay
        setTimeout(() => {
            span.style.opacity = '1';
            span.style.transform = 'translateY(0)';
        }, 100);
    });
}

/**
 * Scroll-triggered animations
 */
function initScrollAnimations() {
    const animated = document.querySelectorAll('.scroll-animated, .features-title, .testimonials-title, .feature-card, .testimonial-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Add staggered delay for grid items
                if (entry.target.classList.contains('feature-card') || entry.target.classList.contains('testimonial-card')) {
                    const items = Array.from(entry.target.parentElement.children);
                    const index = items.indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 0.1}s`;
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });
    
    animated.forEach(element => {
        observer.observe(element);
    });
}

/**
 * Blob animation enhancements 
 */
function initBlobAnimations() {
    const blobs = document.querySelectorAll('.blob');
    if (!blobs.length) return;
    
    // Add scroll-based animation
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;
        const scrollPercent = scrollY / viewportHeight;
        
        blobs.forEach((blob, index) => {
            // Different movement for each blob
            const translateX = (index % 2 === 0) ? scrollPercent * 50 : scrollPercent * -50;
            const translateY = (index % 3 === 0) ? scrollPercent * 30 : scrollPercent * -30;
            const scale = 1 + (scrollPercent * 0.1);
            
            blob.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        });
    });
    
    // Add mouse movement effect
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        blobs.forEach((blob, index) => {
            const offsetX = (mouseX - 0.5) * (index + 1) * 20;
            const offsetY = (mouseY - 0.5) * (index + 1) * 20;
            const currentTransform = blob.style.transform || '';
            
            // Parse existing transform to extract current translate and scale values
            let translateX = 0, translateY = 0, scale = 1;
            
            if (currentTransform.includes('translate')) {
                const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
                if (translateMatch && translateMatch[1]) {
                    const parts = translateMatch[1].split(',');
                    translateX = parseFloat(parts[0]) || 0;
                    translateY = parseFloat(parts[1]) || 0;
                }
            }
            
            if (currentTransform.includes('scale')) {
                const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
                if (scaleMatch && scaleMatch[1]) {
                    scale = parseFloat(scaleMatch[1]) || 1;
                }
            }
            
            // Apply mouse movement offset to existing transform
            blob.style.transform = `translate(${translateX + offsetX}px, ${translateY + offsetY}px) scale(${scale})`;
        });
    });
}

/**
 * Button animation effects
 */
function initButtonEffects() {
    const ctaButtons = document.querySelectorAll('.cta-button');
    
    ctaButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-5px)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
        });
        
        button.addEventListener('click', createRippleEffect);
    });
}

/**
 * Creates a ripple effect on button click
 * @param {Event} e - The click event
 */
function createRippleEffect(e) {
    const button = e.currentTarget;
    
    // Remove any existing ripple
    const ripple = button.querySelector('.ripple');
    if (ripple) {
        ripple.remove();
    }
    
    // Create ripple element
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    // Position the ripple based on click location
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - radius;
    const y = e.clientY - rect.top - radius;
    
    // Style the ripple
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    circle.className = 'ripple';
    circle.style.position = 'absolute';
    circle.style.background = 'rgba(255,255,255,0.5)';
    circle.style.borderRadius = '50%';
    circle.style.transform = 'scale(0)';
    circle.style.animation = 'ripple-animation 0.6s linear';
    circle.style.pointerEvents = 'none';
    
    // Add ripple to button
    button.appendChild(circle);
    
    // Remove ripple after animation completes
    setTimeout(() => {
        circle.remove();
    }, 600);
}

/**
 * Horizontal scrolling section
 */
function initHorizontalScroll() {
    const horizontalScroll = document.querySelector('.horizontal-scroll');
    if (!horizontalScroll) return;
    
    const content = horizontalScroll.querySelector('.horizontal-content');
    const sections = content.querySelectorAll('.horizontal-section');
    
    // Set content width based on number of sections
    const contentWidth = sections.length * 100;
    content.style.width = `${contentWidth}vw`;
    
    // Set initial position
    content.style.transform = `translateX(0px)`;
    
    // Scroll handler
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const scrollStart = horizontalScroll.offsetTop - window.innerHeight / 2;
        const scrollDistance = horizontalScroll.offsetHeight + window.innerHeight;
        
        // Calculate how far through the section we've scrolled (0-1)
        let scrollProgress = (scrollTop - scrollStart) / scrollDistance;
        scrollProgress = Math.max(0, Math.min(1, scrollProgress));
        
        // Calculate horizontal translation
        const maxTranslate = content.offsetWidth - window.innerWidth;
        const translateX = maxTranslate * scrollProgress * -1;
        
        // Apply transform with requestAnimationFrame for better performance
        requestAnimationFrame(() => {
            content.style.transform = `translateX(${translateX}px)`;
            
            // Add parallax effect to each section
            sections.forEach((section, index) => {
                const speed = 1 - (index * 0.1); // Different speed for each section
                section.style.transform = `translateX(${translateX * speed}px)`;
            });
        });
    });
    
    // Ensure horizontal scroll is visible when in viewport
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            horizontalScroll.classList.add('in-view');
        }
    }, {
        threshold: 0.1
    });
    
    observer.observe(horizontalScroll);
}

// Export functions for use in other modules if needed
export {
    initBlobAnimations,
    createRippleEffect,
    initScrollAnimations
};