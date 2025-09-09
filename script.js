document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;

    // --- DOM Element References ---
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const authError = document.getElementById('auth-error');
    const authMessage = document.getElementById('auth-message');
    const userEmailDisplay = document.getElementById('user-email-display');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const logoutBtn = document.getElementById('logout-btn');
    const sosBtn = document.getElementById('sos-btn'); // The new SOS button
    const qrForm = document.getElementById('qrForm');
    const qrCodeContainer = document.getElementById('qrcode');
    const downloadQRButton = document.getElementById('downloadQR');
    const loginTabBtn = document.getElementById('login-tab-btn');
    const signupTabBtn = document.getElementById('signup-tab-btn');
    const aboutLink = document.getElementById('about-link');
    const termsLink = document.getElementById('terms-link');
    const disclaimerLink = document.getElementById('disclaimer-link');
    const privacyLink = document.getElementById('privacy-link');
    const aboutModal = document.getElementById('about-modal');
    const termsModal = document.getElementById('terms-modal');
    const disclaimerModal = document.getElementById('disclaimer-modal');
    const privacyModal = document.getElementById('privacy-modal');
    const allModals = document.querySelectorAll('.modal-overlay');
    const saveStatus = document.getElementById('save-status');

    const qrInputs = {
        fullName: document.getElementById('fullName'),
        dateOfBirth: document.getElementById('dateOfBirth'),
        bloodType: document.getElementById('bloodType'),
        organDonor: document.getElementById('organDonor'),
        medications: document.getElementById('medications'),
        allergies: document.getElementById('allergies'),
        medicalConditions: document.getElementById('medicalConditions'),
        primaryContactName: document.getElementById('primaryContactName'),
        primaryContactPhone: document.getElementById('primaryContactPhone'),
        secondaryContactName: document.getElementById('secondaryContactName'),
        secondaryContactPhone: document.getElementById('secondaryContactPhone'),
        physicianName: document.getElementById('physicianName'),
        physicianPhone: document.getElementById('physicianPhone'),
    };

    let qrcode = null;

    // --- Modal Logic ---
    function openModal(modal) { if (modal) modal.classList.add('active'); }
    function closeModal() { allModals.forEach(modal => modal.classList.remove('active')); }

    aboutLink.addEventListener('click', (e) => { e.preventDefault(); openModal(aboutModal); });
    termsLink.addEventListener('click', (e) => { e.preventDefault(); openModal(termsModal); });
    disclaimerLink.addEventListener('click', (e) => { e.preventDefault(); openModal(disclaimerModal); });
    privacyLink.addEventListener('click', (e) => { e.preventDefault(); openModal(privacyModal); });

    allModals.forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    });

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

    function clearMessages() {
        authError.textContent = '';
        authMessage.textContent = '';
    }

    // --- Authentication State Change Handler ---
    _supabase.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user;
        if (user) {
            currentUser = user;
            userEmailDisplay.textContent = currentUser.email;
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            await loadQRData(user.id);
        } else {
            currentUser = null;
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
        }
    });

    // --- Auth Form & Button Event Listeners ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();
        const { error } = await _supabase.auth.signInWithPassword({
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value,
        });
        if (error) {
            if (error.message.includes("Email not confirmed")) {
                authError.textContent = 'Please verify your email address. Check your inbox for the link.';
            } else {
                authError.textContent = error.message;
            }
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();
        const { error } = await _supabase.auth.signUp({
            email: document.getElementById('signup-email').value,
            password: document.getElementById('signup-password').value,
        });
        if (error) {
            authError.textContent = error.message;
        } else {
            authMessage.textContent = 'Success! Please check your email to verify your account.';
        }
    });
    
    logoutBtn.addEventListener('click', async () => {
        try {
            await _supabase.auth.signOut();
        } catch (error) {
            console.error('Error during logout:', error);
            alert('An error occurred while logging out. Please try again.');
        }
    });

    sosBtn.addEventListener('click', handleSOS);

    // --- SOS Alert Function ---
    function handleSOS() {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        const originalButtonText = sosBtn.textContent;
        sosBtn.textContent = 'Getting Location...';
        sosBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
                
                const message = `EMERGENCY ALERT from Aegis:\nI am in an unsafe situation and need help.\n\nMy current location is:\n${mapsLink}`;

                if (navigator.share) {
                    navigator.share({ title: 'Emergency Alert', text: message })
                        .catch((error) => console.error('Error sharing:', error))
                        .finally(() => {
                            sosBtn.textContent = originalButtonText;
                            sosBtn.disabled = false;
                        });
                } else {
                    alert("Your browser does not support automatic sharing. Please copy this message and send it manually:\n\n" + message);
                    sosBtn.textContent = originalButtonText;
                    sosBtn.disabled = false;
                }
            },
            (error) => {
                console.error("Error getting location:", error);
                alert("Could not get your location. Please ensure you have granted location permissions to this site.");
                sosBtn.textContent = originalButtonText;
                sosBtn.disabled = false;
            }
        );
    }

    // --- Database & QR Code Logic ---
    async function saveQRData(userId, data) {
        if (!userId) return;
        saveStatus.textContent = 'Saving...';
        saveStatus.style.color = 'var(--text-secondary)';
        saveStatus.style.opacity = 1;
        const profileData = { id: userId, ...data };
        const { error } = await _supabase.from('profiles').upsert(profileData);
        if (error) {
            console.error("Error saving data to Supabase: ", error);
            saveStatus.textContent = 'Error saving data!';
            saveStatus.style.color = 'var(--alert-color)';
        } else {
            saveStatus.textContent = 'Profile Saved ✔';
            saveStatus.style.color = 'var(--success-color)';
            setTimeout(() => {
                saveStatus.style.opacity = 0;
            }, 2000);
        }
    }

    async function loadQRData(userId) {
        const { data, error } = await _supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) {
            for (const key in qrInputs) {
                const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                if (data[dbKey] !== null && data[dbKey] !== undefined) {
                    qrInputs[key].value = data[dbKey];
                } else {
                    qrInputs[key].value = '';
                }
            }
        } else if (error && error.code !== 'PGRST116') {
            console.error("Error loading data:", error);
        } else {
             for (const key in qrInputs) {
                qrInputs[key].value = '';
            }
        }
        generateQRCode();
    }

    function generateQRCode() {
        const publicCardUrl = `https://aegis-iota-two.vercel.app/card.html`;
        if (!currentUser) {
            qrCodeContainer.innerHTML = "<em>Login to get your QR code.</em>";
            return;
        }
        const userCardLink = `${publicCardUrl}?id=${currentUser.id}`;
        qrCodeContainer.innerHTML = "";
        qrcode = new QRCode(qrCodeContainer, {
            text: userCardLink,
            width: 200, height: 200, colorDark: "#000000",
            colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H
        });
    }

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
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

    qrForm.addEventListener('input', () => {
        generateQRCode();
        debouncedSave();
    });

    downloadQRButton.addEventListener('click', () => {
        const qrCanvas = qrCodeContainer.querySelector('canvas');
        if (qrCanvas) {
            const link = document.createElement('a');
            link.download = 'Aegis_QR.png';
            link.href = qrCanvas.toDataURL('image/png');
            link.click();
        } else {
            alert("Please fill in your name to generate a QR code first.");
        }
    });
});
