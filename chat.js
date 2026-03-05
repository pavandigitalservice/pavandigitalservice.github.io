document.addEventListener('DOMContentLoaded', () => {
    const chatBtn = document.getElementById('chat-btn');
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const messages = document.getElementById('messages');

    if (!chatBtn || !chatBox || !userInput || !messages) return;

    chatBtn.addEventListener('click', () => {
        chatBox.classList.toggle('active');
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && userInput.value.trim() !== '') {
            const userMessage = userInput.value.trim();
            appendMessage('You', userMessage);
            sendMessageToAI(userMessage);
            userInput.value = '';
        }
    });

    function appendMessage(sender, text, isError = false) {
        const messageDiv = document.createElement('div');
        const senderSpan = document.createElement('b');
        senderSpan.textContent = `${sender}: `;
        messageDiv.appendChild(senderSpan);

        // To render line breaks from the AI response
        text.split('\n').forEach((line, index) => {
            if (index > 0) messageDiv.appendChild(document.createElement('br'));
            messageDiv.appendChild(document.createTextNode(line));
        });

        if (isError) {
            messageDiv.style.color = 'red';
        }
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
        return messageDiv;
    }

    async function sendMessageToAI(text) {
        // !! सुरक्षा चेतावनी: अपनी API कुंजी को क्लाइंट-साइड कोड में कभी न रखें !!
        // आपकी API कुंजी को सुरक्षित रखने के लिए, हमने इसे सर्वर-साइड एंडपॉइंट के माध्यम से कॉल करने के लिए कोड को अपडेट किया है।
        // आपको एक बैकएंड बनाना होगा जो इस अनुरोध को संभालता है और सुरक्षित रूप से कुंजी जोड़ता है।
        const thinkingMessage = appendMessage('Aria', 'Thinking...');

        try {
            const response = await fetch('/api/chat', { // सर्वर पर एक नया एंडपॉइंट
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text }) // केवल उपयोगकर्ता का टेक्स्ट भेजें
            });

            const data = await response.json();
            
            messages.removeChild(thinkingMessage);

            if (response.ok && data.aiResponse) {
                // मान लें कि आपका सर्वर AI की प्रतिक्रिया को `aiResponse` फ़ील्ड में वापस भेजता है
                appendMessage('Aria', data.aiResponse);
            } else {
                const errorMessage = data.error ? data.error.message : 'No valid response from AI.';
                appendMessage('Error', errorMessage, true);
            }
        } catch (error) {
            console.error(error);
            if (thinkingMessage.parentNode === messages) {
                messages.removeChild(thinkingMessage);
            }
            appendMessage('Error', 'कनेक्शन फेल।', true);
        }
    }
});