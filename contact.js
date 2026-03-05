document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contact-form');
    const result = document.getElementById('form-result');

    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the default form submission

        const scriptURL = form.action; // Get the Google Script URL from the form's action attribute
        const formData = new FormData(form);

        result.innerHTML = "कृपया प्रतीक्षा करें...";
        result.style.color = "#1e293b"; // Reset message color

        fetch(scriptURL, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json()) // Expect a JSON response from the Google Script
            .then(data => {
                if (data.result === "success") {
                    result.innerHTML = "आपका संदेश सफलतापूर्वक भेज दिया गया है!";
                    result.style.color = "green";
                    form.reset(); // Reset the form on success
                } else {
                    // If the script returns an error, display it
                    throw new Error(data.error || 'Unknown error occurred');
                }
            })
            .catch(error => {
                result.innerHTML = "कुछ गलत हो गया! कृपया बाद में प्रयास करें।";
                result.style.color = "red";
            });
    });
});