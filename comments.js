import { auth, db } from './auth.js';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

let currentUser = null;
let commentsUnsubscribe = null;

// Track auth state
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  renderCommentForm();
});

// Format date helper
function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('hi-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
}

// Escape HTML helper for security
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render Comment Form according to login status
function renderCommentForm() {
  const formContainer = document.getElementById('comments-form-wrapper');
  if (!formContainer) return;

  if (currentUser) {
    const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'उपयोगकर्ता (User)';
    const initial = displayName.charAt(0).toUpperCase();

    formContainer.innerHTML = `
      <div class="comment-input-box">
        <div class="comment-user-info">
          <div class="comment-avatar">
            ${currentUser.photoURL ? `<img src="${escapeHtml(currentUser.photoURL)}" alt="Avatar">` : initial}
          </div>
          <div>
            <span class="comment-user-name">${escapeHtml(displayName)}</span>
            <span class="comment-user-email">(${escapeHtml(currentUser.email || '')})</span>
          </div>
        </div>
        <form id="add-comment-form">
          <textarea id="comment-text-input" class="comment-textarea" rows="3" placeholder="अपनी टिप्पणी लिखें... (Write your comment here...)" required></textarea>
          <div class="comment-form-actions">
            <button type="submit" id="btn-submit-comment" class="btn-post-comment">
              <i class="fas fa-paper-plane"></i> टिप्पणी पोस्ट करें (Post Comment)
            </button>
          </div>
        </form>
      </div>
    `;
  } else {
    formContainer.innerHTML = `
      <div class="comment-input-box">
        <form id="add-comment-form">
          <div style="margin-bottom: 12px;">
            <input type="text" id="comment-author-name" class="contact-input" placeholder="आपका नाम (Your Name) *" required style="width: 100%; padding: 10px 14px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--input-bg); color: var(--text-main); font-family: inherit;">
          </div>
          <textarea id="comment-text-input" class="comment-textarea" rows="3" placeholder="अपनी टिप्पणी या विचार लिखें... (Write your comment here...)" required></textarea>
          <div class="comment-form-actions">
            <button type="submit" id="btn-submit-comment" class="btn-post-comment">
              <i class="fas fa-paper-plane"></i> टिप्पणी पोस्ट करें (Post Comment)
            </button>
          </div>
        </form>
      </div>
    `;
  }

  const form = document.getElementById('add-comment-form');
  if (form) {
    form.addEventListener('submit', handleAddComment);
  }
}

// Post a comment handler
async function handleAddComment(e) {
  e.preventDefault();
  const textInput = document.getElementById('comment-text-input');
  const nameInput = document.getElementById('comment-author-name');
  const btnSubmit = document.getElementById('btn-submit-comment');
  const commentsContainer = document.getElementById('blog-comments-container');

  if (!textInput || !commentsContainer) return;

  const postId = commentsContainer.getAttribute('data-post-id') || 'general';
  const text = textInput.value.trim();
  const authorName = currentUser 
    ? (currentUser.displayName || currentUser.email?.split('@')[0] || 'User')
    : (nameInput ? nameInput.value.trim() : 'Guest Reader');

  if (!text || !authorName) return;

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> पोस्ट हो रहा है...';

  try {
    await addDoc(collection(db, 'comments'), {
      postId: postId,
      userId: currentUser ? currentUser.uid : 'guest',
      authorName: authorName,
      authorEmail: currentUser ? (currentUser.email || '') : '',
      authorAvatar: currentUser ? (currentUser.photoURL || '') : '',
      text: text,
      createdAt: new Date().toISOString()
    });

    textInput.value = '';
    if (nameInput) nameInput.value = '';
  } catch (err) {
    console.error('Error adding comment:', err);
    alert('टिप्पणी पोस्ट करने में त्रुटि हुई। कृपया पुनः प्रयास करें। (Error posting comment)');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> टिप्पणी पोस्ट करें (Post Comment)';
  }
}

