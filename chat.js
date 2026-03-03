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
        // यह कुंजी कोई भी देख और चुरा सकता है। इसे एक सुरक्षित सर्वर-साइड फ़ंक्शन के माध्यम से उपयोग करें।
        const apiKey = 'AIzaSyAlFShnTdBnDl0mc8PX46sLGx96-_MmeVM'; 
        const thinkingMessage = appendMessage('Aria', 'Thinking...');

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "You are a helpful female assistant named Aria. Respond in short, helpful sentences. The user is asking: " + text }] }]
                })
            });

            const data = await response.json();
            
            messages.removeChild(thinkingMessage);

            if (response.ok && data.candidates && data.candidates.length > 0) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                appendMessage('Aria', aiResponse);
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