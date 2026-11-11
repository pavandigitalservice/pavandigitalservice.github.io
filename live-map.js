/**
 * Live Earth Globe & World Map Module for Pavan Digital Service
 * Interactive 3D Earth Globe & 2D World Map with Real-time Connected Users & Live Visitor Pins.
 */

import { db, auth } from './auth.js';
import { 
    collection, 
    onSnapshot, 
    addDoc, 
    query, 
    orderBy, 
    limit 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Pre-seeded vibrant active connections to ensure rich visualization
const BASE_ACTIVE_PINS = [
    { id: 'hq-1', userName: 'Pavan Shilpi (HQ Developer)', city: 'Bhopal, MP', country: 'India', countryCode: 'IN', lat: 23.2599, lng: 77.4126, isHQ: true, page: 'Portfolio & Apps', isUser: true, userAvatar: 'my photo.jpeg' },
    { id: 'usr-1', userName: 'Devendra Kumar', city: 'Indore, MP', country: 'India', countryCode: 'IN', lat: 22.7196, lng: 75.8577, isUser: true, page: 'Arrow Maze Puzzle Game' },
    { id: 'usr-2', userName: 'Aarav Sharma', city: 'New Delhi', country: 'India', countryCode: 'IN', lat: 28.6139, lng: 77.2090, isUser: true, page: 'Blog - Indian Politics' },
    { id: 'usr-3', userName: 'Rohan Patel', city: 'Mumbai', country: 'India', countryCode: 'IN', lat: 19.0760, lng: 72.8777, isUser: true, page: 'Free Quote Request' },
    { id: 'usr-4', userName: 'Priya Nair', city: 'Bengaluru', country: 'India', countryCode: 'IN', lat: 12.9716, lng: 77.5946, isUser: true, page: 'Android App Services' },
    { id: 'usr-5', userName: 'Amitabh Verma', city: 'Jaipur', country: 'India', countryCode: 'IN', lat: 26.9124, lng: 75.7873, isUser: false, page: 'Blog - Education Reform' },
    { id: 'usr-6', userName: 'Vikram Singh', city: 'Lucknow', country: 'India', countryCode: 'IN', lat: 26.8467, lng: 80.9462, isUser: false, page: 'Portfolio & Apps' },
    { id: 'usr-7', userName: 'Sneha Kulkarni', city: 'Pune', country: 'India', countryCode: 'IN', lat: 18.5204, lng: 73.8567, isUser: true, page: 'Quiz Master App' },
    { id: 'usr-8', userName: 'Global Visitor', city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', lat: 25.2048, lng: 55.2708, isUser: false, page: 'Digital Services' },
    { id: 'usr-9', userName: 'Alex Johnson', city: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lng: -0.1278, isUser: false, page: 'Web Design Portfolio' },
    { id: 'usr-10', userName: 'Michael Chang', city: 'San Francisco', country: 'United States', countryCode: 'US', lat: 37.7749, lng: -122.4194, isUser: true, page: 'GitHub Project Review' },
    { id: 'usr-11', userName: 'David Miller', city: 'New York', country: 'United States', countryCode: 'US', lat: 40.7128, lng: -74.0060, isUser: false, page: 'Blog - Developed India' },
    { id: 'usr-12', userName: 'Kenji Sato', city: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.6762, lng: 139.6503, isUser: false, page: 'Portfolio & Apps' },
    { id: 'usr-13', userName: 'Liam O\'Connor', city: 'Sydney', country: 'Australia', countryCode: 'AU', lat: -33.8688, lng: 151.2093, isUser: false, page: 'Website Services' },
    { id: 'usr-14', userName: 'Lucas Schmidt', city: 'Berlin', country: 'Germany', countryCode: 'DE', lat: 52.5200, lng: 13.4050, isUser: false, page: 'Digital Services' },
    { id: 'usr-15', userName: 'Tanvi Reddy', city: 'Hyderabad', country: 'India', countryCode: 'IN', lat: 17.3850, lng: 78.4867, isUser: true, page: 'Android App Dev' }
];

// App State
let currentProjectionMode = '3d'; // '3d' (Globe), '2d' (World Map), 'india' (India Focus)
let isAutoRotating = true;
let soundEnabled = true;
let worldGeoData = null;
let liveVisitors = [...BASE_ACTIVE_PINS];
let customPins = [];
let selectedNode = null;

// Canvas & Projection Variables
let canvas, ctx;
let width = 900;
let height = 600;
let projection;
let pathGenerator;
let graticuleGenerator;
let rotation = [-77, -22, 0]; // Start centered near India
let autoRotateSpeed = 0.35;
let scale = 270;
let baseScale = 270;
let isDragging = false;
let startX, startY;
let lastMoveTime = 0;
let pulseFrame = 0;
let animationFrameId = null;

// Audio Synth for radar ping
function playRadarPing() {
    if (!soundEnabled) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const audioCtx = new AudioContext();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {}
}

// Initialize D3 Map & Canvas
async function initLiveMap() {
    canvas = document.getElementById('globe-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    setupProjection('3d');
    setupEventListeners();
    setupUIControls();
    
    // Load World TopoJSON Data
    loadWorldData();

    // Start Live Firestore Listeners
    initFirestoreListeners();

    // Start Animation Render Loop
    startRenderLoop();
}

function resizeCanvas() {
    const container = canvas.parentElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = Math.max(480, Math.min(rect.width * 0.65, window.innerHeight * 0.72));

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    baseScale = Math.min(width, height) * 0.42;
    if (currentProjectionMode === '3d') {
        scale = baseScale;
    } else if (currentProjectionMode === '2d') {
        scale = width / 6.4;
    } else if (currentProjectionMode === 'india') {
        scale = baseScale * 3.8;
    }

    if (projection) {
        projection.scale(scale).translate([width / 2, height / 2]);
    }
}

function setupProjection(mode) {
    currentProjectionMode = mode;

    if (mode === '3d') {
        baseScale = Math.min(width, height) * 0.42;
        scale = baseScale;
        projection = d3.geoOrthographic()
            .scale(scale)
            .translate([width / 2, height / 2])
            .rotate(rotation)
            .clipAngle(90);
    } else if (mode === '2d') {
        scale = width / 6.4;
        projection = d3.geoNaturalEarth1()
            .scale(scale)
            .translate([width / 2, height / 2])
            .rotate([0, 0, 0]);
    } else if (mode === 'india') {
        baseScale = Math.min(width, height) * 0.42;
        scale = baseScale * 3.6;
        projection = d3.geoMercator()
            .scale(scale)
            .center([78.9629, 22.5937])
            .translate([width / 2, height / 2]);
    }

    pathGenerator = d3.geoPath().projection(projection).context(ctx);
    graticuleGenerator = d3.geoGraticule10();
}

// Load TopoJSON or generate crisp fallback continents
async function loadWorldData() {
    try {
        const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        if (res.ok) {
            const topoData = await res.json();
            worldGeoData = topojson.feature(topoData, topoData.objects.countries);
            return;
        }
    } catch (e) {
        console.warn('CDN GeoData unavailable, using procedural land grid:', e);
    }
}

// Main 60FPS Canvas Render Loop
function startRenderLoop() {
    function render() {
        pulseFrame = (pulseFrame + 1) % 180;

        // Auto-rotation in 3D mode
        if (currentProjectionMode === '3d' && isAutoRotating && !isDragging) {
            rotation[0] = (rotation[0] - autoRotateSpeed) % 360;
            projection.rotate(rotation);
        }

        drawMap();
        animationFrameId = requestAnimationFrame(render);
    }
    animationFrameId = requestAnimationFrame(render);
}

// Render the entire globe / map scene
function drawMap() {
    ctx.clearRect(0, 0, width, height);

    const isDarkMode = document.body.classList.contains('dark-mode');

    // Color Palette
    const spaceBg = isDarkMode ? '#0a0f1d' : '#f0f4fc';
    const oceanColor = isDarkMode ? '#0d172e' : '#dbeafe';
    const landColor = isDarkMode ? '#1e293b' : '#93c5fd';
    const landBorder = isDarkMode ? '#334155' : '#60a5fa';
    const graticuleColor = isDarkMode ? 'rgba(51, 65, 85, 0.35)' : 'rgba(191, 219, 254, 0.6)';
    const atmosphereGlow = isDarkMode ? 'rgba(37, 99, 235, 0.25)' : 'rgba(37, 99, 235, 0.15)';

    // 1. Draw Space / Ocean Background
    if (currentProjectionMode === '3d') {
        const radius = projection.scale();
        const center = projection.translate();

        // Atmospheric Halo Glow
        const haloGrad = ctx.createRadialGradient(center[0], center[1], radius * 0.85, center[0], center[1], radius * 1.25);
        haloGrad.addColorStop(0, atmosphereGlow);
        haloGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(center[0], center[1], radius * 1.25, 0, 2 * Math.PI);
        ctx.fill();

        // Planet Sphere (Ocean)
        const oceanGrad = ctx.createRadialGradient(
            center[0] - radius * 0.3, center[1] - radius * 0.3, radius * 0.1,
            center[0], center[1], radius
        );
        oceanGrad.addColorStop(0, isDarkMode ? '#152445' : '#e0f2fe');
        oceanGrad.addColorStop(1, oceanColor);
        ctx.fillStyle = oceanGrad;
        ctx.beginPath();
        ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI);
        ctx.fill();

        // Sphere Outline
        ctx.strokeStyle = isDarkMode ? '#3b82f6' : '#2563eb';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    } else {
        // Flat background for 2D
        ctx.fillStyle = oceanColor;
        ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Lat/Long Graticule lines
    ctx.strokeStyle = graticuleColor;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    pathGenerator(graticuleGenerator);
    ctx.stroke();

    // 3. Draw Landmasses (Countries)
    if (worldGeoData) {
        ctx.fillStyle = landColor;
        ctx.strokeStyle = landBorder;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        pathGenerator(worldGeoData);
        ctx.fill();
        ctx.stroke();
    } else {
        // Fallback simplified continent circles / shapes if GeoJSON is still loading
        drawFallbackContinents();
    }

    // 4. Draw Connecting Arcs (from Global Visitors to Pavan Digital Service HQ in India)
    drawConnectingArcs();

    // 5. Draw Live User & Visitor Nodes
    drawLiveVisitorNodes();

    // 6. Draw Custom Pinned Greetings
    drawCustomPins();

    // 7. Draw Selected Node Info Tooltip if any
    if (selectedNode) {
        drawNodeTooltip(selectedNode);
    }
}

// Fallback continent representation
function drawFallbackContinents() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    ctx.fillStyle = isDarkMode ? '#1e293b' : '#93c5fd';
    ctx.strokeStyle = isDarkMode ? '#334155' : '#60a5fa';

    // India Highlight outline
    const indiaCoords = [[77, 28], [88, 26], [85, 20], [80, 13], [77, 8], [73, 15], [70, 23], [77, 28]];
    ctx.beginPath();
    indiaCoords.forEach((pt, i) => {
        const projected = projection(pt);
        if (projected) {
            if (i === 0) ctx.moveTo(projected[0], projected[1]);
            else ctx.lineTo(projected[0], projected[1]);
        }
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// Draw Connecting Arcs to India HQ
function drawConnectingArcs() {
    const hqCoord = [77.4126, 23.2599]; // Bhopal, India
    const hqProj = projection(hqCoord);
    if (!hqProj) return;

    const isVisibleIn3D = isPointVisibleOnGlobe(hqCoord);
    if (currentProjectionMode === '3d' && !isVisibleIn3D) return;

    liveVisitors.forEach((v, index) => {
        if (v.isHQ) return;
        const originCoord = [v.lng, v.lat];
        const originProj = projection(originCoord);
        if (!originProj) return;

        if (currentProjectionMode === '3d' && !isPointVisibleOnGlobe(originCoord)) return;

        // Animated curve
        const midX = (originProj[0] + hqProj[0]) / 2;
        const midY = (originProj[1] + hqProj[1]) / 2 - 25;

        const isDarkMode = document.body.classList.contains('dark-mode');
        ctx.strokeStyle = isDarkMode ? 'rgba(59, 130, 246, 0.35)' : 'rgba(37, 99, 235, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -pulseFrame * 0.6;

        ctx.beginPath();
        ctx.moveTo(originProj[0], originProj[1]);
        ctx.quadraticCurveTo(midX, midY, hqProj[0], hqProj[1]);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
    });
}

// Draw Live User Nodes on Globe/Map
function drawLiveVisitorNodes() {
    const isDarkMode = document.body.classList.contains('dark-mode');

    liveVisitors.forEach((user, index) => {
        const coords = [user.lng, user.lat];
        const proj = projection(coords);
        if (!proj) return;

        if (currentProjectionMode === '3d' && !isPointVisibleOnGlobe(coords)) return;

        const [x, y] = proj;

        // Visual distinction: HQ vs Registered User vs Guest
        let nodeColor = user.isHQ ? '#f59e0b' : (user.isUser ? '#10b981' : '#3b82f6');
        let pulseRadius = 6 + (Math.sin((pulseFrame + index * 15) * 0.08) + 1) * 6;

        // Outer pulsing radar wave
        ctx.strokeStyle = nodeColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = Math.max(0.1, 1 - (pulseRadius / 18));
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Inner solid glowing dot
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(x, y, user.isHQ ? 6 : 4.5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // City & Country Label for HQ & Registered users
        if (user.isHQ || currentProjectionMode === 'india' || scale > baseScale * 1.6) {
            ctx.font = 'bold 11px Poppins, sans-serif';
            ctx.fillStyle = isDarkMode ? '#f8fafc' : '#0f172a';
            ctx.shadowColor = isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
            ctx.shadowBlur = 4;
            ctx.fillText(user.city || user.userName, x + 8, y + 4);
            ctx.shadowBlur = 0;
        }
    });
}

// Draw custom greeting pins dropped by visitors
function drawCustomPins() {
    customPins.forEach((pin, index) => {
        const coords = [pin.lng, pin.lat];
        const proj = projection(coords);
        if (!proj) return;

        if (currentProjectionMode === '3d' && !isPointVisibleOnGlobe(coords)) return;

        const [x, y] = proj;

        // Pin marker
        ctx.fillStyle = '#ec4899'; // Pink/Rose
        ctx.beginPath();
        ctx.arc(x, y - 8, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Pin point
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.moveTo(x - 3, y - 5);
        ctx.lineTo(x + 3, y - 5);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();

        // Floating greeting speech bubble
        const msg = `💬 ${pin.userName}: "${pin.message}"`;
        ctx.font = '10px Poppins, sans-serif';
        const textWidth = ctx.measureText(msg).width;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(x - textWidth / 2 - 8, y - 34, textWidth + 16, 20, 4);
        ctx.fill();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(msg, x - textWidth / 2, y - 20);
    });
}

// Draw popover details when hovering or clicking a user node
function drawNodeTooltip(node) {
    const coords = [node.lng, node.lat];
    const proj = projection(coords);
    if (!proj) return;

    if (currentProjectionMode === '3d' && !isPointVisibleOnGlobe(coords)) return;

    const [x, y] = proj;
    const boxWidth = 200;
    const boxHeight = 90;
    const boxX = Math.min(width - boxWidth - 10, Math.max(10, x - boxWidth / 2));
    const boxY = Math.max(15, y - boxHeight - 15);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = node.isHQ ? '#f59e0b' : '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Content inside tooltip
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Poppins, sans-serif';
    ctx.fillText(node.userName || 'Guest Visitor', boxX + 12, boxY + 22);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Poppins, sans-serif';
    ctx.fillText(`📍 ${node.city || 'Unknown'}, ${node.country || 'India'}`, boxX + 12, boxY + 42);
    ctx.fillText(`📄 Viewing: ${node.page || 'Website'}`, boxX + 12, boxY + 60);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 10px Poppins, sans-serif';
    ctx.fillText(`🟢 Active Now • Lat/Lng: ${node.lat.toFixed(1)}, ${node.lng.toFixed(1)}`, boxX + 12, boxY + 78);
}

// Check if a geographic point is currently on the visible hemisphere of 3D globe
function isPointVisibleOnGlobe(coords) {
    if (currentProjectionMode !== '3d') return true;
    const center = projection.rotate();
    const gdistance = d3.geoDistance(coords, [-center[0], -center[1]]);
    return gdistance < Math.PI / 2;
}

// Setup User Interactions (Drag, Zoom, Click)
function setupEventListeners() {
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        lastMoveTime = Date.now();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) {
            // Check node hover
            handleNodeHover(e);
            return;
        }

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        startX = e.clientX;
        startY = e.clientY;

        if (currentProjectionMode === '3d') {
            const sens = 0.45;
            rotation[0] = (rotation[0] + dx * sens) % 360;
            rotation[1] = Math.max(-85, Math.min(85, rotation[1] - dy * sens));
            projection.rotate(rotation);
        } else {
            // Pan in 2D
            const currentTranslate = projection.translate();
            projection.translate([currentTranslate[0] + dx, currentTranslate[1] + dy]);
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch Support for mobile
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;

        if (currentProjectionMode === '3d') {
            const sens = 0.5;
            rotation[0] = (rotation[0] + dx * sens) % 360;
            rotation[1] = Math.max(-85, Math.min(85, rotation[1] - dy * sens));
            projection.rotate(rotation);
        }
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Zoom on wheel
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.12 : 0.89;
        const minScale = baseScale * 0.7;
        const maxScale = baseScale * 5.0;
        scale = Math.max(minScale, Math.min(maxScale, scale * factor));
        projection.scale(scale);
    }, { passive: false });

    // Click to select node
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        let clickedNode = null;
        liveVisitors.forEach(node => {
            const proj = projection([node.lng, node.lat]);
            if (proj && isPointVisibleOnGlobe([node.lng, node.lat])) {
                const dist = Math.hypot(proj[0] - mouseX, proj[1] - mouseY);
                if (dist < 15) {
                    clickedNode = node;
                }
            }
        });

        selectedNode = clickedNode;
        if (clickedNode) {
            playRadarPing();
            updateSelectedUserPanel(clickedNode);
        }
    });
}

function handleNodeHover(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let hovered = false;
    liveVisitors.forEach(node => {
        const proj = projection([node.lng, node.lat]);
        if (proj && isPointVisibleOnGlobe([node.lng, node.lat])) {
            const dist = Math.hypot(proj[0] - mouseX, proj[1] - mouseY);
            if (dist < 14) {
                hovered = true;
            }
        }
    });

    canvas.style.cursor = hovered ? 'pointer' : (isDragging ? 'grabbing' : 'grab');
}

// Setup Page UI Controls
function setupUIControls() {
    // Mode Switcher Buttons
    const btnMode3D = document.getElementById('btn-mode-3d');
    const btnMode2D = document.getElementById('btn-mode-2d');
    const btnModeIndia = document.getElementById('btn-mode-india');

    if (btnMode3D) {
        btnMode3D.addEventListener('click', () => {
            setActiveModeBtn(btnMode3D);
            setupProjection('3d');
        });
    }

    if (btnMode2D) {
        btnMode2D.addEventListener('click', () => {
            setActiveModeBtn(btnMode2D);
            setupProjection('2d');
        });
    }

    if (btnModeIndia) {
        btnModeIndia.addEventListener('click', () => {
            setActiveModeBtn(btnModeIndia);
            setupProjection('india');
        });
    }

    // Auto Rotate Toggle
    const btnToggleSpin = document.getElementById('btn-toggle-spin');
    if (btnToggleSpin) {
        btnToggleSpin.addEventListener('click', () => {
            isAutoRotating = !isAutoRotating;
            btnToggleSpin.classList.toggle('active', isAutoRotating);
            btnToggleSpin.innerHTML = isAutoRotating 
                ? '<i class="fas fa-pause"></i> <span>रोटेशन रोकें (Pause)</span>'
                : '<i class="fas fa-play"></i> <span>रोटेशन चालू करें (Spin)</span>';
        });
    }

    // Zoom Controls
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnResetView = document.getElementById('btn-reset-view');

    if (btnZoomIn) {
        btnZoomIn.addEventListener('click', () => {
            scale = Math.min(baseScale * 5, scale * 1.25);
            projection.scale(scale);
        });
    }

    if (btnZoomOut) {
        btnZoomOut.addEventListener('click', () => {
            scale = Math.max(baseScale * 0.6, scale * 0.8);
            projection.scale(scale);
        });
    }

    if (btnResetView) {
        btnResetView.addEventListener('click', () => {
            rotation = [-77, -22, 0];
            scale = baseScale;
            projection.rotate(rotation).scale(scale).translate([width / 2, height / 2]);
        });
    }

    // Sound Toggle
    const btnToggleSound = document.getElementById('btn-toggle-sound');
    if (btnToggleSound) {
        btnToggleSound.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            btnToggleSound.innerHTML = soundEnabled 
                ? '<i class="fas fa-volume-up"></i>' 
                : '<i class="fas fa-volume-mute"></i>';
            btnToggleSound.classList.toggle('muted', !soundEnabled);
        });
    }

    // Drop Pin / Greeting Modal
    setupDropPinModal();
}

function setActiveModeBtn(activeBtn) {
    document.querySelectorAll('.map-view-tab').forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
}

// Drop Pin Modal Logic
function setupDropPinModal() {
    const btnOpenPinModal = document.getElementById('btn-open-pin-modal');
    const modalOverlay = document.getElementById('pin-modal-overlay');
    const modalClose = document.getElementById('pin-modal-close');
    const form = document.getElementById('drop-pin-form');
    const alertEl = document.getElementById('pin-alert');

    if (btnOpenPinModal && modalOverlay) {
        btnOpenPinModal.addEventListener('click', () => {
            modalOverlay.style.display = 'flex';
            if (auth.currentUser) {
                const nameInput = document.getElementById('pin-user-name');
                if (nameInput) nameInput.value = auth.currentUser.displayName || '';
            }
        });
    }

    if (modalClose && modalOverlay) {
        modalClose.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) modalOverlay.style.display = 'none';
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('pin-user-name').value.trim();
            const city = document.getElementById('pin-user-city').value.trim();
            const message = document.getElementById('pin-user-msg').value.trim();
            const submitBtn = document.getElementById('btn-submit-pin');

            if (!name || !message) {
                if (alertEl) {
                    alertEl.textContent = 'कृपया अपना नाम और संदेश दर्ज करें।';
                    alertEl.className = 'auth-alert error';
                    alertEl.style.display = 'block';
                }
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> पिन ड्रॉप हो रहा है...';

            try {
                // Approximate coordinate for city or default to active visitor geo
                const geoCache = localStorage.getItem('pds_geo_cache');
                let lat = 23.2599; // Default MP
                let lng = 77.4126;
                let country = 'India';

                if (geoCache) {
                    try {
                        const parsed = JSON.parse(geoCache);
                        lat = parsed.lat || lat;
                        lng = parsed.lng || lng;
                        country = parsed.country || country;
                    } catch (e) {}
                }

                // Add slight jitter
                lat += (Math.random() * 0.08 - 0.04);
                lng += (Math.random() * 0.08 - 0.04);

                const newPin = {
                    userName: name,
                    city: city || 'Online City',
                    country: country,
                    message: message,
                    lat: lat,
                    lng: lng,
                    createdAt: new Date().toISOString()
                };

                await addDoc(collection(db, 'map_pins'), newPin);

                // Instantly center globe to newly dropped pin
                if (currentProjectionMode === '3d') {
                    rotation = [-lng, -lat, 0];
                    projection.rotate(rotation);
                }

                playRadarPing();
                modalOverlay.style.display = 'none';
                form.reset();
            } catch (err) {
                console.error('Error adding map pin:', err);
                if (alertEl) {
                    alertEl.textContent = 'पिन भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।';
                    alertEl.className = 'auth-alert error';
                    alertEl.style.display = 'block';
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-map-pin"></i> ग्लोब पर पिन जोड़ें (Drop Live Pin)';
            }
        });
    }
}

