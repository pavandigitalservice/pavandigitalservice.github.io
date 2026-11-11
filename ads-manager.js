/**
 * Safe Google AdSense Initializer & Error Handler
 * Fixes: "TagError: adsbygoogle.push() error: No slot size for availableWidth=0"
 */

// 1. Intercept uncaught AdSense TagErrors globally
window.addEventListener('error', function(event) {
    var msg = (event && event.message) ? event.message : '';
    var isAdSenseError = msg.includes('adsbygoogle') || 
                         msg.includes('availableWidth=0') || 
                         msg.includes('TagError') ||
                         msg.includes('No slot size');
    
    if (isAdSenseError || (event.error && event.error.name === 'TagError')) {
        console.warn('[AdSense] Handled slot size or tag warning safely:', msg);
        if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
        }
        if (typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        return true;
    }
}, true);

// 2. Safe Push Helper
window.safelyPushAd = function(slotElement) {
    if (!slotElement) return;
    
    // Check if already initialized
    if (slotElement.getAttribute('data-ad-pushed') === 'true' || 
        slotElement.getAttribute('data-adsbygoogle-status') === 'done') {
        return;
    }

    var parent = slotElement.parentElement;
    var width = slotElement.offsetWidth || (parent ? parent.offsetWidth : 0);

    // If available width is 0 (e.g. iframe hidden, tab in background, or initial render pass)
    if (width <= 0) {
        // Wait for container to receive positive width using ResizeObserver or resize event
        if (typeof window.ResizeObserver !== 'undefined' && parent) {
            var ro = new ResizeObserver(function(entries) {
                for (var i = 0; i < entries.length; i++) {
                    var entryWidth = entries[i].contentRect ? entries[i].contentRect.width : 0;
                    if (entryWidth > 0) {
                        ro.disconnect();
                        window.safelyPushAd(slotElement);
                        break;
                    }
                }
            });
            ro.observe(parent);
        } else {
            // Fallback timeout check
            setTimeout(function() {
                window.safelyPushAd(slotElement);
            }, 300);
        }
        return;
    }

    // Available width > 0, proceed safely
    slotElement.setAttribute('data-ad-pushed', 'true');
    try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
        console.warn('[AdSense] Push safely deferred or caught:', err);
    }
};

// 3. Scan and initialize all ad units when DOM is ready
function initAllAdSlots() {
    var slots = document.querySelectorAll('ins.adsbygoogle:not([data-ad-pushed="true"])');
    slots.forEach(function(slot) {
        window.safelyPushAd(slot);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllAdSlots);
} else {
    initAllAdSlots();
}

window.addEventListener('load', initAllAdSlots);
window.addEventListener('resize', initAllAdSlots);
