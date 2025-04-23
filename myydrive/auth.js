// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const userProfileBtn = document.getElementById('userProfileBtn');
const userName = document.getElementById('userName');
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const signupLink = document.getElementById('signupLink');
const loginLink = document.getElementById('loginLink');
const closeBtns = document.querySelectorAll('.close');

// Check if user is logged in
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        loginBtn.style.display = 'none';
        userProfileBtn.style.display = 'flex';
        userName.textContent = user.email.split('@')[0];
    } else {
        // User is signed out
        loginBtn.style.display = 'flex';
        userProfileBtn.style.display = 'none';
    }
});

// Open login modal
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

// Switch to signup modal
signupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'none';
    signupModal.style.display = 'block';
});

// Switch to login modal
loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupModal.style.display = 'none';
    loginModal.style.display = 'block';
});

// Close modals
closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        loginModal.style.display = 'none';
        signupModal.style.display = 'none';
    });
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (e.target === signupModal) {
        signupModal.style.display = 'none';
    }
});

// Login form submission
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Sign in with Firebase
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            loginModal.style.display = 'none';
            loginForm.reset(); // Reset the form after successful login
        })
        .catch((error) => {
            alert(`Error: ${error.message}`);
        });
});

// Signup form submission
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Check if passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Create user with Firebase
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed up
            signupModal.style.display = 'none';
            signupForm.reset();
            
            // Create user document in Firestore
            return firestore.collection('users').doc(userCredential.user.uid).set({
                email: email,
                createdAt: new Date(),
                storageUsed: 0
            });
        })
        .catch((error) => {
            alert(`Error: ${error.message}`);
        });
});

// Logout functionality
if (userProfileBtn) {
    userProfileBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                // Sign-out successful
            })
            .catch((error) => {
                console.error('Error signing out:', error);
            });
    });
}