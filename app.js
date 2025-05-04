// DOM Elements
const getStartedBtn = document.getElementById('getStartedBtn');

// Neon animation for text elements
function initNeonTextEffects() {
    // Add neon pulse effect to headings
    const headings = document.querySelectorAll('h1, h2, h3');
    headings.forEach(heading => {
        if (!heading.classList.contains('neon-text')) {
            heading.classList.add('neon-text');
        }
    });
    
    // Create random neon particles
    createNeonParticles();
}

// Create floating neon particles
function createNeonParticles() {
    const main = document.querySelector('main');
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'neon-particle';
        
        // Random size
        const size = Math.random() * 5 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Random color
        const colors = ['var(--primary-neon)', 'var(--secondary-neon)', 'var(--tertiary-neon)'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 10px ${color}`;
        
        // Random animation duration
        const duration = Math.random() * 10 + 10;
        particle.style.animation = `float ${duration}s infinite ease-in-out`;
        
        main.appendChild(particle);
    }
}

// Event Listeners
if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
        // Check if user is logged in
        const user = auth.currentUser;
        
        if (user) {
            // Redirect to files page if logged in
            window.location.href = 'files.html';
        } else {
            // Open login modal if not logged in
            loginModal.style.display = 'block';
        }
    });
}

// Initialize neon effects
document.addEventListener('DOMContentLoaded', () => {
    initNeonTextEffects();
});