/**
 * Blog Enhancements Module for Pavan Digital Service
 * - Reading Time Estimator
 * - 1-Click Social Sharing (WhatsApp, Twitter/X, Facebook, LinkedIn, Native/Copy Link)
 * - Real-time Like / Clap Reactions synced with Firestore
 * - Related Articles Recommendation
 */

import { db, auth } from './auth.js';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    increment, 
    onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const BLOG_POSTS_DATA = [
    {
        id: 'blog-post-1',
        url: 'blog-post-1.html',
        title: 'भारतीय राजनीती में सुधार',
        excerpt: 'भारतीय राजनीति में पार्टियों का वर्चस्व, धनबल और करप्शन के खिलाफ 1 करोड़ निर्दलीय उम्मीदवारों का विजन।',
        image: 'politics.png',
        date: 'March 03, 2026'
    },
    {
        id: 'blog-post-2',
        url: 'blog-2.html',
        title: 'भारत की शिक्षा व्यावस्था और उसमे सुधार',
        excerpt: 'भारत की वर्तमान शिक्षा प्रणाली में बदलाव, डिग्रियों के बजाय स्किल्स और रोजगार उन्मुख शिक्षा की आवश्यकता।',
        image: 'education.png',
        date: 'February 25, 2026'
    },
    {
        id: 'blog-post-3',
        url: 'blog-3.html',
        title: 'विकसित भारत',
        excerpt: 'कर्ज के जाल और आर्थिक चुनौतियों से निकलकर कैसे बनेगा वास्तव में विकसित और आत्मनिर्भर भारत।',
        image: 'growindia.png',
        date: 'February 18, 2026'
    }
];

function initBlogEnhancements() {
    const postContainer = document.querySelector('.blog-post-container');
    if (!postContainer) return;

    // Detect current post ID
    const commentsContainer = document.getElementById('blog-comments-container');
    let currentPostId = commentsContainer ? commentsContainer.getAttribute('data-post-id') : null;

    if (!currentPostId) {
        const path = window.location.pathname;
        if (path.includes('blog-2')) currentPostId = 'blog-post-2';
        else if (path.includes('blog-3')) currentPostId = 'blog-post-3';
        else currentPostId = 'blog-post-1';
    }

    const currentPost = BLOG_POSTS_DATA.find(p => p.id === currentPostId) || BLOG_POSTS_DATA[0];

    // 1. Reading Time Calculation
    calculateAndDisplayReadingTime(postContainer);

    // 2. Insert Top & Bottom Social Share & Like Bar
    insertShareAndLikeBar(postContainer, currentPostId, currentPost);

    // 3. Insert Related Posts before comments
    insertRelatedPosts(postContainer, currentPostId);

    // 4. Initialize Real-Time Likes
    initPostLikes(currentPostId);
}

// 1. Reading Time
function calculateAndDisplayReadingTime(container) {
    const textContent = container.querySelector('.blog-post-content')?.innerText || container.innerText;
    // Count words (splitting whitespace)
    const words = textContent.trim().split(/\s+/).length;
    // Average reading speed: ~180-200 wpm
    const readingTime = Math.max(1, Math.ceil(words / 180));

    const dateSpan = container.querySelector('.blog-card-date');
    if (dateSpan) {
        const badge = document.createElement('span');
        badge.className = 'reading-time-badge';
        badge.innerHTML = `<i class="far fa-clock"></i> ${readingTime} min read (${readingTime} मिनट का समय)`;
        dateSpan.appendChild(badge);
    }
}

