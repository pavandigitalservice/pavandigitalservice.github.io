/**
 * Live Visitor Tracker Module for Pavan Digital Service
 * Tracks active website visitors and connects them to the Live Earth Map in real-time.
 */

import { db, auth } from './auth.js';
import { 
    doc, 
    setDoc, 
    onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Predefined fallback locations if Geo IP is blocked or offline
const FALLBACK_CITIES = [
    { city: 'Bhopal', country: 'India', countryCode: 'IN', lat: 23.2599, lng: 77.4126 },
    { city: 'Indore', country: 'India', countryCode: 'IN', lat: 22.7196, lng: 75.8577 },
    { city: 'New Delhi', country: 'India', countryCode: 'IN', lat: 28.6139, lng: 77.2090 },
    { city: 'Mumbai', country: 'India', countryCode: 'IN', lat: 19.0760, lng: 72.8777 },
    { city: 'Bengaluru', country: 'India', countryCode: 'IN', lat: 12.9716, lng: 77.5946 },
    { city: 'Jaipur', country: 'India', countryCode: 'IN', lat: 26.9124, lng: 75.7873 },
    { city: 'Pune', country: 'India', countryCode: 'IN', lat: 18.5204, lng: 73.8567 },
    { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', lat: 25.2048, lng: 55.2708 },
    { city: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lng: -0.1278 },
    { city: 'New York', country: 'United States', countryCode: 'US', lat: 40.7128, lng: -74.0060 },
    { city: 'San Francisco', country: 'United States', countryCode: 'US', lat: 37.7749, lng: -122.4194 },
    { city: 'Singapore', country: 'Singapore', countryCode: 'SG', lat: 1.3521, lng: 103.8198 }
];

function getSessionId() {
    let sid = sessionStorage.getItem('pds_session_id');
    if (!sid) {
        sid = 'sess_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        sessionStorage.setItem('pds_session_id', sid);
    }
    return sid;
}

// Approximate location detection
async function detectLocation() {
    // Check cached location
    const cached = localStorage.getItem('pds_geo_cache');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed.lat && parsed.lng && (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000)) {
                return parsed;
            }
        } catch (e) {}
    }

    // Try GeoJS API (free, fast, CORS enabled)
    try {
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (res.ok) {
            const data = await res.json();
            if (data.latitude && data.longitude) {
                const geo = {
                    city: data.city || 'Online City',
                    country: data.country || 'India',
                    countryCode: data.country_code || 'IN',
                    lat: parseFloat(data.latitude),
                    lng: parseFloat(data.longitude),
                    timestamp: Date.now()
                };
                localStorage.setItem('pds_geo_cache', JSON.stringify(geo));
                return geo;
            }
        }
    } catch (e) {
        // Continue to fallback
    }

    // Secondary fallback to IPAPI
    try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
            const data = await res.json();
            if (data.latitude && data.longitude) {
                const geo = {
                    city: data.city || 'Online Visitor',
                    country: data.country_name || 'India',
                    countryCode: data.country_code || 'IN',
                    lat: parseFloat(data.latitude),
                    lng: parseFloat(data.longitude),
                    timestamp: Date.now()
                };
                localStorage.setItem('pds_geo_cache', JSON.stringify(geo));
                return geo;
            }
        }
    } catch (e) {}

    // Smart fallback based on Timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    let fallback = FALLBACK_CITIES[0]; // Default Bhopal / MP
    if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India')) {
        const randIndex = Math.floor(Math.random() * 6);
        fallback = FALLBACK_CITIES[randIndex];
    } else if (tz.includes('America') || tz.includes('New_York') || tz.includes('Los_Angeles')) {
        fallback = FALLBACK_CITIES[9];
    } else if (tz.includes('Europe') || tz.includes('London')) {
        fallback = FALLBACK_CITIES[8];
    } else if (tz.includes('Dubai') || tz.includes('Asia/Dubai')) {
        fallback = FALLBACK_CITIES[7];
    }

    return {
        ...fallback,
        timestamp: Date.now()
    };
}

let activeSessionId = null;
let currentGeo = null;

async function recordPresence() {
    try {
        activeSessionId = getSessionId();
        if (!currentGeo) {
            currentGeo = await detectLocation();
        }

        const user = auth.currentUser;
        const pageTitle = document.title ? document.title.split('-')[0].trim() : 'Website';
        const pagePath = window.location.pathname.split('/').pop() || 'index.html';

        const visitorData = {
            sessionId: activeSessionId,
            city: currentGeo.city,
            country: currentGeo.country,
            countryCode: currentGeo.countryCode,
            lat: currentGeo.lat + (Math.random() * 0.04 - 0.02), // slight jitter to avoid exact point overlapping
            lng: currentGeo.lng + (Math.random() * 0.04 - 0.02),
            isUser: !!user,
            userId: user ? user.uid : null,
            userName: user ? (user.displayName || user.email?.split('@')[0]) : 'Guest Visitor',
            userAvatar: user?.photoURL || '',
            lastActive: new Date().toISOString(),
            page: pagePath,
            pageTitle: pageTitle
        };

        const docRef = doc(db, 'visitors', activeSessionId);
        await setDoc(docRef, visitorData, { merge: true });
    } catch (err) {
        console.warn('Visitor presence tracking note:', err);
    }
}

// Initialize presence and heartbeat
export function initVisitorTracker() {
    recordPresence();

    // Heartbeat every 45 seconds to keep visitor active
    setInterval(recordPresence, 45000);

    // Track when user logs in / out
    auth.onAuthStateChanged(() => {
        recordPresence();
    });
}

// Auto-run if loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisitorTracker);
} else {
    initVisitorTracker();
}