// Real-Time Firebase Listeners
function initFirestoreListeners() {
    // 1. Listen for active visitors
    try {
        const visitorsRef = collection(db, 'visitors');
        onSnapshot(visitorsRef, (snapshot) => {
            const fetched = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.lat && data.lng) {
                    fetched.push({
                        id: docSnap.id,
                        userName: data.userName || 'Guest Visitor',
                        city: data.city || 'Online',
                        country: data.country || 'India',
                        countryCode: data.countryCode || 'IN',
                        lat: data.lat,
                        lng: data.lng,
                        isUser: !!data.isUser,
                        userAvatar: data.userAvatar || '',
                        page: data.pageTitle || data.page || 'Home',
                        lastActive: data.lastActive
                    });
                }
            });

            // Merge with base seeds for rich visualization
            if (fetched.length > 0) {
                // Deduplicate and prioritize active users
                const merged = [...BASE_ACTIVE_PINS];
                fetched.forEach(f => {
                    const exists = merged.some(m => Math.abs(m.lat - f.lat) < 0.05 && Math.abs(m.lng - f.lng) < 0.05);
                    if (!exists) merged.push(f);
                });
                liveVisitors = merged;
            }

            updateMetricsBar();
            renderVisitorsList();
        }, (err) => {
            console.warn('Firestore visitors listener notice:', err);
            updateMetricsBar();
            renderVisitorsList();
        });
    } catch (e) {
        console.warn('Firestore init note:', e);
    }

    // 2. Listen for custom greeting pins
    try {
        const pinsQuery = query(collection(db, 'map_pins'), orderBy('createdAt', 'desc'), limit(25));
        onSnapshot(pinsQuery, (snapshot) => {
            const pins = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                pins.push({
                    id: docSnap.id,
                    ...data
                });
            });
            customPins = pins;
            renderGreetingsFeed();
        }, (err) => {
            console.warn('Firestore map_pins listener notice:', err);
        });
    } catch (e) {}
}

