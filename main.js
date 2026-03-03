document.addEventListener('DOMContentLoaded', () => {
    // Hamburger menu toggle
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinks = document.querySelector('.nav-links');

    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburgerBtn.classList.toggle('active');
        });
    }

    // Typed.js initialization
    if (document.getElementById('typed-element')) {
        new Typed('#typed-element', {
            strings: ['पैशनेट एंड्रॉयड डेवलपर', 'क्रिएटिव वेब डिज़ाइनर', 'टेक्नोलॉजी उत्साही'],
            typeSpeed: 50,
            backSpeed: 25,
            loop: true,
            smartBackspace: true,
        });
    }
});