document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;

    // --- DOM Element References ---
    const authContainer = document.getElementById('auth-container');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    // ... all other auth elements
    
    let appContainer, logoutBtn, sosBtn, howItWorksLink, howItWorksModal; // App-specific elements

    // This function finds all elements and sets up listeners for the main app view
    function initializeAppView() {
        if (appContainer) return; // Already initialized

        appContainer = document.getElementById('app-container');
        // ... (all other getElementById calls for the app view)
        logoutBtn = document.getElementById('logout-btn');
        sosBtn = document.getElementById('sos-btn');
        howItWorksLink = document.getElementById('how-it-works-link');
        howItWorksModal = document.getElementById('how-it-works-modal');
        
        // Attach event listeners for the app view
        logoutBtn.addEventListener('click', () => _supabase.auth.signOut());
        sosBtn.addEventListener('click', handleSOS);
        howItWorksLink.addEventListener('click', (e) => { e.preventDefault(); openModal(howItWorksModal); });
        // ... (all other app-view event listeners)
    }

    _supabase.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user;
        if (user) {
            currentUser = user;
            initializeAppView();
            // ... (rest of the login logic)
        } else {
            // ... (logout logic)
        }
    });

    // --- ENHANCED SOS FUNCTION ---
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
                const mapsLink = `http://googleusercontent.com/maps.google.com/4{latitude},${longitude}`;
                const message = `EMERGENCY ALERT from Aegis:\nI am in an unsafe situation and need help.\n\nMy current location is:\n${mapsLink}`;
                
                const primaryContactPhone = qrInputs.primaryContactPhone.value.replace(/\D/g, ''); // Clean the phone number

                const whatsappUrl = primaryContactPhone 
                    ? `https://wa.me/${primaryContactPhone}?text=${encodeURIComponent(message)}`
                    : null;
                
                const useWhatsApp = whatsappUrl && confirm("Send alert to your Primary Contact via WhatsApp?\n\n(Press 'Cancel' to share with other apps.)");

                if (useWhatsApp) {
                    window.open(whatsappUrl, '_blank');
                    sosBtn.textContent = originalButtonText;
                    sosBtn.disabled = false;
                } else {
                    if (navigator.share) {
                        navigator.share({ title: 'Emergency Alert', text: message })
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
    
    // ... (All other functions remain the same)
});
