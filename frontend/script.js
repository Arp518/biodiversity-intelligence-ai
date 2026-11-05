// ============================================================
// BIODIVERSITY INTELLIGENCE AI — 3D BIOSPHERE & CHAT ENGINE
// ============================================================

// ------------------------------------------------------------
// 1. API CONFIGURATION (DYNAMIC FOR LOCAL & PRODUCTION DEPLOYMENT)
// ------------------------------------------------------------
const API_URL = (() => {
    // If running in browser served by FastAPI or unified domain (Render, HF Spaces, etc.)
    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
        // If served from dev port like 5500 (Live Server), talk to FastAPI on 8000
        if (window.location.port === "5500" || window.location.port === "3000") {
            return "http://127.0.0.1:8000";
        }
        return ""; // Relative to host (works on Render, Railway, Spaces, Docker, etc.)
    }
    return "http://127.0.0.1:8000"; // Fallback for file:// protocol
})();

// DOM Elements
const chatContainer = document.getElementById("chat");
const questionInput = document.getElementById("question");
const sendButton = document.getElementById("sendButton");
const welcomeScreen = document.getElementById("welcomeScreen");
const toast = document.getElementById("toast");
const hudCoords = document.getElementById("hudCoords");
const hotspotCard = document.getElementById("hotspotCard");
const hsClose = document.getElementById("hsClose");
const hsConsultBtn = document.getElementById("hsConsultBtn");

// Hotspot Card Elements
const hsName = document.getElementById("hsName");
const hsDesc = document.getElementById("hsDesc");
const hsType = document.getElementById("hsType");
const hsSoc = document.getElementById("hsSoc");
const hsRain = document.getElementById("hsRain");
const hsBio = document.getElementById("hsBio");

let activeHotspot = null;

// ============================================================
// 2. AMBIENT SOUNDSCAPE SYNTHESIZER (WEB AUDIO API)
// ============================================================
let audioCtx = null;
let ambientGain = null;
let isSoundOn = false;

function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

function toggleSound() {
    initAudio();
    isSoundOn = !isSoundOn;
    const soundBtn = document.getElementById("soundToggle");

    if (isSoundOn) {
        soundBtn.innerHTML = '<span class="btn-icon">🔊</span>';
        startAmbientNoise();
        showToast("🌿 Ambient Eco-Soundscape Enabled");
    } else {
        soundBtn.innerHTML = '<span class="btn-icon">🔇</span>';
        stopAmbientNoise();
        showToast("🔇 Soundscape Muted");
    }
}

function startAmbientNoise() {
    if (!audioCtx) return;
    
    // Generate gentle forest wind using brown/pink filtered noise buffer
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Gain
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter to warm gentle breeze
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(340, audioCtx.currentTime);

    ambientGain = audioCtx.createGain();
    ambientGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    ambientGain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 2);

    noise.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);
    noise.start();
    noise._source = noise;
}

function stopAmbientNoise() {
    if (ambientGain && audioCtx) {
        ambientGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1);
        setTimeout(() => {
            if (ambientGain) ambientGain.disconnect();
        }, 1000);
    }
}

function playSuccessChime() {
    if (!isSoundOn || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(432, audioCtx.currentTime); // 432 Hz Earth frequency
        osc.frequency.exponentialRampToValueAtTime(576, audioCtx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.65);
    } catch (_) {}
}

document.getElementById("soundToggle")?.addEventListener("click", toggleSound);

// ============================================================
// 3. THEME & VIEWPORT LAYOUT SWITCHING
// ============================================================
const themeToggle = document.getElementById("themeToggle");
themeToggle?.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    showToast(`${nextTheme === "dark" ? "🌙 Dark Forest" : "☀️ Botanical Light"} theme activated`);
});

const viewButtons = document.querySelectorAll(".view-btn");
const workspace = document.getElementById("workspace");

viewButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        viewButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const view = btn.getAttribute("data-view");

        workspace.classList.remove("layout-split", "layout-globe", "layout-chat");
        if (view === "split") workspace.classList.add("layout-split");
        if (view === "globe") workspace.classList.add("layout-globe");
        if (view === "chat") workspace.classList.add("layout-chat");

        // Resize 3D canvas
        setTimeout(() => {
            if (window.onGlobeResize) window.onGlobeResize();
        }, 320);
    });
});

// Toast Notification
function showToast(text, duration = 3000) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("active");
    setTimeout(() => {
        toast.classList.remove("active");
    }, duration);
}

// ============================================================
// 4. THREE.JS 3D EARTH BIOSPHERE ENGINE
// ============================================================
const GLOBE_CONFIG = {
    radius: 2.2,
    segments: 64,
    autoRotateSpeed: 0.0018,
    activeLayer: "vitality"
};

const HOTSPOTS_DATA = [
    {
        id: "indo-gangetic",
        name: "Indo-Gangetic Agro-Plain",
        type: "Intensive Cereal Agro-Ecosystem",
        lat: 26.8467,
        lon: 80.9462,
        soc: "0.45% (Critical Depletion)",
        rain: "780 mm/yr",
        bio: "Low (Monoculture)",
        desc: "Intense rice-wheat monoculture facing humus depletion and straw burning. High potential for direct-seeded rice, zero-tillage, and Sesbania green manuring.",
        prompt: "My soil organic carbon is low at 0.45% in an intensive cereal plain. What scientifically validated regenerative practices build active carbon pools?"
    },
    {
        id: "amazon-basin",
        name: "Amazon Tropical Rainforest",
        type: "Primary Planetary Carbon Sink",
        lat: -3.4653,
        lon: -62.2159,
        soc: "3.85% (High Humus)",
        rain: "2,400 mm/yr",
        bio: "Ultra-High (Megadiverse)",
        desc: "Hyper-diverse tropical canopy generating biotic moisture pump. Deforested borders require multi-strata agroforestry and native tree corridors.",
        prompt: "How can agroforestry systems mimic natural tropical rainforest canopy strata to restore degraded agricultural margins?"
    },
    {
        id: "sahel-green-wall",
        name: "Sahel Great Green Wall",
        type: "Semi-Arid Dryland Agro-Silvopasture",
        lat: 14.4974,
        lon: 14.4524,
        soc: "0.28% (Severe Deficit)",
        rain: "340 mm/yr",
        bio: "Fragile (Drought Prone)",
        desc: "Severe desertification margin. Utilizing Farmer-Managed Natural Regeneration (FMNR) and nitrogen-fixing Faidherbia albida to restore microclimates.",
        prompt: "What management practices improve soil moisture retention and organic matter in a semi-arid zone with less than 400mm annual rainfall?"
    },
    {
        id: "corn-belt",
        name: "North American Corn Belt",
        type: "Temperate Commercial Cropland",
        lat: 41.5868,
        lon: -93.6250,
        soc: "1.75% (Moderate)",
        rain: "890 mm/yr",
        bio: "Low-Moderate (Rotational)",
        desc: "Deep mollisol soils historically degraded by continuous maize-soy rotations. Multi-species overwintering cover crops prevent nitrate leaching.",
        prompt: "What are the evidence-backed benefits of multi-species cover crops (rye, hairy vetch, crimson clover) on soil aggregate stability?"
    },
    {
        id: "boreal-peatlands",
        name: "Boreal Peatland Sinks",
        type: "Sub-Arctic Carbon & Wetland Reserve",
        lat: 56.1304,
        lon: -106.3468,
        soc: "14.5% (Vast Peat Sink)",
        rain: "520 mm/yr",
        bio: "Specialized Peat Bryophytes",
        desc: "Holds enormous stores of terrestrial carbon in waterlogged peat. Protecting hydrological tables prevents massive atmospheric carbon fluxes.",
        prompt: "Why is water table management critical for preserving organic carbon density in peatland and wetland soils?"
    },
    {
        id: "borneo-sundaland",
        name: "Borneo Peat Swamp Ecosystem",
        type: "Tropical Wetland & Flora Canopy",
        lat: 0.9619,
        lon: 114.5548,
        soc: "8.2% (Histosol)",
        rain: "2,850 mm/yr",
        bio: "Critical Endangered Species",
        desc: "Vulnerable to drainage and monoculture palm encroachment. Riparian buffer restoration and paludiculture crop adoption are vital.",
        prompt: "What biological buffer zones best protect riparian biodiversity and minimize agricultural runoff into freshwater ecosystems?"
    },
    {
        id: "cerrado-savanna",
        name: "Cerrado Biodiverse Savanna",
        type: "Acidic Oxisol Agro-Pastoral Zone",
        lat: -14.2350,
        lon: -51.9253,
        soc: "1.10% (Depleted Oxisol)",
        rain: "1,450 mm/yr",
        bio: "Deep-Rooted Floral Diversity",
        desc: "High phosphorus fixation and deep oxisols. Integrated Crop-Livestock-Forestry (ICLF) systems triple organic matter compared to degraded pasture.",
        prompt: "How does Integrated Crop-Livestock-Forestry (ICLF) improve soil physical properties and microbial biomass in tropical soils?"
    }
];

