/**
 * Project Quote / Service Request Modal
 * Saves lead inquiries to Firestore and offers instant WhatsApp notification.
 */

import { db, auth } from './auth.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

(function () {
    const WHATSAPP_PHONE = '919179579308';

    function initQuoteModal() {
        if (document.getElementById('quote-modal-overlay')) return;

        const modalHTML = `
            <!-- Quote Modal Overlay -->
            <div id="quote-modal-overlay" class="quote-modal-overlay" style="display: none;">
                <div class="quote-modal-card">
                    <button id="quote-modal-close" class="modal-close-btn" aria-label="Close">&times;</button>
                    
                    <div class="quote-modal-header">
                        <div class="quote-icon-badge"><i class="fas fa-rocket"></i></div>
                        <h3>मुफ़्त प्रोजेक्ट कोटेशन प्राप्त करें</h3>
                        <p>Get a Free Quote & Project Consultation</p>
                    </div>

                    <div id="quote-alert" class="auth-alert" style="display: none;"></div>

                    <form id="quote-request-form">
                        <div class="quote-form-grid">
                            <div class="auth-form-group">
                                <label for="quote-name">आपका नाम (Your Name) *</label>
                                <div class="auth-input-wrapper">
                                    <i class="fas fa-user"></i>
                                    <input type="text" id="quote-name" required placeholder="उदा. राहुल वर्मा" />
                                </div>
                            </div>

                            <div class="auth-form-group">
                                <label for="quote-phone">मोबाइल / WhatsApp नंबर *</label>
                                <div class="auth-input-wrapper">
                                    <i class="fas fa-phone-alt"></i>
                                    <input type="tel" id="quote-phone" required placeholder="उदा. 9876543210" />
                                </div>
                            </div>
                        </div>

                        <div class="auth-form-group">
                            <label for="quote-email">ईमेल (Email Address)</label>
                            <div class="auth-input-wrapper">
                                <i class="fas fa-envelope"></i>
                                <input type="email" id="quote-email" placeholder="you@example.com" />
                            </div>
                        </div>

                        <div class="quote-form-grid">
                            <div class="auth-form-group">
                                <label for="quote-service">आवश्यक सेवा (Service Required) *</label>
                                <div class="auth-input-wrapper">
                                    <i class="fas fa-layer-group"></i>
                                    <select id="quote-service" class="quote-select" required>
                                        <option value="Android App Development">📱 Android App Development</option>
                                        <option value="Website Design & Development">💻 Website Design & Development</option>
                                        <option value="UI/UX Design">🎨 UI/UX Design</option>
                                        <option value="E-Commerce & Digital Store">🛒 E-Commerce Solutions</option>
                                        <option value="Other Digital Service">🚀 अन्य डिजिटल सेवा (Other)</option>
                                    </select>
                                </div>
                            </div>

                            <div class="auth-form-group">
                                <label for="quote-budget">अनुमानित बजट (Estimated Budget)</label>
                                <div class="auth-input-wrapper">
                                    <i class="fas fa-rupee-sign"></i>
                                    <select id="quote-budget" class="quote-select">
                                        <option value="₹5,000 - ₹15,000">₹5,000 - ₹15,000</option>
                                        <option value="₹15,000 - ₹35,000">₹15,000 - ₹35,000</option>
                                        <option value="₹35,000 - ₹75,000">₹35,000 - ₹75,000</option>
                                        <option value="₹75,000+">₹75,000+</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="auth-form-group">
                            <label for="quote-details">प्रोजेक्ट की जानकारी (Project Brief / Details)</label>
                            <textarea id="quote-details" class="quote-textarea" rows="3" placeholder="अपने प्रोजेक्ट के बारे में कुछ बताएं (उदा. ऐप में क्या-क्या फीचर्स चाहिए)..."></textarea>
                        </div>

                        <div class="quote-actions-row">
                            <button type="submit" id="btn-submit-quote" class="btn-quote-submit">
                                <i class="fas fa-paper-plane"></i> कोटेशन सबमिट करें (Submit Request)
                            </button>
                        </div>
                    </form>

                    <div id="quote-success-state" style="display: none; text-align: center; padding: 20px 10px;">
                        <div class="quote-success-icon"><i class="fas fa-check-circle"></i></div>
                        <h4 style="color: #10b981; margin-bottom: 8px;">कोटेशन अनुरोध प्राप्त हुआ!</h4>
                        <p style="font-size: 0.95rem; color: var(--text-light); margin-bottom: 20px;">
                            धन्यवाद! हम आपके प्रोजेक्ट विवरण की समीक्षा करके जल्द ही आपसे संपर्क करेंगे।
                        </p>
                        <button id="btn-whatsapp-followup" class="btn-quote-wa">
                            <i class="fab fa-whatsapp"></i> तुरंत WhatsApp पर बात करें (Chat on WhatsApp)
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const overlay = document.getElementById('quote-modal-overlay');
        const closeBtn = document.getElementById('quote-modal-close');
        const form = document.getElementById('quote-request-form');
        const alertEl = document.getElementById('quote-alert');
        const successState = document.getElementById('quote-success-state');
        const submitBtn = document.getElementById('btn-submit-quote');

        let lastSubmittedData = null;

        window.openQuoteModal = function (presetService) {
            if (overlay) {
                overlay.style.display = 'flex';
                if (form) form.style.display = 'block';
                if (successState) successState.style.display = 'none';
                if (alertEl) alertEl.style.display = 'none';

                if (presetService) {
                    const sel = document.getElementById('quote-service');
                    if (sel) sel.value = presetService;
                }

                // Prefill if logged in
                if (auth.currentUser) {
                    const nameInput = document.getElementById('quote-name');
                    const emailInput = document.getElementById('quote-email');
                    if (nameInput && !nameInput.value) {
                        nameInput.value = auth.currentUser.displayName || '';
                    }
                    if (emailInput && !emailInput.value) {
                        emailInput.value = auth.currentUser.email || '';
                    }
                }
            }
        };

        if (closeBtn && overlay) {
            closeBtn.addEventListener('click', () => {
                overlay.style.display = 'none';
            });
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.style.display = 'none';
            });
        }

        // Attach to all elements with class 'btn-trigger-quote'
        document.querySelectorAll('.btn-trigger-quote').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const service = btn.getAttribute('data-service') || '';
                window.openQuoteModal(service);
            });
        });

        // Form submission
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('quote-name').value.trim();
                const phone = document.getElementById('quote-phone').value.trim();
                const email = document.getElementById('quote-email').value.trim();
                const service = document.getElementById('quote-service').value;
                const budget = document.getElementById('quote-budget').value;
                const details = document.getElementById('quote-details').value.trim();

                if (!name || !phone) {
                    alertEl.textContent = 'कृपया अपना नाम और फ़ोन नंबर दर्ज करें।';
                    alertEl.className = 'auth-alert error';
                    alertEl.style.display = 'block';
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> सबमिट हो रहा है...';

                try {
                    await addDoc(collection(db, 'inquiries'), {
                        name,
                        phone,
                        email: email || '',
                        service,
                        budget,
                        details: details || '',
                        userId: auth.currentUser ? auth.currentUser.uid : null,
                        createdAt: new Date().toISOString()
                    });

                    lastSubmittedData = { name, phone, service, budget, details };

                    form.style.display = 'none';
                    successState.style.display = 'block';
                    form.reset();
                } catch (err) {
                    console.error('Error saving quote inquiry:', err);
                    alertEl.textContent = 'अनुरोध भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें या सीधे WhatsApp करें।';
                    alertEl.className = 'auth-alert error';
                    alertEl.style.display = 'block';
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> कोटेशन सबमिट करें (Submit Request)';
                }
            });
        }

        // WhatsApp followup button
        const waFollowup = document.getElementById('btn-whatsapp-followup');
        if (waFollowup) {
            waFollowup.addEventListener('click', () => {
                let msg = 'नमस्ते Pavan Digital Service! मैंने वेबसाइट पर प्रोजेक्ट कोटेशन सबमिट किया है।';
                if (lastSubmittedData) {
                    msg = `नमस्ते Pavan! मेरा नाम ${lastSubmittedData.name} है। मुझे ${lastSubmittedData.service} के लिए कोटेशन चाहिए। (बजट: ${lastSubmittedData.budget}). विवरण: ${lastSubmittedData.details || 'N/A'}`;
                }
                const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
                if (overlay) overlay.style.display = 'none';
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQuoteModal);
    } else {
        initQuoteModal();
    }
})();
