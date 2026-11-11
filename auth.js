import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Firebase Configuration
const firebaseConfig = {
  projectId: "protean-net-gt8c4",
  appId: "1:559588778703:web:02bf795b4762ba282d0dba",
  apiKey: "AIzaSyAKeTnxf8sgxJ0LFyKm_8blDekfGzXqvhI",
  authDomain: "protean-net-gt8c4.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-pavandigitalserv-bef95f79-463c-4885-b7c6-810e323ba7d4",
  storageBucket: "protean-net-gt8c4.firebasestorage.app",
  messagingSenderId: "559588778703"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Global user state
let currentUser = null;

// Human readable error messages
function getErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें। (Email is already registered)';
    case 'auth/invalid-email':
      return 'अमान्य ईमेल पता। (Invalid email address)';
    case 'auth/weak-password':
      return 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए। (Password must be at least 6 characters)';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'ईमेल या पासवर्ड गलत है। (Invalid email or password)';
    case 'auth/popup-closed-by-user':
      return 'गूगल साइन-इन खिड़की बंद कर दी गई। (Google Sign-In popup closed)';
    default:
      return 'एक त्रुटि हुई। कृपया पुन: प्रयास करें। (An error occurred. Please try again)';
  }
}

// Save or sync user profile in Firestore
async function syncUserProfile(user) {
  if (!user) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('Firestore user profile sync error:', err);
  }
}

