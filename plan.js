import { auth, supabase } from './supabase-config.js';

// DOM Elements
const planButtons = document.querySelectorAll('.plan-btn:not(.current)');
const faqItems = document.querySelectorAll('.faq-item');

let currentUser = null;
let userPlan = 'free';

// Listen for authentication state
auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    if (currentUser) {
        loadUserPlan();
    }
});

// Load user plan
async function loadUserPlan() {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('plan')
        .eq('user_id', currentUser.id)
        .single();
    
    if (!error && data) {
        userPlan = data.plan;
        
        // Update UI to show current plan
        const planCards = document.querySelectorAll('.plan-card');
        planCards.forEach(card => {
            const planName = card.querySelector('h3').textContent.toLowerCase();
            const planBtn = card.querySelector('.plan-btn');
            
            if (planName === userPlan) {
                planBtn.textContent = 'Current Plan';
                planBtn.classList.add('current');
                planBtn.disabled = true;
            } else {
                planBtn.textContent = 'Upgrade';
                planBtn.classList.remove('current');
                planBtn.disabled = false;
            }
        });
    }
}

// Plan Upgrade Buttons
if (planButtons) {
    planButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!currentUser) {
                alert('Please login first');
                return;
            }
            
            const planCard = btn.closest('.plan-card');
            const planName = planCard.querySelector('h3').textContent.toLowerCase();
            
            // Show payment confirmation
            const confirmUpgrade = confirm(`Are you sure you want to upgrade to the ${planName} plan?`);
            if (confirmUpgrade) {
                // In a real app, this would redirect to a payment page
                alert('This would redirect to a payment page in a real application.');
                
                // For demo purposes, update the plan directly
                updateUserPlan(planName);
            }
        });
    });
}

// Update user plan
async function updateUserPlan(plan) {
    const planLimits = {
        'free': 10 * 1024 * 1024 * 1024, // 10GB
        'pro': 100 * 1024 * 1024 * 1024, // 100GB
        'business': 500 * 1024 * 1024 * 1024, // 500GB
        'enterprise': 2 * 1024 * 1024 * 1024 * 1024 // 2TB
    };
    
    const { error } = await supabase
        .from('user_profiles')
        .update({ 
            plan: plan,
            storage_limit: planLimits[plan]
        })
        .eq('user_id', currentUser.id);
    
    if (error) {
        alert('Error updating plan: ' + error.message);
        return;
    }
    
    alert(`Successfully upgraded to ${plan} plan!`);
    window.location.reload();
}

// FAQ Accordion
if (faqItems) {
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
}