document.addEventListener('DOMContentLoaded', () => {
    // IMPORTANT: Use the same credentials as your main script.js file
    const SUPABASE_URL = 'https://pbczbrasaqytqrpwykcc.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiY3picmFzYXF5dHFycHd5a2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDgyODMsImV4cCI6MjA3MjI4NDI4M30.GrWuP8niq_2oPOcZIVkDo9jwn89DOLvN4xAhCVR6IfY';
    
    const { createClient } = supabase;
    const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const cardContent = document.getElementById('card-content');

    // Function to fetch and display the user's profile
    async function loadCardData() {
        // 1. Get the user's ID from the URL (e.g., ...card.html?id=USER_ID)
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('id');

        if (!userId) {
            cardContent.innerHTML = '<p class="error-message">Error: No user ID provided.</p>';
            return;
        }

        // 2. Fetch the profile data from Supabase
        const { data, error } = await _supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) {
            cardContent.innerHTML = '<p class="error-message">Could not find user information.</p>';
            console.error('Error fetching profile:', error);
            return;
        }

        // 3. Build the HTML to display the data
        cardContent.innerHTML = `
            <div class="card-section">
                <h3>Personal Information</h3>
                <div class="card-item"><span class="card-item-label">Full Name</span><span class="card-item-value">${data.full_name || 'N/A'}</span></div>
                <div class="card-item"><span class="card-item-label">Date of Birth</span><span class="card-item-value">${data.date_of_birth || 'N/A'}</span></div>
                <div class="card-item"><span class="card-item-label">Blood Type</span><span class="card-item-value">${data.blood_type || 'N/A'}</span></div>
                <div class="card-item"><span class="card-item-label">Organ Donor</span><span class="card-item-value">${data.organ_donor || 'N/A'}</span></div>
            </div>
            <div class="card-section">
                <h3>Medical Details</h3>
                <div class="card-item"><span class="card-item-label">Allergies</span><span class="card-item-value">${data.allergies || 'None'}</span></div>
                <div class="card-item"><span class="card-item-label">Medications</span><span class="card-item-value">${data.medications || 'None'}</span></div>
                <div class="card-item"><span class="card-item-label">Conditions</span><span class="card-item-value">${data.medical_conditions || 'None'}</span></div>
            </div>
            <div class="card-section">
                <h3>Emergency Contacts</h3>
                <div class="card-item"><span class="card-item-label">${data.primary_contact_name || 'Primary Contact'}</span><span class="card-item-value">${data.primary_contact_phone || 'N/A'}</span></div>
                <div class="card-item"><span class="card-item-label">${data.secondary_contact_name || 'Secondary Contact'}</span><span class="card-item-value">${data.secondary_contact_phone || 'N/A'}</span></div>
                <div class="card-item"><span class="card-item-label">${data.physician_name || 'Physician'}</span><span class="card-item-value">${data.physician_phone || 'N/A'}</span></div>
            </div>
        `;
    }

    // Run the function when the page loads
    loadCardData();
});
