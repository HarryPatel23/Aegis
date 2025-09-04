document.addEventListener('DOMContentLoaded', () => {

    const SUPABASE_URL = 'https://pbczbrasaqytqrpwykcc.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiY3picmFzYXF5dHFycHd5a2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDgyODMsImV4cCI6MjA3MjI4NDI4M30.GrWuP8niq_2oPOcZIVkDo9jwn89DOLvN4xAhCVR6IfY';

    const { createClient } = supabase;
    const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
    const qrForm = document.getElementById('qrForm');
    const qrCodeContainer = document.getElementById('qrcode');
    const downloadQRButton = document.getElementById('downloadQR');
    const loginTabBtn = document.getElementById('login-tab-btn');
    const signupTabBtn = document.getElementById('signup-tab-btn');
    const aboutLink = document.getElementById('about-link');
    const termsLink = document.getElementById('terms-link');
    const disclaimerLink = document.getElementById('disclaimer-link');
    const aboutModal = document.getElementById('about-modal');
    const termsModal = document.getElementById('terms-modal');
    const disclaimerModal = document.getElementById('disclaimer-modal');
    const allModals = document.querySelectorAll('.modal-overlay');

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

    let qrcode = new QRCode(qrCodeContainer, {
        width: 200, height: 200, colorDark: "#000000",
        colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H
    });

    // --- Modal Logic ---
    function openModal(modal) { if (modal) modal.classList.add('active'); }
    function closeModal() { allModals.forEach(modal => modal.classList.remove('active')); }

    aboutLink.addEventListener('click', (e) => { e.preventDefault(); openModal(aboutModal); });
    termsLink.addEventListener('click', (e) => { e.preventDefault(); openModal(termsModal); });
    disclaimerLink.addEventListener('click', (e) => { e.preventDefault(); openModal(disclaimerModal); });

    allModals.forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    });

    // --- UI Logic for Auth Tabs ---
    loginTabBtn.addEventListener('click', () => {
        loginTabBtn.classList.add('active');
        signupTabBtn.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        clearMessages();
    });

    signupTabBtn.addEventListener('click', () => {
        signupTabBtn.classList.add('active');
        loginTabBtn.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        clearMessages();
    });

    // --- Helper function to clear auth messages ---
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
            // Use flex to ensure the auth container is properly centered when visible
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
        }
    });

    // --- Auth Form Event Listeners ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();
        const { error } = await _supabase.auth.signInWithPassword({
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value,
        });
        if (error) {
            // Check for the specific email verification error
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
        await _supabase.auth.signOut();
    });

    // --- Database & QR Code Logic ---
    async function saveQRData(userId, data) {
        if (!userId) return;
        // Use 'upsert' to create a profile if it doesn't exist, or update it if it does.
        const profileData = { id: userId, ...data };
        const { error } = await _supabase.from('profiles').upsert(profileData);
        if (error) console.error("Error saving data to Supabase: ", error);
    }

    async function loadQRData(userId) {
        const { data, error } = await _supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) {
            for (const key in qrInputs) {
                const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                if (data[dbKey] !== null && data[dbKey] !== undefined) {
                    qrInputs[key].value = data[dbKey];
                } else {
                    qrInputs[key].value = ''; // Clear the field if DB value is null
                }
            }
        } else {
            // If there's no profile data yet for this user, clear all fields
            for (const key in qrInputs) {
                qrInputs[key].value = '';
            }
        }
        generateQRCode();
    }

    function generateQRCode() {
        const qrData = {
            name: qrInputs.fullName.value, dob: qrInputs.dateOfBirth.value,
            blood_type: qrInputs.bloodType.value, organ_donor: qrInputs.organDonor.value,
            medications: qrInputs.medications.value, allergies: qrInputs.allergies.value,
            conditions: qrInputs.medicalConditions.value,
            primary_contact: { name: qrInputs.primaryContactName.value, phone: qrInputs.primaryContactPhone.value },
            secondary_contact: { name: qrInputs.secondaryContactName.value, phone: qrInputs.secondaryContactPhone.value },
            physician: { name: qrInputs.physicianName.value, phone: qrInputs.physicianPhone.value }
        };

        if (!qrData.name) {
            qrCodeContainer.innerHTML = "<em>Enter your name to generate QR code.</em>";
            return;
        }
        // Clear previous QR code before generating a new one
        qrCodeContainer.innerHTML = "";
        qrcode = new QRCode(qrCodeContainer, {
            text: JSON.stringify(qrData, null, 2),
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