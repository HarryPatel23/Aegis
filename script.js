document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;

    // --- Auth View DOM Elements (Always present on page load) ---
    const authContainer = document.getElementById('auth-container');
    const authError = document.getElementById('auth-error');
    const authMessage = document.getElementById('auth-message');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginTabBtn = document.getElementById('login-tab-btn');
    const signupTabBtn = document.getElementById('signup-tab-btn');
    const passwordToggles = document.querySelectorAll('.toggle-password');

    // --- App View DOM Elements (will be assigned after login to prevent errors) ---
    let appContainer, userEmailDisplay, logoutBtn, sosBtn, qrForm, qrCodeContainer, downloadQRButton, saveStatus, qrInputs, qrcode,
        aboutLink, termsLink, privacyLink, disclaimerLink, howItWorksLink, allModals, aboutModal, termsModal, privacyModal, disclaimerModal, howItWorksModal;

    // --- UI Logic for Auth Tabs ---
    loginTabBtn.addEventListener('click', () => {
        loginTabBtn.classList.add('active'); signupTabBtn.classList.remove('active');
        loginForm.classList.add('active'); signupForm.classList.remove('active');
        clearMessages();
    });

    signupTabBtn.addEventListener('click', () => {
        signupTabBtn.classList.add('active'); loginTabBtn.classList.remove('active');
        signupForm.classList.add('active'); loginForm.classList.remove('active');
        clearMessages();
    });

    // --- View/Hide Password Feature ---
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const passwordInput = toggle.previousElementSibling;
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggle.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggle.textContent = '👁️';
            }
        });
    });

    function clearMessages() {
        authError.textContent = '';
        authMessage.textContent = '';
    }
    
    // This function finds all elements in the main app and sets up their event listeners
    function initializeAppView() {
        if (appContainer && appContainer.style.display === 'block') return;

        appContainer = document.getElementById('app-container');
        userEmailDisplay = document.getElementById('user-email-display');
        logoutBtn = document.getElementById('logout-btn');
        sosBtn = document.getElementById('sos-btn');
        qrForm = document.getElementById('qrForm');
        qrCodeContainer = document.getElementById('qrcode');
        downloadQRButton = document.getElementById('downloadQR');
        saveStatus = document.getElementById('save-status');
        
        aboutLink = document.getElementById('about-link');
        termsLink = document.getElementById('terms-link');
        disclaimerLink = document.getElementById('disclaimer-link');
        privacyLink = document.getElementById('privacy-link');
        howItWorksLink = document.getElementById('how-it-works-link');

        aboutModal = document.getElementById('about-modal');
        termsModal = document.getElementById('terms-modal');
        disclaimerModal = document.getElementById('disclaimer-modal');
        privacyModal = document.getElementById('privacy-modal');
        howItWorksModal = document.getElementById('how-it-works-modal');
        allModals = document.querySelectorAll('.modal-overlay');

        qrInputs = {
            fullName: document.getElementById('fullName'), dateOfBirth: document.getElementById('dateOfBirth'),
            bloodType: document.getElementById('bloodType'), organDonor: document.getElementById('organDonor'),
            medications: document.getElementById('medications'), allergies: document.getElementById('allergies'),
            medicalConditions: document.getElementById('medicalConditions'), primaryContactName: document.getElementById('primaryContactName'),
            primaryContactPhone: document.getElementById('primaryContactPhone'), secondaryContactName: document.getElementById('secondaryContactName'),
            secondaryContactPhone: document.getElementById('secondaryContactPhone'), physicianName: document.getElementById('physicianName'),
            physicianPhone: document.getElementById('physicianPhone'),
        };

        // Attach event listeners for the app view
        logoutBtn.addEventListener('click', () => _supabase.auth.signOut());
        sosBtn.addEventListener('click', handleSOS);
        qrForm.addEventListener('input', () => {
            generateQRCode();
            debouncedSave();
        });
        downloadQRButton.addEventListener('click', handleDownload);
        aboutLink.addEventListener('click', (e) => { e.preventDefault(); openModal(aboutModal); });
        termsLink.addEventListener('click', (e) => { e.preventDefault(); openModal(termsModal); });
        disclaimerLink.addEventListener('click', (e) => { e.preventDefault(); openModal(disclaimerModal); });
        privacyLink.addEventListener('click', (e) => { e.preventDefault(); openModal(privacyModal); });
        howItWorksLink.addEventListener('click', (e) => { e.preventDefault(); openModal(howItWorksModal); });

        allModals.forEach(modal => {
            modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
            modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        });
    }

    // --- Authentication State Change Handler ---
    _supabase.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user;
        if (user) {
            currentUser = user;
            initializeAppView();
            userEmailDisplay.textContent = currentUser.email;
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            await loadQRData(user.id);
        } else {
            currentUser = null;
            if(appContainer) appContainer.style.display = 'none';
            authContainer.style.display = 'flex';
        }
    });

    // --- Auth Form Event Listeners ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); clearMessages();
        const { error } = await _supabase.auth.signInWithPassword({
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value,
        });
        if (error) {
            if (error.message.includes("Email not confirmed")) { authError.textContent = 'Please verify your email address.'; }
            else { authError.textContent = error.message; }
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); clearMessages();
        const { error } = await _supabase.auth.signUp({
            email: document.getElementById('signup-email').value,
            password: document.getElementById('signup-password').value,
        });
        if (error) { authError.textContent = error.message; } 
        else { authMessage.textContent = 'Success! Please check your email to verify.'; }
    });

    // --- App Functions ---
    function handleSOS() {
        if (!navigator.geolocation) { alert("Geolocation is not supported by your browser."); return; }
        const originalButtonText = sosBtn.textContent;
        sosBtn.textContent = 'Getting Location...';
        sosBtn.disabled = true;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const mapsLink = `http://googleusercontent.com/maps.google.com/6{latitude},${longitude}`;
                const message = `EMERGENCY ALERT from Aegis:\nI am in an unsafe situation and need help.\n\nMy current location is:\n${mapsLink}`;
                
                const primaryContactPhone = qrInputs.primaryContactPhone.value.replace(/\D/g, '');

                const whatsappUrl = primaryContactPhone ? `https://wa.me/${primaryContactPhone}?text=${encodeURIComponent(message)}` : null;
                
                const useWhatsApp = whatsappUrl && confirm("Send alert to your Primary Contact via WhatsApp?\n\n(Press 'Cancel' to share with other apps.)");

                if (useWhatsApp) {
                    window.open(whatsappUrl, '_blank');
                    sosBtn.textContent = originalButtonText;
                    sosBtn.disabled = false;
                } else {
                    if (navigator.share) {
                        navigator.share({ title: 'Emergency Alert', text: message, })
                            .catch((error) => console.error('Error sharing:', error))
                            .finally(() => {
                                sosBtn.textContent = originalButtonText;
                                sosBtn.disabled = false;
                            });
                    } else {
                        alert("Please copy this message and send it manually:\n\n" + message);
                        sosBtn.textContent = originalButtonText;
                        sosBtn.disabled = false;
                    }
                }
            },
            (error) => {
                console.error("Error getting location:", error.code, error.message);
                if (error.code === 1) {
                    alert("You have blocked location access.\n\nTo use the SOS feature, please go to your browser settings for this site and change the Location permission to 'Allow' or 'Ask'.");
                } else {
                    alert("Could not get your location. Please ensure GPS is on and try again.");
                }
                sosBtn.textContent = originalButtonText;
                sosBtn.disabled = false;
            }
        );
    }
    
    async function saveQRData(userId, data) {
        if (!userId) return;
        saveStatus.textContent = 'Saving...';
        saveStatus.style.color = 'var(--text-secondary)';
        saveStatus.style.opacity = 1;
        const profileData = { id: userId, ...data };
        const { error } = await _supabase.from('profiles').upsert(profileData);
        if (error) {
            console.error("Error saving data: ", error);
            saveStatus.textContent = 'Error saving data!';
            saveStatus.style.color = 'var(--alert-color)';
        } else {
            saveStatus.textContent = 'Profile Saved ✔';
            saveStatus.style.color = 'var(--success-color)';
            setTimeout(() => { saveStatus.style.opacity = 0; }, 2000);
        }
    }

    async function loadQRData(userId) {
        const { data, error } = await _supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) {
            for (const key in qrInputs) {
                const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                // ** THIS IS THE CORRECTED LINE THAT FIXES THE BUG **
                if (data[dbKey] !== null && data[dbKey] !== undefined) {
                    qrInputs[key].value = data[dbKey];
                } else { qrInputs[key].value = ''; }
            }
        } else if (error && error.code !== 'PGRST116') { 
            console.error("Error loading data:", error); 
            alert("Error loading your profile. Please check the console and refresh.");
        } 
        else { for (const key in qrInputs) { qrInputs[key].value = ''; } }
        generateQRCode();
    }

    function generateQRCode() {
        const publicCardUrl = `https://aegis-iota-two.vercel.app/card.html`;
        if (!currentUser) { qrCodeContainer.innerHTML = "<em>Login to get your QR code.</em>"; return; }
        const userCardLink = `${publicCardUrl}?id=${currentUser.id}`;
        qrCodeContainer.innerHTML = "";
        qrcode = new QRCode(qrCodeContainer, {
            text: userCardLink, width: 200, height: 200, colorDark: "#000000",
            colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H
        });
    }

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), delay); };
    };
    
    const debouncedSave = debounce(() => {
        if (!currentUser) return;
        const currentQRData = {};
        for (const key in qrInputs) {
             const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
             currentQRData[dbKey] = qrInputs[key].value;
        }
        saveQRData(currentUser.id, currentQRData);
    }, 1000);

    function handleDownload() {
        const qrCanvas = qrCodeContainer.querySelector('canvas');
        if (qrCanvas) {
            const link = document.createElement('a');
            link.download = 'Aegis_QR.png';
            link.href = qrCanvas.toDataURL('image/png');
            link.click();
        } else { alert("Please fill in your name to generate a QR code first."); }
    }

    function openModal(modal) { if (modal) modal.classList.add('active'); }
    function closeModal() { allModals.forEach(modal => modal.classList.remove('active')); }
});