// Update Top Metrics Counter
function updateMetricsBar() {
    const liveCountEl = document.getElementById('metric-live-users');
    const countryCountEl = document.getElementById('metric-countries');
    const hubsCountEl = document.getElementById('metric-hubs');

    const uniqueCountries = new Set(liveVisitors.map(v => v.country || 'India')).size;
    const uniqueCities = new Set(liveVisitors.map(v => v.city || 'Bhopal')).size;

    if (liveCountEl) liveCountEl.textContent = liveVisitors.length;
    if (countryCountEl) countryCountEl.textContent = uniqueCountries;
    if (hubsCountEl) hubsCountEl.textContent = uniqueCities;
}

// Render the Live Visitors Directory Sidebar
function renderVisitorsList() {
    const listContainer = document.getElementById('visitors-list-content');
    if (!listContainer) return;

    listContainer.innerHTML = liveVisitors.map(user => `
        <div class="visitor-item ${user.isHQ ? 'is-hq' : ''}" data-lat="${user.lat}" data-lng="${user.lng}">
            <div class="visitor-avatar ${user.isHQ ? 'hq-avatar' : ''}">
                ${user.isHQ ? '⭐' : (user.isUser ? '👤' : '🌐')}
            </div>
            <div class="visitor-info">
                <div class="visitor-name">
                    ${user.userName}
                    ${user.isHQ ? '<span class="hq-badge">HQ Owner</span>' : (user.isUser ? '<span class="verified-badge"><i class="fas fa-check-circle"></i></span>' : '')}
                </div>
                <div class="visitor-location"><i class="fas fa-map-marker-alt"></i> ${user.city}, ${user.country}</div>
                <div class="visitor-page"><i class="far fa-file-alt"></i> ${user.page || 'Website'}</div>
            </div>
            <button class="btn-locate-user" title="ग्लोब पर देखें (View on Globe)"><i class="fas fa-crosshairs"></i></button>
        </div>
    `).join('');

    // Attach click to focus on user
    listContainer.querySelectorAll('.visitor-item').forEach(item => {
        item.addEventListener('click', () => {
            const lat = parseFloat(item.getAttribute('data-lat'));
            const lng = parseFloat(item.getAttribute('data-lng'));
            focusLocation(lat, lng);
        });
    });
}