function init3DBiosphere() {
    const container = document.getElementById("globe-container");
    const canvas = document.getElementById("globe-canvas");
    if (!container || !canvas || typeof THREE === "undefined") return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5.8);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 3. Procedural Biosphere Earth Texture Generator
    function generateBiosphereTexture(layer = "vitality") {
        const texCanvas = document.createElement("canvas");
        texCanvas.width = 2048;
        texCanvas.height = 1024;
        const ctx = texCanvas.getContext("2d");

        // Base Oceanic Abyssal Gradient
        const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
        if (layer === "carbon") {
            oceanGrad.addColorStop(0, "#081014");
            oceanGrad.addColorStop(1, "#03080b");
        } else {
            oceanGrad.addColorStop(0, "#05161d");
            oceanGrad.addColorStop(0.5, "#08212b");
            oceanGrad.addColorStop(1, "#041319");
        }
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, 2048, 1024);

        // Continental Drawing Shapes (Approximate geographic landmass bounds)
        function drawContinent(points, fillColor, strokeColor) {
            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i][0], points[i][1]);
            }
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
            if (strokeColor) {
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }

        // Set palette according to active layer
        let landFill = "#163a27";
        let landStroke = "#20593b";
        let hotspotFill = "#22c55e";

        if (layer === "carbon") {
            landFill = "#291b0d";
            landStroke = "#452d14";
            hotspotFill = "#f59e0b";
        } else if (layer === "hydrology") {
            landFill = "#0d2830";
            landStroke = "#14414f";
            hotspotFill = "#06b6d4";
        } else if (layer === "corridors") {
            landFill = "#1e1329";
            landStroke = "#3b1e54";
            hotspotFill = "#a855f7";
        }

        // Continents Polygons (Coordinates mapped onto 2048x1024)
        // North America
        drawContinent([
            [180, 160], [350, 140], [520, 180], [580, 270], [480, 420], 
            [380, 480], [320, 560], [280, 520], [220, 360], [160, 260]
        ], landFill, landStroke);

        // South America
        drawContinent([
            [380, 540], [490, 530], [580, 620], [540, 780], [460, 920], 
            [410, 840], [370, 680], [350, 590]
        ], landFill, landStroke);

        // Europe & Asia
        drawContinent([
            [940, 160], [1160, 140], [1480, 160], [1720, 240], [1680, 460], 
            [1500, 520], [1320, 590], [1180, 490], [980, 460], [910, 320], [860, 220]
        ], landFill, landStroke);

        // Africa
        drawContinent([
            [920, 410], [1140, 420], [1220, 540], [1180, 760], [1090, 880], 
            [980, 740], [900, 570], [870, 470]
        ], landFill, landStroke);

        // Australia
        drawContinent([
            [1560, 660], [1740, 640], [1810, 740], [1730, 860], [1590, 830], [1540, 730]
        ], landFill, landStroke);

        // Biosphere Vegetation / Carbon Density Patches
        for (let i = 0; i < 48; i++) {
            const rx = (Math.sin(i * 99) * 0.5 + 0.5) * 1900 + 70;
            const ry = (Math.cos(i * 33) * 0.5 + 0.5) * 800 + 100;
            const rSize = (Math.sin(i) * 0.5 + 0.5) * 45 + 15;

            const radial = ctx.createRadialGradient(rx, ry, 2, rx, ry, rSize);
            radial.addColorStop(0, hotspotFill);
            radial.addColorStop(1, "transparent");
            ctx.fillStyle = radial;
            ctx.beginPath();
            ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Biosphere Latitudinal Contour Lines
        ctx.strokeStyle = layer === "carbon" ? "rgba(245, 158, 11, 0.08)" : "rgba(16, 185, 129, 0.08)";
        ctx.lineWidth = 1;
        for (let y = 100; y < 1024; y += 75) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(2048, y);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(texCanvas);
        return texture;
    }

    // 4. Main Sphere Mesh
    const globeGeo = new THREE.SphereGeometry(GLOBE_CONFIG.radius, GLOBE_CONFIG.segments, GLOBE_CONFIG.segments);
    let globeMat = new THREE.MeshPhongMaterial({
        map: generateBiosphereTexture(GLOBE_CONFIG.activeLayer),
        shininess: 25,
        specular: new THREE.Color(0x164e63)
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // 5. Atmospheric Fresnel Halo Glow
    const atmosGeo = new THREE.SphereGeometry(GLOBE_CONFIG.radius * 1.15, 48, 48);
    const atmosMat = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.68 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
                gl_FragColor = vec4(0.06, 0.72, 0.51, 1.0) * intensity * 1.6;
            }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 6. Swirling Bio-Particles System (1,200 particles)
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    const baseColor = new THREE.Color(0x10b981);
    const amberColor = new THREE.Color(0xf59e0b);
    const cyanColor = new THREE.Color(0x06b6d4);

    for (let i = 0; i < particleCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = GLOBE_CONFIG.radius * (1.04 + Math.random() * 0.28);

        particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        particlePositions[i * 3 + 2] = r * Math.cos(phi);

        // Mixed botanical palette
        const colorChoice = Math.random();
        const pColor = colorChoice < 0.6 ? baseColor : (colorChoice < 0.85 ? cyanColor : amberColor);
        particleColors[i * 3] = pColor.r;
        particleColors[i * 3 + 1] = pColor.g;
        particleColors[i * 3 + 2] = pColor.b;

        particleSpeeds[i] = 0.001 + Math.random() * 0.003;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
        size: 0.038,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    globeGroup.add(particleSystem);

    // 7. Interactive 3D Hotspot Markers
    const hotspotMarkers = [];
    const markerGroup = new THREE.Group();
    globeGroup.add(markerGroup);

    function latLonToVector3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        return new THREE.Vector3(
            -(radius * Math.sin(phi) * Math.cos(theta)),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }

    HOTSPOTS_DATA.forEach(data => {
        const pos = latLonToVector3(data.lat, data.lon, GLOBE_CONFIG.radius * 1.015);
        
        // Pin Mesh
        const pinGeo = new THREE.SphereGeometry(0.065, 16, 16);
        const pinMat = new THREE.MeshBasicMaterial({
            color: 0x34d399
        });
        const pinMesh = new THREE.Mesh(pinGeo, pinMat);
        pinMesh.position.copy(pos);
        pinMesh.userData = data;

        // Glowing outer pulse ring
        const ringGeo = new THREE.RingGeometry(0.08, 0.12, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x10b981,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(pos);
        ringMesh.lookAt(new THREE.Vector3(0, 0, 0));

        markerGroup.add(pinMesh);
        markerGroup.add(ringMesh);

        hotspotMarkers.push({ pin: pinMesh, ring: ringMesh, data: data });
    });

    // 8. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    sunLight.position.set(5, 3, 4);
    scene.add(sunLight);

    // 9. Interactive Drag & Orbit Handling
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let autoRotate = true;
    let targetRotationX = 0.25;
    let targetRotationY = 0.4;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onPointerDown(e) {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    }

    function onPointerMove(e) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            targetRotationY += deltaX * 0.005;
            targetRotationX += deltaY * 0.005;
            targetRotationX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotationX));

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }

        // Raycast Hotspot Hover
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(hotspotMarkers.map(h => h.pin));
        if (intersects.length > 0) {
            canvas.style.cursor = "pointer";
            const hovered = intersects[0].object.userData;
            if (hudCoords) {
                hudCoords.textContent = `${hovered.name} (${hovered.lat > 0 ? hovered.lat + '°N' : Math.abs(hovered.lat) + '°S'})`;
            }
        } else {
            canvas.style.cursor = isDragging ? "grabbing" : "grab";
        }
    }

    function onPointerUp(e) {
        if (!isDragging) return;
        isDragging = false;

        // Check if clicked a hotspot without dragging
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(hotspotMarkers.map(h => h.pin));
        if (intersects.length > 0) {
            selectHotspot(intersects[0].object.userData);
        }
    }

    function onWheel(e) {
        e.preventDefault();
        camera.position.z += e.deltaY * 0.0035;
        camera.position.z = Math.max(3.4, Math.min(8.5, camera.position.z));
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // Select Hotspot & Display Telemetry Card
    function selectHotspot(data) {
        activeHotspot = data;
        if (!hotspotCard) return;

        hsName.textContent = data.name;
        hsType.textContent = data.type;
        hsDesc.textContent = data.desc;
        hsSoc.textContent = data.soc;
        hsRain.textContent = data.rain;
        hsBio.textContent = data.bio;

        hotspotCard.classList.add("visible");
        showToast(`📍 Focused: ${data.name}`);

        // Rotate globe towards hotspot position
        const targetLon = -data.lon * (Math.PI / 180) - Math.PI / 2;
        const targetLat = data.lat * (Math.PI / 180);
        targetRotationY = targetLon;
        targetRotationX = targetLat * 0.6;
    }

    hsClose?.addEventListener("click", () => {
        hotspotCard.classList.remove("visible");
        activeHotspot = null;
    });

    hsConsultBtn?.addEventListener("click", () => {
        if (!activeHotspot) return;
        questionInput.value = activeHotspot.prompt;
        hotspotCard.classList.remove("visible");
        sendMessage();
    });

    // 10. HUD Controls (Rotate, Sun, Reset, Layers)
    document.getElementById("btnRotate")?.addEventListener("click", () => {
        autoRotate = !autoRotate;
        showToast(autoRotate ? "🔄 Auto-Rotation On" : "⏸️ Auto-Rotation Paused");
    });

    let sunAngle = 0;
    document.getElementById("btnSunlight")?.addEventListener("click", () => {
        sunAngle += Math.PI / 3;
        sunLight.position.x = 5 * Math.cos(sunAngle);
        sunLight.position.z = 5 * Math.sin(sunAngle);
        showToast("☀️ Solar Angle Shifted");
    });

    document.getElementById("btnResetView")?.addEventListener("click", () => {
        targetRotationX = 0.25;
        targetRotationY = 0.4;
        camera.position.set(0, 0, 5.8);
        hotspotCard.classList.remove("visible");
        showToast("🎯 Biosphere Perspective Reset");
    });

    // Layer Switcher Buttons
    const layerPills = document.querySelectorAll(".layer-pill");
    layerPills.forEach(pill => {
        pill.addEventListener("click", () => {
            layerPills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            const layer = pill.getAttribute("data-layer");
            GLOBE_CONFIG.activeLayer = layer;

            // Generate and swap globe texture
            globeMesh.material.map = generateBiosphereTexture(layer);
            globeMesh.material.needsUpdate = true;

            showToast(`🛰️ Switched 3D Layer: ${pill.textContent.trim()}`);
        });
    });

    // 11. Animation Loop
    let clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Smooth Damped Rotation
        if (autoRotate && !isDragging) {
            targetRotationY += GLOBE_CONFIG.autoRotateSpeed;
        }

        globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.08;
        globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.08;

        // Swirling Bio-Particles Animation
        const positions = particleSystem.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            const idx = i * 3;
            const x = positions[idx];
            const z = positions[idx + 2];
            const speed = particleSpeeds[i];

            // Orbit around Y
            positions[idx] = x * Math.cos(speed) - z * Math.sin(speed);
            positions[idx + 2] = x * Math.sin(speed) + z * Math.cos(speed);
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;

        // Marker Ring Pulses
        hotspotMarkers.forEach((marker, index) => {
            const scale = 1.0 + Math.sin(elapsedTime * 3 + index) * 0.25;
            marker.ring.scale.set(scale, scale, scale);
        });

        renderer.render(scene, camera);
    }
    animate();

    // Resize Handler
    window.onGlobeResize = () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", window.onGlobeResize);
}

