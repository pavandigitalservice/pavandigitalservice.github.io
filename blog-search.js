/**
 * Real-time Blog Search & Filtering Engine
 * Filters blog posts dynamically by title, excerpt, date, or keywords.
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('blog-search-input');
    const clearBtn = document.getElementById('blog-search-clear');
    const searchStats = document.getElementById('blog-search-stats');
    const blogGrid = document.getElementById('blog-grid');
    const noResults = document.getElementById('blog-no-results');
    const resetBtn = document.getElementById('btn-reset-blog-search');

    if (!searchInput || !blogGrid) return;

    const blogCards = Array.from(blogGrid.querySelectorAll('.blog-card'));
    const totalPosts = blogCards.length;

    // Normalize text for flexible multi-language search (Devanagari + English)
    const normalize = (text) => {
        return (text || '')
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ');
    };

    // Pre-extract searchable text per card for maximum search performance
    const cardData = blogCards.map(card => {
        const title = card.querySelector('.blog-card-title')?.textContent || '';
        const excerpt = card.querySelector('.blog-card-excerpt')?.textContent || '';
        const date = card.querySelector('.blog-card-date')?.textContent || '';
        const keywords = card.getAttribute('data-keywords') || '';
        const customTitle = card.getAttribute('data-title') || '';

        const fullSearchableText = normalize(`${title} ${excerpt} ${date} ${keywords} ${customTitle}`);

        return {
            element: card,
            searchableText: fullSearchableText,
            title: title
        };
    });

    // Update stats counter text
    const updateStats = (matchedCount, query) => {
        if (!searchStats) return;

        if (!query) {
            searchStats.innerHTML = `${totalPosts} ब्लॉग उपलब्ध हैं (${totalPosts} blogs available)`;
        } else {
            searchStats.innerHTML = `<strong>${matchedCount}</strong> / ${totalPosts} ब्लॉग मिले (${matchedCount} of ${totalPosts} blogs found)`;
        }
    };

    // Execute filtering
    const filterBlogs = () => {
        const rawQuery = searchInput.value;
        const query = normalize(rawQuery);

        // Toggle clear button visibility
        if (clearBtn) {
            clearBtn.style.display = rawQuery.trim().length > 0 ? 'flex' : 'none';
        }

        let visibleCount = 0;

        // Split query into terms to allow multi-keyword matching (e.g. "भारत शिक्षा")
        const terms = query.split(' ').filter(term => term.length > 0);

        cardData.forEach(item => {
            let isMatch = true;

            if (terms.length > 0) {
                // Every term must be present in the searchable text
                isMatch = terms.every(term => item.searchableText.includes(term));
            }

            if (isMatch) {
                item.element.classList.remove('blog-card-hidden');
                item.element.style.display = 'flex';
                visibleCount++;
            } else {
                item.element.classList.add('blog-card-hidden');
                item.element.style.display = 'none';
            }
        });

        // Show/hide No Results section
        if (noResults) {
            if (visibleCount === 0) {
                noResults.style.display = 'block';
                blogGrid.style.display = 'none';
            } else {
                noResults.style.display = 'none';
                blogGrid.style.display = 'grid';
            }
        }

        updateStats(visibleCount, query);
    };

    // Event: Real-time typing in search input
    searchInput.addEventListener('input', filterBlogs);

    // Event: Clear button click
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.focus();
            filterBlogs();
        });
    }

    // Event: Reset button in "No Results"
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.focus();
            filterBlogs();
        });
    }

    // Event: Escape key clears search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            filterBlogs();
        }
    });

    // Initial stats set
    updateStats(totalPosts, '');
});
