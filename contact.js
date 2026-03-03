document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contact-form');
    const result = document.getElementById('form-result');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const object = Object.fromEntries(formData);
        const json = JSON.stringify(object);

        result.innerHTML = "कृपया प्रतीक्षा करें..."

        fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: json
            })
            .then(async (response) => {
                let json = await response.json();
                if (response.status == 200) {
                    result.innerHTML = "आपका संदेश सफलतापूर्वक भेज दिया गया है!";
                    result.style.color = "green";
                } else {
                    result.innerHTML = json.message;
                    result.style.color = "red";
                }
            })
            .catch(error => {
                result.innerHTML = "कुछ गलत हो गया!";
            })
            .then(() => form.reset());
    });
});