document.addEventListener('DOMContentLoaded', () => {
    const commentForm = document.getElementById('comment-form');
    if (!commentForm) return;

    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = commentForm.querySelector('input[name="name"]');
        const commentTextarea = commentForm.querySelector('textarea[name="comment"]');
        const commentList = document.querySelector('.comment-list');
        const commentCountHeader = document.querySelector('.comments-section h2');

        const name = nameInput.value.trim();
        const commentText = commentTextarea.value.trim();

        if (name === '' || commentText === '') {
            alert('कृपया अपना नाम और टिप्पणी भरें।');
            return;
        }

        // Create new comment element
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

        const dateSpan = document.createElement('span');
        dateSpan.classList.add('comment-date');
        const date = new Date();
        const month = date.toLocaleString('default', { month: 'long' });
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        dateSpan.textContent = `${month} ${day}, ${year}`;

        const commentTextP = document.createElement('p');
        commentTextP.classList.add('comment-text');
        commentTextP.textContent = commentText;

        commentHeader.appendChild(authorSpan);
        commentHeader.appendChild(dateSpan);
        commentBody.appendChild(commentHeader);
        commentBody.appendChild(commentTextP);
        newComment.appendChild(avatar);
        newComment.appendChild(commentBody);

        commentList.appendChild(newComment);

        commentCountHeader.textContent = `टिप्पणियाँ (${commentList.children.length})`;

        commentForm.reset();
    });
});