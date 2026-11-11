/**
 * Floating WhatsApp Chat Widget for Pavan Digital Service
 * Provides quick pre-filled queries and instant WhatsApp redirection.
 */

(function () {
    const WHATSAPP_PHONE = '919179579308'; // Business WhatsApp number
    const BUSINESS_NAME = 'Pavan Digital Service';

    function initWhatsAppWidget() {
        if (document.getElementById('pavan-wa-widget-container')) return;

        const widgetHTML = `
            <div id="pavan-wa-widget-container" class="wa-widget-container">
                <!-- Chat Popup Window -->
                <div id="wa-chat-popup" class="wa-chat-popup" style="display: none;">
                    <div class="wa-popup-header">
                        <div class="wa-header-avatar">
                            <i class="fab fa-whatsapp"></i>
                        </div>
                        <div class="wa-header-info">
                            <span class="wa-header-name">${BUSINESS_NAME}</span>
                            <span class="wa-header-status"><span class="wa-status-dot"></span> ऑनलाइन (Active Now)</span>
                        </div>
                        <button id="wa-popup-close" class="wa-close-btn" aria-label="Close Chat">&times;</button>
                    </div>

                    <div class="wa-popup-body">
                        <div class="wa-message-bubble incoming">
                            <p>नमस्ते! 🙏<br>हम आपकी क्या सहायता कर सकते हैं? (How can we help you today with App Development or Website?)</p>
                            <span class="wa-msg-time">Just now</span>
                        </div>

                        <div class="wa-quick-options">
                            <p class="wa-quick-title">त्वरित विकल्प चुनें (Quick Inquiries):</p>
                            <button class="wa-quick-btn" data-msg="नमस्ते! मुझे एक नया एंड्रॉइड ऐप (Android App) बनवाना है। कृपया डिटेल्स और कोटेशन दें।">
                                📱 Android App बनवाना है
                            </button>
                            <button class="wa-quick-btn" data-msg="नमस्ते! मुझे अपनी दुकान/बिजनेस के लिए वेबसाइट (Website Design) बनवानी है।">
                                💻 Website बनवानी है
                            </button>
                            <button class="wa-quick-btn" data-msg="नमस्ते! मुझे आपकी डिजिटल सेवाओं (Digital Services) की जानकारी चाहिए।">
                                🚀 अन्य डिजिटल सेवा की जानकारी
                            </button>
                        </div>
                    </div>

                    <div class="wa-popup-footer">
                        <div class="wa-input-row">
                            <input type="text" id="wa-custom-msg" placeholder="अपना संदेश लिखें... (Type message)" />
                            <button id="wa-send-btn" class="wa-send-btn" aria-label="Send to WhatsApp">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Floating Trigger Button -->
                <div class="wa-floating-btn-wrap">
                    <button id="wa-trigger-btn" class="wa-trigger-btn" aria-label="Chat on WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                        <span class="wa-btn-badge">1</span>
                    </button>
                    <div class="wa-btn-tooltip">WhatsApp पर चैट करें</div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHTML);

        const triggerBtn = document.getElementById('wa-trigger-btn');
        const popup = document.getElementById('wa-chat-popup');
        const closeBtn = document.getElementById('wa-popup-close');
        const customInput = document.getElementById('wa-custom-msg');
        const sendBtn = document.getElementById('wa-send-btn');
        const quickBtns = document.querySelectorAll('.wa-quick-btn');

        function openWhatsApp(message) {
            const encoded = encodeURIComponent(message || 'नमस्ते Pavan Digital Service! मुझे अधिक जानकारी चाहिए।');
            const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encoded}`;
            window.open(waUrl, '_blank', 'noopener,noreferrer');
        }

        if (triggerBtn && popup) {
            triggerBtn.addEventListener('click', () => {
                const isHidden = popup.style.display === 'none' || !popup.style.display;
                popup.style.display = isHidden ? 'flex' : 'none';
                if (isHidden) {
                    const badge = document.querySelector('.wa-btn-badge');
                    if (badge) badge.style.display = 'none';
                    if (customInput) customInput.focus();
                }
            });
        }

        if (closeBtn && popup) {
            closeBtn.addEventListener('click', () => {
                popup.style.display = 'none';
            });
        }

        quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const msg = btn.getAttribute('data-msg');
                openWhatsApp(msg);
                if (popup) popup.style.display = 'none';
            });
        });

        const handleSend = () => {
            const text = customInput ? customInput.value.trim() : '';
            if (text) {
                openWhatsApp(text);
                if (customInput) customInput.value = '';
                if (popup) popup.style.display = 'none';
            }
        };

        if (sendBtn) sendBtn.addEventListener('click', handleSend);
        if (customInput) {
            customInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleSend();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWhatsAppWidget);
    } else {
        initWhatsAppWidget();
    }
})();