// 2. Share & Like Bar
function insertShareAndLikeBar(container, postId, post) {
    const pageUrl = window.location.href;
    const pageTitle = post.title || document.title;
    const encodedUrl = encodeURIComponent(pageUrl);
    const encodedTitle = encodeURIComponent(`${pageTitle} - Pavan Digital Service Blog`);

    const shareBarHTML = `
        <div class="blog-actions-bar" id="blog-actions-${postId}">
            <div class="blog-like-wrapper">
                <button class="btn-blog-like" id="btn-blog-like" data-post-id="${postId}" aria-label="Like this post">
                    <i class="far fa-heart heart-icon"></i>
                    <span class="like-label">पसंद आया (Like)</span>
                    <span class="like-count" id="like-count-badge">0</span>
                </button>
            </div>

            <div class="blog-share-wrapper">
                <span class="share-label"><i class="fas fa-share-alt"></i> साझा करें (Share):</span>
                <div class="share-buttons">
                    <a href="https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}" target="_blank" rel="noopener noreferrer" class="share-btn wa-share" title="Share on WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </a>
                    <a href="https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="share-btn x-share" title="Share on X (Twitter)">
                        <i class="fab fa-x-twitter"></i>
                    </a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="share-btn fb-share" title="Share on Facebook">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="share-btn in-share" title="Share on LinkedIn">
                        <i class="fab fa-linkedin-in"></i>
                    </a>
                    <button class="share-btn copy-share" id="btn-copy-post-link" title="Copy Link">
                        <i class="fas fa-link"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Insert after the main content before related posts & comments
    const content = container.querySelector('.blog-post-content');
    if (content) {
        content.insertAdjacentHTML('afterend', shareBarHTML);
    } else {
        container.insertAdjacentHTML('beforeend', shareBarHTML);
    }

    // Attach Copy Link Listener
    const copyBtn = document.getElementById('btn-copy-post-link');
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            try {
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(pageUrl);
                } else {
                    const temp = document.createElement('input');
                    temp.value = pageUrl;
                    document.body.appendChild(temp);
                    temp.select();
                    document.execCommand('copy');
                    temp.remove();
                }
                showShareToast('ब्लॉग का लिंक कॉपी हो गया! (Link copied!)');
            } catch (err) {
                showShareToast('लिंक कॉपी किया गया!');
            }
        });
    }
}

// Toast notification
function showShareToast(message) {
    let toast = document.getElementById('share-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'share-toast';
        toast.className = 'share-toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

// 3. Related Posts
function insertRelatedPosts(container, currentPostId) {
    const related = BLOG_POSTS_DATA.filter(p => p.id !== currentPostId);
    if (related.length === 0) return;

    const relatedHTML = `
        <div class="related-posts-section">
            <h3 class="related-posts-title"><i class="fas fa-newspaper"></i> संबंधित ब्लॉग पोस्ट्स (Related Articles)</h3>
            <div class="related-posts-grid">
                ${related.map(p => `
                    <a href="${p.url}" class="related-post-card">
                        <div class="related-post-img-wrap">
                            <img src="${p.image}" alt="${p.title}" class="related-post-img" loading="lazy" />
                        </div>
                        <div class="related-post-info">
                            <span class="related-post-date"><i class="far fa-calendar-alt"></i> ${p.date}</span>
                            <h4 class="related-post-heading">${p.title}</h4>
                            <p class="related-post-excerpt">${p.excerpt.slice(0, 80)}...</p>
                            <span class="related-post-link">पूरा पढ़ें (Read More) <i class="fas fa-arrow-right"></i></span>
                        </div>
                    </a>
                `).join('')}
            </div>
        </div>
    `;

    const commentsWrapper = document.getElementById('blog-comments-container');
    if (commentsWrapper) {
        commentsWrapper.insertAdjacentHTML('beforebegin', relatedHTML);
    } else {
        container.insertAdjacentHTML('beforeend', relatedHTML);
    }
}

// 4. Firestore Real-Time Likes
function initPostLikes(postId) {
    const likeBtn = document.getElementById('btn-blog-like');
    const countBadge = document.getElementById('like-count-badge');
    if (!likeBtn || !countBadge) return;

    const storageKey = `liked_${postId}`;
    let userHasLiked = localStorage.getItem(storageKey) === 'true';

    function updateLikeUI(count, hasLiked) {
        countBadge.textContent = count || 0;
        const icon = likeBtn.querySelector('.heart-icon');
        if (hasLiked) {
            likeBtn.classList.add('liked');
            if (icon) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            }
        } else {
            likeBtn.classList.remove('liked');
            if (icon) {
                icon.classList.remove('fas');
                icon.classList.add('far');
            }
        }
    }

    updateLikeUI(0, userHasLiked);

    const docRef = doc(db, 'likes', postId);

    // Listen for live updates
    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            updateLikeUI(data.likesCount || 0, userHasLiked);
        } else {
            // Document doesn't exist yet, seed it
            setDoc(docRef, { likesCount: 0, postId: postId }).catch(() => {});
        }
    }, (err) => {
        console.warn('Likes onSnapshot error:', err);
    });

    // Handle Like Toggle
    likeBtn.addEventListener('click', async () => {
        userHasLiked = !userHasLiked;
        localStorage.setItem(storageKey, userHasLiked ? 'true' : 'false');
        
        likeBtn.classList.add('heart-burst');
        setTimeout(() => likeBtn.classList.remove('heart-burst'), 500);

        try {
            const currentSnap = await getDoc(docRef);
            if (!currentSnap.exists()) {
                await setDoc(docRef, { 
                    likesCount: userHasLiked ? 1 : 0, 
                    postId: postId 
                });
            } else {
                await updateDoc(docRef, {
                    likesCount: increment(userHasLiked ? 1 : -1)
                });
            }
        } catch (err) {
            console.error('Error toggling like:', err);
        }
    });
}

// Auto-run when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlogEnhancements);
} else {
    initBlogEnhancements();
}
