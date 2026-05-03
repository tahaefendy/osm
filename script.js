// Socket initialization with error handling
let socket;
try {
    socket = io();
    console.log('Socket.io connected');
} catch (e) {
    console.error('Socket.io could not be initialized. Are you using http://localhost:3000?');
    alert('HATA: Lütfen siteye http://localhost:3000 adresinden giriniz!');
}

// State
let currentKey = '';
let currentLink = '';

// DOM Elements
const stepKey = document.getElementById('step-key');
const stepLink = document.getElementById('step-link');
const stepProgress = document.getElementById('step-progress');
const stepSuccess = document.getElementById('step-success');

const inputKey = document.getElementById('stock-key');
const inputLink = document.getElementById('osm-link');
const btnVerify = document.getElementById('btn-verify');
const btnStart = document.getElementById('btn-start');

const keyError = document.getElementById('key-error');
const statusMsg = document.getElementById('status-msg');
const completedCount = document.getElementById('completed-count');
const progressFill = document.getElementById('progress-fill');
const progressText = document.querySelector('.progress-text');
const logContainer = document.getElementById('log-container');

// --- Navigation ---
function showStep(step) {
    [stepKey, stepLink, stepProgress, stepSuccess].forEach(s => s.classList.remove('active'));
    step.classList.add('active');
}

// --- Key Verification ---
btnVerify.addEventListener('click', async () => {
    const key = inputKey.value.trim();
    if (!key) return;

    btnVerify.disabled = true;
    btnVerify.innerHTML = '<span>Kontrol ediliyor...</span>';

    console.log('Verifying key:', key);
    try {
        const response = await fetch('/verify-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        console.log('Verification response:', data);

        if (data.success) {
            currentKey = key;
            showStep(stepLink);
        } else {
            keyError.style.display = 'flex';
            setTimeout(() => { keyError.style.display = 'none'; }, 3000);
        }
    } catch (err) {
        alert('Sunucu hatası!');
    } finally {
        btnVerify.disabled = false;
        btnVerify.innerHTML = '<span>Doğrula</span><i data-lucide="arrow-right"></i>';
        lucide.createIcons();
    }
});

// --- Start Bot ---
btnStart.addEventListener('click', () => {
    const link = inputLink.value.trim();
    const isValidLink = link && (link.includes('onlinesoccermanager.com') || link.includes('onelink.me'));
    
    if (!isValidLink) {
        alert('Lütfen geçerli bir OSM davet linki giriniz.');
        return;
    }

    currentLink = link;
    showStep(stepProgress);
    
    socket.emit('start-bot', { key: currentKey, link: currentLink });
});

// --- Socket Listeners ---
socket.on('log', (data) => {
    const entry = document.createElement('div');
    entry.className = `log-entry ${data.type}`;
    entry.innerText = `[${new Date().toLocaleTimeString()}] ${data.msg}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
});

socket.on('progress', (data) => {
    const count = data.count;
    completedCount.innerText = count;
    const percent = (count / 10) * 100;
    progressFill.style.width = `${percent}%`;
    progressText.innerText = `${Math.round(percent)}%`;
    statusMsg.innerText = data.msg;
});

socket.on('finished', () => {
    showStep(stepSuccess);
});
