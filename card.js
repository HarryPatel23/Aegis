// card.js

document.addEventListener('DOMContentLoaded', () => {
    const cardContent = document.getElementById('card-content');

    async function loadCardData() {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('id');

        if (!userId) {
            cardContent.innerHTML = '<p class="error-message">Error: No user ID provided.</p>';
            return;
        }

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

    loadCardData();
});
