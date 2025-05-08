/**
 * Form Animations - Modern interactive animations for Mortgage Match Pro
 * Adds smooth animations and interactions similar to Deed Delivery website
 */

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeFormFieldAnimations();
    initializeButtonAnimations();
    initializeRadioCheckboxAnimations();
});

/**
 * Adds interaction animations to form fields
 */
function initializeFormFieldAnimations() {
    // Get all form inputs (text, email, tel, number, select)
    const formInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], select');
    
    formInputs.forEach(input => {
        // Add focus and blur event listeners
        input.addEventListener('focus', handleInputFocus);
        input.addEventListener('blur', handleInputBlur);
        
        // Check if input already has value on page load
        if (input.value !== '') {
            const formGroup = input.closest('.form-group');
            if (formGroup) {
                formGroup.classList.add('active');
            }
        }
    });
}

/**
 * Handles input focus event
 * @param {Event} e - The focus event
 */
function handleInputFocus(e) {
    const input = e.target;
    const formGroup = input.closest('.form-group');
    
    if (formGroup) {
        formGroup.classList.add('active');
        
        // Add a subtle animation to the label
        const label = formGroup.querySelector('label');
        if (label) {
            label.style.transition = 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
            label.style.color = '#3182ce';
            label.style.transform = 'translateY(-2px)';
        }
    }
}

/**
 * Handles input blur event
 * @param {Event} e - The blur event
 */
function handleInputBlur(e) {
    const input = e.target;
    const formGroup = input.closest('.form-group');
    
    // Only remove the active class if the input has no value
    if (formGroup && input.value === '') {
        formGroup.classList.remove('active');
        
        // Reset the label style
        const label = formGroup.querySelector('label');
        if (label) {
            label.style.transform = 'translateY(0)';
            label.style.color = '#4a5568';
        }
    }
}

/**
 * Adds ripple effect and enhanced animations to buttons
 */
function initializeButtonAnimations() {
    const buttons = document.querySelectorAll('button:not([disabled])');
    
    buttons.forEach(button => {
        // Add click event for ripple effect
        button.addEventListener('click', createRippleEffect);
        
        // Add hover animation
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 12px rgba(49, 130, 206, 0.2)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
            button.style.boxShadow = '';
        });
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
    circle.classList.add('ripple');
    
    // Add ripple style if it doesn't exist
    if (!document.querySelector('style#ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = `
            .ripple {
                position: absolute;
                background-color: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple-animation 0.6s linear;
                z-index: 0;
                pointer-events: none;
            }
            
            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add ripple to button
    button.appendChild(circle);
    
    // Remove ripple after animation completes
    setTimeout(() => {
        circle.remove();
    }, 600);
}

/**
 * Adds enhanced animations to radio buttons and checkboxes
 */
function initializeRadioCheckboxAnimations() {
    // Update radio buttons
    const radioOptions = document.querySelectorAll('.radio-option');
    radioOptions.forEach(option => {
        const input = option.querySelector('input[type="radio"]');
        const label = option.querySelector('label');
        
        if (input && label) {
            // Ensure the label is properly associated with the input
            if (!label.getAttribute('for')) {
                label.setAttribute('for', input.id);
            }
            
            // Add click animation
            option.addEventListener('click', () => {
                label.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    label.style.transform = 'scale(1)';
                }, 150);
            });
        }
    });
    
    // Update checkboxes
    const checkboxOptions = document.querySelectorAll('.checkbox-option');
    checkboxOptions.forEach(option => {
        const input = option.querySelector('input[type="checkbox"]');
        const label = option.querySelector('label');
        
        if (input && label) {
            // Ensure the label is properly associated with the input
            if (!label.getAttribute('for')) {
                label.setAttribute('for', input.id);
            }
            
            // Add click animation
            option.addEventListener('click', () => {
                label.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    label.style.transform = 'scale(1)';
                }, 150);
            });
        }
    });
}

/**
 * Adds a progress bar animation for form submissions
 * @param {Element} button - The submit button
 * @param {Function} callback - Function to call after animation completes
 */
function animateSubmitProgress(button, callback) {
    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.classList.add('submit-progress');
    
    // Add necessary styles if they don't exist
    if (!document.querySelector('style#progress-style')) {
        const style = document.createElement('style');
        style.id = 'progress-style';
        style.textContent = `
            .submit-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: linear-gradient(to right, #9ae6b4, #38b2ac);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .btn-submitting {
                pointer-events: none;
                position: relative;
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add progress bar to button
    button.classList.add('btn-submitting');
    button.appendChild(progressBar);
    
    // Animate the progress
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                button.classList.remove('btn-submitting');
                progressBar.remove();
                if (callback && typeof callback === 'function') {
                    callback();
                }
            }, 300);
        } else {
            width += (width < 60) ? 3 : (width < 80) ? 2 : 1;
            progressBar.style.width = `${width}%`;
        }
    }, 20);
}

// Export functions for use in other modules
export {
    initializeFormFieldAnimations,
    initializeButtonAnimations,
    createRippleEffect,
    animateSubmitProgress
};