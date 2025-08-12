document.addEventListener('DOMContentLoaded', () => {
    const goHomeBtn = document.getElementById('goHomeBtn');
    const contactBtn = document.getElementById('contactBtn');

    if (goHomeBtn) {
        goHomeBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    if (contactBtn) {
        contactBtn.addEventListener('click', () => {
            // A simple mailto link is better than an alert.
            window.location.href = 'mailto:support@resumeforge.com';
        });
    }
});