// ============================================================
// 5. SCIENTIFIC CHAT & RAG CLIENT LOGIC
// ============================================================

function useSuggestion(button) {
    const textElement = button.querySelector(".chip-text span") || button;
    questionInput.value = textElement.textContent.trim();
    sendMessage();
}

function appendTopic(topic) {
    const current = questionInput.value.trim();
    if (current) {
        questionInput.value = `${current} (focus on: ${topic})`;
    } else {
        questionInput.value = `Explain evidence-based practices for: ${topic}`;
    }
    questionInput.focus();
}

function removeWelcome() {
    if (welcomeScreen) {
        welcomeScreen.style.display = "none";
    }
}

// Send Message
async function sendMessage() {
    const question = questionInput.value.trim();
    if (!question || sendButton.disabled) return;

    removeWelcome();
    addUserMessage(question);

    questionInput.value = "";
    resizeTextarea();
    sendButton.disabled = true;

    const thinkingMessage = addThinkingMessage();
    scrollToBottom();

    try {
        const response = await fetch(`${API_URL}/ask`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question: question
            })
        });

        if (!response.ok) {
            let errorMsg = "Unable to retrieve evidence-grounded recommendation.";
            try {
                const data = await response.json();
                if (data.detail) errorMsg = data.detail;
            } catch (_) {}
            throw new Error(errorMsg);
        }

        const data = await response.json();
        if (!data.answer) {
            throw new Error("The AI model returned an empty evidence answer.");
        }

        thinkingMessage.remove();
        addAssistantMessage(data.answer, data.mode);
        playSuccessChime();

    } catch (err) {
        thinkingMessage.remove();
        addErrorMessage(err.message || "Failed to connect to the Biodiversity Intelligence API.");
    } finally {
        sendButton.disabled = false;
        questionInput.focus();
        scrollToBottom();
    }
}