// Inject Auth UI HTML dynamically
function injectAuthUI() {
  // Inject into NAV if not existing
  const nav = document.querySelector('nav');
  const themeToggle = document.getElementById('theme-toggle');

  if (nav && !document.getElementById('auth-nav-container')) {
    const navContainer = document.createElement('div');
    navContainer.id = 'auth-nav-container';
    navContainer.style.display = 'inline-flex';
    navContainer.style.alignItems = 'center';

    navContainer.innerHTML = `
      <button id="auth-nav-btn" class="auth-nav-btn">
        <i class="fas fa-user"></i> Login / Signup
      </button>

      <div id="user-nav-container" class="user-nav-container" style="display: none;">
        <div class="user-nav-bar-section">
          <div id="user-nav-profile" class="user-nav-profile" title="View options">
            <div id="user-avatar" class="user-avatar">U</div>
            <div class="user-nav-details">
              <span id="user-nav-name" class="user-nav-name">User</span>
              <span id="user-nav-email" class="user-nav-email">user@example.com</span>
            </div>
            <i class="fas fa-chevron-down" style="font-size: 0.75rem; color: var(--text-light); margin-left: 2px;"></i>
          </div>

          <button id="nav-direct-logout" class="nav-logout-btn" title="Logout">
            <i class="fas fa-sign-out-alt"></i> <span>Logout</span>
          </button>
        </div>

        <div id="user-dropdown-menu" class="user-dropdown-menu">
          <div class="dropdown-header">
            <div id="dropdown-user-name" class="user-full-name">User Name</div>
            <div id="dropdown-user-email" class="user-email">user@example.com</div>
          </div>
          <button id="btn-view-profile" class="dropdown-item">
            <i class="fas fa-id-card"></i> My Profile
          </button>
          <button id="btn-reset-pw" class="dropdown-item">
            <i class="fas fa-key"></i> Reset Password
          </button>
          <button id="btn-logout" class="dropdown-item danger">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
    `;

    if (themeToggle) {
      nav.insertBefore(navContainer, themeToggle);
    } else {
      nav.appendChild(navContainer);
    }
  }

  // Inject Modals into body
  if (!document.getElementById('auth-modal-overlay')) {
    const modalHTML = `
      <!-- Authentication Modal -->
      <div id="auth-modal-overlay" class="auth-modal-overlay">
        <div class="auth-modal-card">
          <button id="auth-modal-close" class="modal-close-btn"><i class="fas fa-times"></i></button>
          
          <div class="auth-header">
            <h3 id="auth-modal-title">Welcome</h3>
            <p id="auth-modal-subtitle">Pavan Digital Service - Account</p>
          </div>

          <div class="auth-tabs">
            <button id="tab-login" class="auth-tab-btn active">Log In</button>
            <button id="tab-signup" class="auth-tab-btn">Create Account</button>
          </div>

          <div id="auth-alert" class="auth-alert"></div>

          <!-- LOGIN FORM -->
          <form id="login-form">
            <div class="auth-form-group">
              <label for="login-email">Email Address</label>
              <div class="auth-input-wrapper">
                <i class="fas fa-envelope"></i>
                <input type="email" id="login-email" placeholder="you@example.com" required>
              </div>
            </div>

            <div class="auth-form-group">
              <label for="login-password">Password</label>
              <div class="auth-input-wrapper">
                <i class="fas fa-lock"></i>
                <input type="password" id="login-password" placeholder="••••••••" required>
              </div>
              <a href="#" id="link-forgot-pw" class="auth-forgot-link">Forgot Password?</a>
            </div>

            <button type="submit" id="btn-submit-login" class="auth-btn-submit">
              <i class="fas fa-sign-in-alt"></i> Log In
            </button>
          </form>

          <!-- SIGNUP FORM -->
          <form id="signup-form" style="display: none;">
            <div class="auth-form-group">
              <label for="signup-name">Full Name</label>
              <div class="auth-input-wrapper">
                <i class="fas fa-user"></i>
                <input type="text" id="signup-name" placeholder="Your Name" required>
              </div>
            </div>

            <div class="auth-form-group">
              <label for="signup-email">Email Address</label>
              <div class="auth-input-wrapper">
                <i class="fas fa-envelope"></i>
                <input type="email" id="signup-email" placeholder="you@example.com" required>
              </div>
            </div>

            <div class="auth-form-group">
              <label for="signup-password">Password</label>
              <div class="auth-input-wrapper">
                <i class="fas fa-lock"></i>
                <input type="password" id="signup-password" placeholder="Min 6 characters" required minlength="6">
              </div>
            </div>

            <button type="submit" id="btn-submit-signup" class="auth-btn-submit">
              <i class="fas fa-user-plus"></i> Create Account
            </button>
          </form>

          <div class="auth-divider">
            <span>OR</span>
          </div>

          <button id="btn-google-auth" class="google-auth-btn">
            <i class="fab fa-google"></i> Continue with Google
          </button>
        </div>
      </div>

      <!-- User Profile Modal -->
      <div id="profile-modal-overlay" class="auth-modal-overlay">
        <div class="auth-modal-card">
          <button id="profile-modal-close" class="modal-close-btn"><i class="fas fa-times"></i></button>
          
          <div class="auth-header">
            <div id="profile-modal-avatar" class="user-avatar" style="width: 68px; height: 68px; font-size: 1.8rem; margin: 0 auto 12px auto;">U</div>
            <h3 id="profile-modal-name">User Name</h3>
            <p id="profile-modal-email">user@example.com</p>
          </div>

          <div id="profile-alert" class="auth-alert"></div>

          <!-- VIEW MODE -->
          <div id="profile-view-section">
            <div style="margin-bottom: 20px;">
              <div class="profile-detail-item">
                <i class="fas fa-user"></i>
                <div>
                  <div class="profile-detail-label">Display Name</div>
                  <div id="profile-detail-name" class="profile-detail-value">User</div>
                </div>
              </div>
              <div class="profile-detail-item">
                <i class="fas fa-envelope"></i>
                <div>
                  <div class="profile-detail-label">Email Address</div>
                  <div id="profile-detail-email" class="profile-detail-value">user@example.com</div>
                </div>
              </div>
              <div class="profile-detail-item">
                <i class="fas fa-shield-alt"></i>
                <div>
                  <div class="profile-detail-label">Account UID</div>
                  <div id="profile-detail-uid" class="profile-detail-value" style="font-size: 0.8rem; word-break: break-all;">-</div>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 12px;">
              <button id="btn-edit-profile-toggle" class="auth-btn-submit" style="background: #2563eb; flex: 1;">
                <i class="fas fa-user-edit"></i> Edit Profile
              </button>
              <button id="btn-profile-logout" class="auth-btn-submit" style="background: #ef4444; flex: 1;">
                <i class="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>

          <!-- EDIT MODE -->
          <form id="profile-edit-form" style="display: none;">
            <div class="auth-form-group">
              <label for="edit-profile-name">नाम (Full Name / Display Name)</label>
              <div class="auth-input-wrapper">
                <i class="fas fa-user"></i>
                <input type="text" id="edit-profile-name" required placeholder="अपना नाम दर्ज करें">
              </div>
            </div>

            <div class="auth-form-group">
              <label for="edit-profile-photo">प्रोफाइल फोटो URL (Avatar URL - Optional)</label>
              <div class="auth-input-wrapper">
                <i class="fas fa-image"></i>
                <input type="url" id="edit-profile-photo" placeholder="https://example.com/avatar.jpg">
              </div>
            </div>

            <div class="avatar-presets-wrap" style="margin-bottom: 15px;">
              <span style="font-size: 0.8rem; color: var(--text-light); display: block; margin-bottom: 6px;">या प्रीसेट अवतार चुनें (Or choose avatar):</span>
              <div class="avatar-presets" style="display: flex; gap: 8px; justify-content: center;">
                <button type="button" class="btn-avatar-preset" data-url="https://api.dicebear.com/7.x/bottts/svg?seed=Pavan" title="Robot">🤖</button>
                <button type="button" class="btn-avatar-preset" data-url="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" title="Avataar 1">👨‍💻</button>
                <button type="button" class="btn-avatar-preset" data-url="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" title="Avataar 2">👩‍💼</button>
                <button type="button" class="btn-avatar-preset" data-url="https://api.dicebear.com/7.x/identicon/svg?seed=Digital" title="Pattern">💠</button>
              </div>
            </div>

            <div style="display: flex; gap: 10px;">
              <button type="submit" id="btn-save-profile" class="auth-btn-submit" style="background: #10b981; flex: 1;">
                <i class="fas fa-save"></i> Save Changes
              </button>
              <button type="button" id="btn-cancel-edit-profile" class="auth-btn-submit" style="background: var(--bg-section-light); color: var(--text-main); border: 1px solid var(--border-color); flex: 1;">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
}

// Bind DOM event listeners
function setupAuthEventListeners() {
  const authNavBtn = document.getElementById('auth-nav-btn');
  const authModalOverlay = document.getElementById('auth-modal-overlay');
  const authModalClose = document.getElementById('auth-modal-close');
  
  const profileModalOverlay = document.getElementById('profile-modal-overlay');
  const profileModalClose = document.getElementById('profile-modal-close');

  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const authAlert = document.getElementById('auth-alert');

  const userNavProfile = document.getElementById('user-nav-profile');
  const userDropdownMenu = document.getElementById('user-dropdown-menu');

  const btnGoogleAuth = document.getElementById('btn-google-auth');
  const btnViewProfile = document.getElementById('btn-view-profile');
  const btnResetPw = document.getElementById('btn-reset-pw');
  const btnLogout = document.getElementById('btn-logout');
  const btnProfileLogout = document.getElementById('btn-profile-logout');
  const linkForgotPw = document.getElementById('link-forgot-pw');

  // Open Auth Modal
  if (authNavBtn) {
    authNavBtn.addEventListener('click', () => {
      showAlert('', '');
      showLoginForm();
      authModalOverlay.classList.add('active');
    });
  }

  // Close Modals
  if (authModalClose) {
    authModalClose.addEventListener('click', () => {
      authModalOverlay.classList.remove('active');
    });
  }

  if (profileModalClose) {
    profileModalClose.addEventListener('click', () => {
      profileModalOverlay.classList.remove('active');
    });
  }

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === authModalOverlay) authModalOverlay.classList.remove('active');
    if (e.target === profileModalOverlay) profileModalOverlay.classList.remove('active');
    
    // Dropdown menu toggle close
    if (userNavProfile && userDropdownMenu && !userNavProfile.contains(e.target) && !userDropdownMenu.contains(e.target)) {
      userDropdownMenu.classList.remove('active');
    }
  });

  // Toggle User Dropdown Menu
  if (userNavProfile && userDropdownMenu) {
    userNavProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdownMenu.classList.toggle('active');
    });
  }

  // Switch Tabs
  if (tabLogin && tabSignup) {
    tabLogin.addEventListener('click', () => {
      showAlert('', '');
      showLoginForm();
    });

    tabSignup.addEventListener('click', () => {
      showAlert('', '');
      showSignupForm();
    });
  }

  function showLoginForm() {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
  }

  function showSignupForm() {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
  }

  function showAlert(msg, type = 'error') {
    if (!authAlert) return;
    if (!msg) {
      authAlert.style.display = 'none';
      authAlert.className = 'auth-alert';
      authAlert.textContent = '';
      return;
    }
    authAlert.className = `auth-alert ${type}`;
    authAlert.textContent = msg;
    authAlert.style.display = 'block';
  }

  // Login Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btnSubmit = document.getElementById('btn-submit-login');

      showAlert('', '');
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

      try {
        await signInWithEmailAndPassword(auth, email, password);
        showAlert('लॉगिन सफल! (Login successful)', 'success');
        setTimeout(() => {
          authModalOverlay.classList.remove('active');
          loginForm.reset();
        }, 1000);
      } catch (err) {
        showAlert(getErrorMessage(err.code), 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Log In';
      }
    });
  }

  // Signup Submit
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const btnSubmit = document.getElementById('btn-submit-signup');

      showAlert('', '');
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCred.user, { displayName: name });
        }
        await syncUserProfile(userCred.user);
        showAlert('खाता सफलतापूर्वक बनाया गया! (Account created successfully)', 'success');
        setTimeout(() => {
          authModalOverlay.classList.remove('active');
          signupForm.reset();
        }, 1000);
      } catch (err) {
        showAlert(getErrorMessage(err.code), 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
      }
    });
  }

  // Google Auth
  if (btnGoogleAuth) {
    btnGoogleAuth.addEventListener('click', async () => {
      showAlert('', '');
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        await syncUserProfile(result.user);
        showAlert('गूगल से लॉगिन सफल! (Google login successful)', 'success');
        setTimeout(() => {
          authModalOverlay.classList.remove('active');
        }, 1000);
      } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
          showAlert(getErrorMessage(err.code), 'error');
        }
      }
    });
  }

  // Password Reset Link
  if (linkForgotPw) {
    linkForgotPw.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      if (!email) {
        showAlert('कृपया अपना ईमेल दर्ज करें। (Please enter your email above)', 'error');
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        showAlert('पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है। (Password reset link sent)', 'success');
      } catch (err) {
        showAlert(getErrorMessage(err.code), 'error');
      }
    });
  }

  // Dropdown & Profile Actions
  if (btnViewProfile) {
    btnViewProfile.addEventListener('click', () => {
      if (userDropdownMenu) userDropdownMenu.classList.remove('active');
      openProfileModal();
    });
  }

  if (btnResetPw) {
    btnResetPw.addEventListener('click', async () => {
      if (userDropdownMenu) userDropdownMenu.classList.remove('active');
      if (currentUser && currentUser.email) {
        try {
          await sendPasswordResetEmail(auth, currentUser.email);
          alert(`पासवर्ड रीसेट लिंक ${currentUser.email} पर भेज दिया गया है। (Password reset link sent to ${currentUser.email})`);
        } catch (err) {
          alert(getErrorMessage(err.code));
        }
      }
    });
  }

  // Profile Edit Mode Toggle
  const btnEditProfileToggle = document.getElementById('btn-edit-profile-toggle');
  const btnCancelEditProfile = document.getElementById('btn-cancel-edit-profile');
  const profileViewSection = document.getElementById('profile-view-section');
  const profileEditForm = document.getElementById('profile-edit-form');
  const editProfileName = document.getElementById('edit-profile-name');
  const editProfilePhoto = document.getElementById('edit-profile-photo');
  const profileAlert = document.getElementById('profile-alert');
  const presetAvatarBtns = document.querySelectorAll('.btn-avatar-preset');

  if (btnEditProfileToggle) {
    btnEditProfileToggle.addEventListener('click', () => {
      if (profileAlert) {
        profileAlert.style.display = 'none';
        profileAlert.textContent = '';
      }
      if (editProfileName && currentUser) {
        editProfileName.value = currentUser.displayName || currentUser.email?.split('@')[0] || '';
      }
      if (editProfilePhoto && currentUser) {
        editProfilePhoto.value = currentUser.photoURL || '';
      }
      if (profileViewSection) profileViewSection.style.display = 'none';
      if (profileEditForm) profileEditForm.style.display = 'block';
    });
  }

  if (btnCancelEditProfile) {
    btnCancelEditProfile.addEventListener('click', () => {
      if (profileAlert) {
        profileAlert.style.display = 'none';
        profileAlert.textContent = '';
      }
      if (profileEditForm) profileEditForm.style.display = 'none';
      if (profileViewSection) profileViewSection.style.display = 'block';
    });
  }

  // Preset avatar buttons
  presetAvatarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (editProfilePhoto && url) {
        editProfilePhoto.value = url;
      }
    });
  });

  // Save profile changes
  if (profileEditForm) {
    profileEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser) return;

      const newName = editProfileName ? editProfileName.value.trim() : '';
      const newPhoto = editProfilePhoto ? editProfilePhoto.value.trim() : '';
      const btnSave = document.getElementById('btn-save-profile');

      if (!newName) {
        if (profileAlert) {
          profileAlert.style.display = 'block';
          profileAlert.className = 'auth-alert error';
          profileAlert.textContent = 'कृपया अपना नाम दर्ज करें। (Please enter a name)';
        }
        return;
      }

      if (btnSave) {
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> सहेज रहे हैं...';
      }

      try {
        await updateProfile(currentUser, {
          displayName: newName,
          photoURL: newPhoto || null
        });

        // Update Firestore profile
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: newName,
          photoURL: newPhoto || '',
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Update UI
        updateUserNavUI(currentUser);

        if (profileAlert) {
          profileAlert.style.display = 'block';
          profileAlert.className = 'auth-alert success';
          profileAlert.textContent = 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई! (Profile updated successfully)';
        }

        setTimeout(() => {
          if (profileEditForm) profileEditForm.style.display = 'none';
          if (profileViewSection) profileViewSection.style.display = 'block';
          openProfileModal();
        }, 1200);

      } catch (err) {
        console.error('Error updating profile:', err);
        if (profileAlert) {
          profileAlert.style.display = 'block';
          profileAlert.className = 'auth-alert error';
          profileAlert.textContent = 'प्रोफ़ाइल अपडेट करने में त्रुटि हुई। (Error updating profile)';
        }
      } finally {
        if (btnSave) {
          btnSave.disabled = false;
          btnSave.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        }
      }
    });
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (userDropdownMenu) userDropdownMenu.classList.remove('active');
      if (profileModalOverlay) profileModalOverlay.classList.remove('active');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navDirectLogout = document.getElementById('nav-direct-logout');

  if (btnLogout) btnLogout.addEventListener('click', handleLogout);
  if (btnProfileLogout) btnProfileLogout.addEventListener('click', handleLogout);
  if (navDirectLogout) navDirectLogout.addEventListener('click', handleLogout);
}

// Update Nav UI helper
function updateUserNavUI(user) {
  if (!user) return;
  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const email = user.email || '';
  const initial = (displayName || email || 'U').charAt(0).toUpperCase();

  const navName = document.getElementById('user-nav-name');
  const navEmail = document.getElementById('user-nav-email');
  const userAvatar = document.getElementById('user-avatar');
  const dropdownName = document.getElementById('dropdown-user-name');
  const dropdownEmail = document.getElementById('dropdown-user-email');

  if (navName) navName.textContent = displayName;
  if (navEmail) navEmail.textContent = email;
  if (dropdownName) dropdownName.textContent = displayName;
  if (dropdownEmail) dropdownEmail.textContent = email;

  if (userAvatar) {
    if (user.photoURL) {
      userAvatar.innerHTML = `<img src="${user.photoURL}" alt="Avatar">`;
    } else {
      userAvatar.textContent = initial;
    }
  }
}

// Open Profile Modal
function openProfileModal() {
  const profileModalOverlay = document.getElementById('profile-modal-overlay');
  const profileViewSection = document.getElementById('profile-view-section');
  const profileEditForm = document.getElementById('profile-edit-form');
  const profileAlert = document.getElementById('profile-alert');

  if (!profileModalOverlay || !currentUser) return;

  if (profileAlert) {
    profileAlert.style.display = 'none';
    profileAlert.textContent = '';
  }
  if (profileEditForm) profileEditForm.style.display = 'none';
  if (profileViewSection) profileViewSection.style.display = 'block';

  const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
  const email = currentUser.email || 'N/A';
  const initial = (displayName || email || 'U').charAt(0).toUpperCase();

  document.getElementById('profile-modal-name').textContent = displayName;
  document.getElementById('profile-modal-email').textContent = email;
  document.getElementById('profile-detail-name').textContent = displayName;
  document.getElementById('profile-detail-email').textContent = email;
  document.getElementById('profile-detail-uid').textContent = currentUser.uid;

  const avatarEl = document.getElementById('profile-modal-avatar');
  if (currentUser.photoURL) {
    avatarEl.innerHTML = `<img src="${currentUser.photoURL}" alt="User Avatar">`;
  } else {
    avatarEl.textContent = initial;
  }

  profileModalOverlay.classList.add('active');
}

// Auth State Change Handler
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  const authNavBtn = document.getElementById('auth-nav-btn');
  const userNavContainer = document.getElementById('user-nav-container');

  if (user) {
    // Logged in state
    if (authNavBtn) authNavBtn.style.display = 'none';
    if (userNavContainer) userNavContainer.style.display = 'block';

    const displayName = user.displayName || user.email?.split('@')[0] || 'User';
    const email = user.email || '';
    const initial = (displayName || email || 'U').charAt(0).toUpperCase();

    const navName = document.getElementById('user-nav-name');
    const navEmail = document.getElementById('user-nav-email');
    const userAvatar = document.getElementById('user-avatar');
    const dropdownName = document.getElementById('dropdown-user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');

    if (navName) navName.textContent = displayName;
    if (navEmail) navEmail.textContent = email;
    if (dropdownName) dropdownName.textContent = displayName;
    if (dropdownEmail) dropdownEmail.textContent = email;

    if (userAvatar) {
      if (user.photoURL) {
        userAvatar.innerHTML = `<img src="${user.photoURL}" alt="Avatar">`;
      } else {
        userAvatar.textContent = initial;
      }
    }

    await syncUserProfile(user);
  } else {
    // Logged out state
    if (authNavBtn) authNavBtn.style.display = 'flex';
    if (userNavContainer) userNavContainer.style.display = 'none';
  }
});

// Initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectAuthUI();
    setupAuthEventListeners();
  });
} else {
  injectAuthUI();
  setupAuthEventListeners();
}

export { auth, db };