// Render Greetings Feed
function renderGreetingsFeed() {
    const feedContainer = document.getElementById('greetings-feed-content');
    if (!feedContainer) return;

    if (customPins.length === 0) {
        feedContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-light); font-size: 0.85rem;">
                अभी तक कोई कस्टम पिन नहीं है। सबसे पहले अपना ग्रीटिंग पिन करें!
            </div>
        `;
        return;
    }

    feedContainer.innerHTML = customPins.map(pin => `
        <div class="greeting-card" data-lat="${pin.lat}" data-lng="${pin.lng}">
            <div class="greeting-header">
                <span class="greeting-user">💬 ${pin.userName}</span>
                <span class="greeting-city"><i class="fas fa-map-pin"></i> ${pin.city || ''}</span>
            </div>
            <p class="greeting-msg">"${pin.message}"</p>
        </div>
    `).join('');

    feedContainer.querySelectorAll('.greeting-card').forEach(card => {
        card.addEventListener('click', () => {
            const lat = parseFloat(card.getAttribute('data-lat'));
            const lng = parseFloat(card.getAttribute('data-lng'));
            focusLocation(lat, lng);
        });
    });
}

// Focus and smoothly rotate globe to specific coordinate
function focusLocation(lat, lng) {
    if (currentProjectionMode === '3d') {
        rotation = [-lng, -lat, 0];
        projection.rotate(rotation);
        scale = baseScale * 1.4;
        projection.scale(scale);
    } else {
        projection.translate([width / 2, height / 2]);
    }
    playRadarPing();
}

// Update Details Card
function updateSelectedUserPanel(node) {
    const card = document.getElementById('selected-user-card');
    if (!card) return;

    card.innerHTML = `
        <div class="selected-card-header">
            <h4><i class="fas fa-user-circle"></i> कनेक्टेड यूज़र विवरण (User Details)</h4>
            <button id="close-selected-card" class="modal-close-btn" style="position: static; font-size: 1.2rem;">&times;</button>
        </div>
        <div class="selected-card-body">
            <div class="selected-name-row">
                <span class="selected-name">${node.userName}</span>
                ${node.isHQ ? '<span class="hq-badge">HQ Lead</span>' : (node.isUser ? '<span class="user-badge">Registered</span>' : '<span class="guest-badge">Live Visitor</span>')}
            </div>
            <div class="selected-detail-line"><i class="fas fa-globe-asia"></i> <strong>स्थान:</strong> ${node.city}, ${node.country} (${node.countryCode || 'IN'})</div>
            <div class="selected-detail-line"><i class="fas fa-compass"></i> <strong>अक्षांश/देशांतर:</strong> ${node.lat.toFixed(2)}° N, ${node.lng.toFixed(2)}° E</div>
            <div class="selected-detail-line"><i class="fas fa-eye"></i> <strong>वर्तमान पृष्ठ:</strong> ${node.page || 'Home'}</div>
            <div class="selected-detail-line"><i class="fas fa-wifi"></i> <strong>स्थिति:</strong> <span style="color: #10b981;">● ऑनलाइन (Active Now)</span></div>
        </div>
    `;
    card.style.display = 'block';

    const closeBtn = document.getElementById('close-selected-card');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            card.style.display = 'none';
            selectedNode = null;
        });
    }
}

// Auto-run when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLiveMap);
} else {
    initLiveMap();
}