// Add User Message
function addUserMessage(text) {
    const message = document.createElement("div");
    message.className = "message user";

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.textContent = "👤";

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.textContent = text;

    message.appendChild(bubble);
    message.appendChild(avatar);
    chatContainer.appendChild(message);
}

// Add Assistant Message with Structured Formatting
function addAssistantMessage(answer, mode = "rag") {
    const message = document.createElement("div");
    message.className = "message assistant";

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.textContent = "🌱";

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";

    formatStructuredAnswer(answer, bubble);

    // Message Actions (Copy & Verified Badge)
    const actions = document.createElement("div");
    actions.className = "msg-actions";
    actions.innerHTML = `
        <button class="copy-btn" onclick="copyAnswerText(this)">📋 Copy Recommendation</button>
        <span style="font-size: 11px; color: var(--text-muted); margin-left: auto;">
            ${mode === "rag" ? "✓ Grounded RAG Evidence" : "✓ General Dialogue"}
        </span>
    `;
    bubble.appendChild(actions);

    message.appendChild(avatar);
    message.appendChild(bubble);
    chatContainer.appendChild(message);
    scrollToBottom();
}

// Parse Structured Sections (Assessment, Recommendation, Why, Evidence, Limitations)
function formatStructuredAnswer(answer, container) {
    const sectionPattern = /(Assessment|Recommendation|Why|Evidence|Limitations):/g;
    const parts = answer.split(sectionPattern);

    if (parts.length > 1) {
        for (let i = 1; i < parts.length; i += 2) {
            const heading = parts[i];
            const content = (parts[i + 1] || "").trim();
            if (!content) continue;

            const secDiv = document.createElement("div");
            secDiv.className = `answer-section section-${heading.toLowerCase()}`;

            const title = document.createElement("h3");
            const icon = heading === "Assessment" ? "🩺" :
                         heading === "Recommendation" ? "🎯" :
                         heading === "Why" ? "🔬" :
                         heading === "Evidence" ? "📚" : "⚠️";
            title.textContent = `${icon} ${heading}`;

            const p = document.createElement("p");

            // Format verified chunk citations (e.g. SRC01_CHUNK014, Page 24)
            let formattedContent = content.replace(/(SRC\w+_CHUNK\w+)/g, '<span class="citation-tag">📄 $1</span>');
            p.innerHTML = formattedContent;

            secDiv.appendChild(title);
            secDiv.appendChild(p);
            container.appendChild(secDiv);
        }
    } else {
        // Fallback for non-structured answers
        const p = document.createElement("p");
        p.textContent = answer;
        container.appendChild(p);
    }
}