// Delete a comment
async function handleDeleteComment(commentId) {
  if (!confirm('क्या आप वाकई इस टिप्पणी को हटाना चाहते हैं? (Are you sure you want to delete this comment?)')) {
    return;
  }
  try {
    await deleteDoc(doc(db, 'comments', commentId));
  } catch (err) {
    console.error('Error deleting comment:', err);
    alert('टिप्पणी हटाने में त्रुटि हुई। (Error deleting comment)');
  }
}

// Initialize Comments Section for a blog post
function initComments() {
  const container = document.getElementById('blog-comments-container');
  if (!container) return;

  const postId = container.getAttribute('data-post-id') || 'general';

  container.innerHTML = `
    <div class="blog-comments-section">
      <div class="comments-header">
        <h3 class="comments-title"><i class="fas fa-comments"></i> टिप्पणियाँ (Comments)</h3>
        <span id="comments-count-badge" class="comments-count-badge">0</span>
      </div>

      <div id="comments-form-wrapper"></div>

      <div id="comments-list" class="comments-list">
        <div class="comments-loading">
          <i class="fas fa-spinner fa-spin"></i> टिप्पणियाँ लोड हो रही हैं... (Loading comments...)
        </div>
      </div>
    </div>
  `;

  renderCommentForm();

  // Listen for real-time comment updates from Firestore
  const q = query(
    collection(db, 'comments'),
    where('postId', '==', postId)
  );

  if (commentsUnsubscribe) {
    commentsUnsubscribe();
  }

  commentsUnsubscribe = onSnapshot(q, (snapshot) => {
    const commentsListEl = document.getElementById('comments-list');
    const countBadge = document.getElementById('comments-count-badge');
    if (!commentsListEl) return;

    const comments = [];
    snapshot.forEach((docSnap) => {
      comments.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    // Client-side sort by createdAt descending
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (countBadge) {
      countBadge.textContent = comments.length;
    }

    if (comments.length === 0) {
      commentsListEl.innerHTML = `
        <div class="comments-empty-state">
          <i class="far fa-comment-dots"></i>
          <p>अभी तक कोई टिप्पणी नहीं है। सबसे पहले अपनी राय व्यक्त करें!</p>
          <span style="font-size: 0.85rem; color: var(--text-light);">(No comments yet. Be the first to share your thoughts!)</span>
        </div>
      `;
      return;
    }

    commentsListEl.innerHTML = comments.map((comment) => {
      const isOwner = currentUser && currentUser.uid === comment.userId;
      const initial = (comment.authorName || 'U').charAt(0).toUpperCase();

      return `
        <div class="comment-card" id="comment-${comment.id}">
          <div class="comment-card-header">
            <div class="comment-author-info">
              <div class="comment-avatar">
                ${comment.authorAvatar ? `<img src="${escapeHtml(comment.authorAvatar)}" alt="Avatar">` : initial}
              </div>
              <div>
                <div class="comment-author-name">
                  ${escapeHtml(comment.authorName)}
                  <span class="comment-verified-badge" title="Verified User"><i class="fas fa-check-circle"></i></span>
                </div>
                <div class="comment-time">${formatDate(comment.createdAt)}</div>
              </div>
            </div>
            ${isOwner ? `
              <button class="btn-delete-comment" data-id="${comment.id}" title="Delete comment">
                <i class="fas fa-trash-alt"></i>
              </button>
            ` : ''}
          </div>
          <div class="comment-body-text">${escapeHtml(comment.text)}</div>
        </div>
      `;
    }).join('');

    // Attach delete listeners
    document.querySelectorAll('.btn-delete-comment').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const commentId = e.currentTarget.getAttribute('data-id');
        if (commentId) {
          handleDeleteComment(commentId);
        }
      });
    });
  }, (error) => {
    console.error('Firestore comments subscription error:', error);
    const commentsListEl = document.getElementById('comments-list');
    if (commentsListEl) {
      commentsListEl.innerHTML = `
        <div class="comments-empty-state" style="color: #ef4444;">
          <i class="fas fa-exclamation-triangle"></i>
          <p>टिप्पणियाँ लोड करने में असमर्थ। (Failed to load comments)</p>
        </div>
      `;
    }
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initComments);
} else {
  initComments();
}
