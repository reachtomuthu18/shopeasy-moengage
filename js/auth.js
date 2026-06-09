// ============================================
// AUTH - Login, Register, Logout
// ============================================

// ---------- SWITCH TAB (Login/Register) ----------
function switchTab(tab) {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('registerTab').classList.remove('active');

    document.getElementById(tab + 'Form').classList.add('active');
    document.getElementById(tab + 'Tab').classList.add('active');
}

// ---------- USE CASE: ABANDONED SIGNUP NUDGES ----------
let signupTracked = false;
function onSignupStarted() {
    if (!signupTracked) {
        Moengage.track_event("Registration Initiated", {
            "step_completed": "Form Opened",
            "platform": "Web"
        });
        signupTracked = true;
    }
}

// ---------- REGISTER ----------
function handleRegister() {
    const name     = document.getElementById('regName').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const mobile   = document.getElementById('regMobile').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const msgBox   = document.getElementById('registerMessage');

    // Basic Validation
    if (!name || !email || !mobile || !password) {
        showMessage(msgBox, 'error', '⚠️ Please fill in all fields.');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage(msgBox, 'error', '⚠️ Please enter a valid email.');
        return;
    }

    if (password.length < 6) {
        showMessage(msgBox, 'error', '⚠️ Password must be at least 6 characters.');
        return;
    }

    const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
    const alreadyExists = existingUsers.find(u => u.email === email);

    if (alreadyExists) {
        showMessage(msgBox, 'error', '⚠️ Email already registered. Please login.');
        return;
    }

    // Save new user
    const newUser = { name, email, mobile, password };
    existingUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(existingUsers));

    // --- MOENGAGE FIXES FOR REGISTRATION & WELCOME USE CASES ---
    Moengage.add_unique_user_id(newUser.email);
    Moengage.add_email(newUser.email);
    Moengage.add_user_name(newUser.name);
    Moengage.add_mobile(newUser.mobile);
    
    // Setting up target states for tracking Welcome Offer / First Order Discounts
    Moengage.add_user_attribute("signup_date", new Date().toISOString());
    Moengage.add_user_attribute("total_orders_placed", 0);
    Moengage.add_user_attribute("is_first_buyer", true);

    Moengage.track_event("Registration Completed", {
        "auth_method": "Email/Password"
    });

    showMessage(msgBox, 'success', '✅ Account created! Redirecting to login...');

    setTimeout(() => {
        switchTab('login');
        document.getElementById('loginEmail').value = email;
    }, 1500);
}

// ---------- LOGIN ----------
function handleLogin() {
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const msgBox   = document.getElementById('loginMessage');

    if (!email || !password) {
        showMessage(msgBox, 'error', '⚠️ Please enter email and password.');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user  = users.find(u => u.email === email && u.password === password);

    if (!user) {
        showMessage(msgBox, 'error', '❌ Invalid email or password.');
        return;
    }

    localStorage.setItem('loggedInUser', JSON.stringify(user));

    // --- MOENGAGE FIXES FOR LOGIN & WIN-BACK NUDGES ---
    Moengage.add_unique_user_id(user.email);
    Moengage.add_email(user.email);
    Moengage.add_user_name(user.name);
    Moengage.add_mobile(user.mobile);
    
    Moengage.track_event("User Logged In", {
        "last_login_date": new Date().toISOString()
    });

    showMessage(msgBox, 'success', '✅ Login successful! Redirecting...');

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// ---------- LOGOUT ----------
function logout() {
    Moengage.track_event("User Logged Out", {
        "session_end_time": new Date().toISOString()
    });
    Moengage.destroy_session();

    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}

// ---------- CHECK LOGIN STATE (runs on every page) ----------
function checkLoginState() {
    const user      = JSON.parse(localStorage.getItem('loggedInUser'));
    const userBar   = document.getElementById('userBar');
    const loginBtn  = document.getElementById('loginNavBtn');

    if (user) {
        if (userBar) {
            userBar.style.display = 'block';
            document.getElementById('welcomeName').textContent = user.name;
        }
        if (loginBtn) {
            loginBtn.textContent = 'Logout';
            loginBtn.href        = '#';
            loginBtn.onclick = function(e) {
                e.preventDefault();
                logout();
            };
        }
    }
}

// ---------- HELPERS ----------
function showMessage(element, type, message) {
    if (element) {
        element.className  = 'auth-message ' + type;
        element.textContent = message;
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------- DOM EVENT LISTENERS ----------
document.addEventListener("DOMContentLoaded", () => {
    const signupInputs = ['regName', 'regEmail', 'regMobile', 'regPassword'];
    signupInputs.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            inputElement.addEventListener('focus', onSignupStarted);
        }
    });

    checkLoginState();
});