// Scientific Evidence Loading Animation
function addThinkingMessage() {
    const message = document.createElement("div");
    message.className = "message assistant loading-message";

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.textContent = "🌱";

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";

    bubble.innerHTML = `
        <div class="loader-card">
            <div class="loader-header">
                <div class="loader-spinner"></div>
                <span class="loader-status-text">Synthesizing Evidence-Backed Recommendation...</span>
            </div>
            <div class="loader-steps">
                <div class="loader-step active" id="step1">Extracting multi-variable environmental constraints</div>
                <div class="loader-step" id="step2">Semantic search in ChromaDB vector repository</div>
                <div class="loader-step" id="step3">Gemini 2.5 grounded synthesis & citation check</div>
            </div>
        </div>
    `;

    message.appendChild(avatar);
    message.appendChild(bubble);
    chatContainer.appendChild(message);

    // Staggered step highlights
    setTimeout(() => {
        const step2 = bubble.querySelector("#step2");
        if (step2) step2.classList.add("active");
    }, 1200);

    setTimeout(() => {
        const step3 = bubble.querySelector("#step3");
        if (step3) step3.classList.add("active");
    }, 2400);

    return message;
}

// Add Error Message
function addErrorMessage(text) {
    const message = document.createElement("div");
    message.className = "message assistant";

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.textContent = "⚠️";

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.style.border = "1px solid var(--coral-400)";
    bubble.style.color = "var(--coral-400)";
    bubble.textContent = text;

    message.appendChild(avatar);
    message.appendChild(bubble);
    chatContainer.appendChild(message);
}

// Copy Answer to Clipboard
function copyAnswerText(button) {
    const bubble = button.closest(".msg-bubble");
    if (!bubble) return;
    const text = bubble.innerText.replace("📋 Copy Recommendation", "").trim();
    navigator.clipboard.writeText(text).then(() => {
        showToast("📋 Recommendation copied to clipboard!");
    });
}

// Reset Conversation
document.getElementById("btnClearChat")?.addEventListener("click", () => {
    chatContainer.innerHTML = "";
    if (welcomeScreen) {
        chatContainer.appendChild(welcomeScreen);
        welcomeScreen.style.display = "block";
    }
    showToast("🗑️ Conversation reset");
});

// Auto Scroll
function scrollToBottom() {
    requestAnimationFrame(() => {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: "smooth"
        });
    });
}

// Auto Resize Textarea
function resizeTextarea() {
    questionInput.style.height = "auto";
    questionInput.style.height = Math.min(questionInput.scrollHeight, 140) + "px";
}

questionInput.addEventListener("input", resizeTextarea);

questionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// ============================================================
// 6. INITIALIZATION ON LOAD
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
    init3DBiosphere();
    questionInput.focus();
});
