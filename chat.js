const apiKey = 'AIzaSyAlFShnTdBnDl0mc8PX46sLGx96-_MmeVM';

try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: text }] }]
        })
    });

    const data = await response.json();
    
    if (data.candidates) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        messages.innerHTML += `<div><b>Jarvis:</b> ${aiResponse}</div>`;
    } else {
        messages.innerHTML += `<div style="color:red;"><b>Error:</b> ${data.error.message}</div>`;
    }
} catch (error) {
    console.error(error);
    messages.innerHTML += `<div style="color:red;"><b>Error:</b> कनेक्शन फेल।</div>`;
}