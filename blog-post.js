document.addEventListener('DOMContentLoaded', () => {
    const commentForm = document.getElementById('comment-form');
    const commentList = document.querySelector('.comment-list');
    const commentCountHeader = document.querySelector('.comments-section h2');

    if (!commentForm || !commentList || !commentCountHeader) return;

    // टिप्पणियों को सर्वर से लोड करें
    async function fetchComments() {
        try {
            // मान लें कि आपके पास टिप्पणियों को लाने के लिए एक API एंडपॉइंट है
            const response = await fetch('/api/comments'); 
            if (!response.ok) throw new Error('टिप्पणियाँ लोड करने में विफल।');
            
            const comments = await response.json();
            commentList.innerHTML = ''; // मौजूदा सूची साफ़ करें
            comments.forEach(comment => {
                const newComment = createCommentElement(comment.name, comment.text, new Date(comment.date));
                commentList.appendChild(newComment);
            });
            updateCommentCount();
        } catch (error) {
            console.error('Error fetching comments:', error);
            commentList.innerHTML = '<p>टिप्पणियाँ लोड करने में असमर्थ।</p>';
        }
    }

    // टिप्पणी के लिए DOM एलिमेंट बनाएं
    function createCommentElement(name, commentText, date) {
        const newComment = document.createElement('div');
        newComment.classList.add('comment');

        const avatar = document.createElement('img');
        avatar.src = 'https://via.placeholder.com/60'; // Placeholder avatar
        avatar.alt = 'User Avatar';
        avatar.classList.add('comment-avatar');

        const commentBody = document.createElement('div');
        commentBody.classList.add('comment-body');

        const commentHeader = document.createElement('div');
        commentHeader.classList.add('comment-header');

        const authorSpan = document.createElement('span');
        authorSpan.classList.add('comment-author');
        authorSpan.textContent = name;

        const dateSpan = createDateSpan(date);

        const commentTextP = document.createElement('p');
        commentTextP.classList.add('comment-text');
        commentTextP.textContent = commentText;

        commentHeader.appendChild(authorSpan);
        commentHeader.appendChild(dateSpan);
        commentBody.appendChild(commentHeader);
        commentBody.appendChild(commentTextP);
        newComment.appendChild(avatar);
        newComment.appendChild(commentBody);
        return newComment;
    }

    // टिप्पणी गणना को अपडेट करें
    function updateCommentCount() {
        commentCountHeader.textContent = `टिप्पणियाँ (${commentList.children.length})`;
    }

    // तारीख को फॉर्मेट करने के लिए स्पैन बनाएं
    function createDateSpan(date) {
        const dateSpan = document.createElement('span');
        dateSpan.classList.add('comment-date');
        const month = date.toLocaleString('default', { month: 'long' });
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        dateSpan.textContent = `${month} ${day}, ${year}`;
        return dateSpan;
    }

    // फॉर्म सबमिशन को हैंडल करें
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = commentForm.querySelector('input[name="name"]');
        const commentTextarea = commentForm.querySelector('textarea[name="comment"]');

        const name = nameInput.value.trim();
        const commentText = commentTextarea.value.trim();

        if (name === '' || commentText === '') {
            alert('कृपया अपना नाम और टिप्पणी भरें।');
            return;
        }

        try {
            // टिप्पणी को सर्वर पर भेजें
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, text: commentText }),
            });

            if (!response.ok) throw new Error('टिप्पणी पोस्ट करने में विफल।');

            const savedComment = await response.json(); // सर्वर से सहेजी गई टिप्पणी प्राप्त करें

            // UI में नई टिप्पणी जोड़ें
            const newCommentElement = createCommentElement(savedComment.name, savedComment.text, new Date(savedComment.date));
            commentList.appendChild(newCommentElement);
            updateCommentCount();
            commentForm.reset();
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('टिप्पणी सहेजने में कोई त्रुटि हुई।');
        }
    });

    // पेज लोड होने पर टिप्पणियाँ लोड करें
    fetchComments();
});