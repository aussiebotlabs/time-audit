// Constants and State
const STORAGE_KEYS = {
    API_KEY: 'timeaudit_apikey',
    INTERVAL: 'timeaudit_interval',
    ENTRIES: 'timeaudit_entries'
};

function createEntry(transcript, startTime, endTime) {
    return {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        transcript: transcript.trim(),
        recordedAt: new Date().toISOString()
    };
}

let state = {
    apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || '',
    intervalMinutes: parseInt(localStorage.getItem(STORAGE_KEYS.INTERVAL)) || 15,
    entries: (() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTRIES)) || [];
        } catch (e) {
            console.error("Failed to parse entries:", e);
            return [];
        }
    })(),
    nextPromptTime: null,
    timerId: null,
    isRecording: false,
    currentTranscript: '',
    lastPromptTime: new Date()
};

// DOM Elements
let elements = {};

// --- Initialization ---

function init() {
    // Populate elements
    elements = {
        timeLeft: document.getElementById('time-left'),
        settingsBtn: document.getElementById('settings-btn'),
        settingsModal: document.getElementById('settings-modal'),
        apiKeyInput: document.getElementById('api-key'),
        saveKeyBtn: document.getElementById('save-key-btn'),
        intervalSelect: document.getElementById('interval-select'),
        closeSettingsBtn: document.getElementById('close-settings-btn'),
        
        transcriptList: document.getElementById('transcript-list'),
        exportBtn: document.getElementById('export-btn'),
        
        recordingModal: document.getElementById('recording-modal'),
        periodTime: document.getElementById('period-time'),
        liveTranscript: document.getElementById('live-transcript'),
        stopRecordingBtn: document.getElementById('stop-recording-btn'),
        cancelRecordingBtn: document.getElementById('cancel-recording-btn')
    };

    // Initial UI state
    elements.intervalSelect.value = state.intervalMinutes;
    elements.apiKeyInput.value = state.apiKey;
    renderEntries();
    
    // Event Listeners
    elements.settingsBtn.addEventListener('click', () => {
        console.log("Settings button clicked");
        showModal(elements.settingsModal);
    });
    
    elements.closeSettingsBtn.addEventListener('click', () => hideModal(elements.settingsModal));
    
    elements.saveKeyBtn.addEventListener('click', () => {
        state.apiKey = elements.apiKeyInput.value.trim();
        localStorage.setItem(STORAGE_KEYS.API_KEY, state.apiKey);
        alert('API Key saved!');
    });
    
    elements.intervalSelect.onchange = (e) => {
        state.intervalMinutes = parseInt(e.target.value);
        localStorage.setItem(STORAGE_KEYS.INTERVAL, state.intervalMinutes);
        resetTimer();
    };
    
    elements.exportBtn.addEventListener('click', exportEntries);
    
    elements.stopRecordingBtn.addEventListener('click', stopAndSaveRecording);
    elements.cancelRecordingBtn.addEventListener('click', cancelRecording);

    // Start timer
    resetTimer();
    updateTimerDisplay();
    setInterval(updateTimerDisplay, 1000);

    // If no API key, show settings immediately
    if (!state.apiKey) {
        showModal(elements.settingsModal);
    }
}

// --- Modals ---

function showModal(modal) {
    if (modal) {
        modal.classList.add('active');
    } else {
        console.error("Modal element not found");
    }
}

function hideModal(modal) {
    if (modal) {
        modal.classList.remove('active');
    }
}

// --- Timer Logic ---

function playNotificationSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.warn('Audio notification failed:', e);
    }
}

function resetTimer() {
    const now = new Date();
    state.lastPromptTime = now;
    state.nextPromptTime = new Date(now.getTime() + state.intervalMinutes * 60000);
}

function updateTimerDisplay() {
    if (state.isRecording || elements.settingsModal.classList.contains('active')) return;

    const now = new Date();
    const diff = state.nextPromptTime - now;

    if (diff <= 0) {
        triggerPrompt();
        return;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    elements.timeLeft.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function triggerPrompt() {
    if (state.isRecording) return;
    
    // Play notification sound
    playNotificationSound();
    
    const start = state.lastPromptTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const end = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    elements.periodTime.textContent = `${start} - ${end}`;
    
    showModal(elements.recordingModal);
    startRecording();
}

// --- Recording & Deepgram ---

let dgConnection;
let mediaRecorder;

async function startRecording() {
    if (!state.apiKey) {
        alert('Please provide a Deepgram API Key in settings.');
        hideModal(elements.recordingModal);
        showModal(elements.settingsModal);
        return;
    }

    try {
        state.isRecording = true;
        state.currentTranscript = '';
        elements.liveTranscript.textContent = '';

        const { createClient, LiveTranscriptionEvents } = window.deepgram;
        const client = createClient(state.apiKey);
        
        dgConnection = client.listen.live({
            model: "nova-3",
            smart_format: true,
            interim_results: true,
            language: "en-US",
        });

        dgConnection.on(LiveTranscriptionEvents.Open, () => {
            console.log("Deepgram connection opened");
        });

        dgConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
            const transcript = data.channel.alternatives[0].transcript;
            if (transcript) {
                if (data.is_final) {
                    state.currentTranscript += transcript + ' ';
                    elements.liveTranscript.textContent = state.currentTranscript;
                } else {
                    // Show interim result
                    elements.liveTranscript.textContent = state.currentTranscript + transcript + '...';
                }
            }
        });

        dgConnection.on(LiveTranscriptionEvents.Error, (err) => {
            console.error("Deepgram Error:", err);
            alert("Error connecting to Deepgram. Check your API key.");
            cancelRecording();
        });

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && dgConnection.getReadyState() === 1) {
                dgConnection.send(event.data);
            }
        };

        mediaRecorder.start(250);
    } catch (err) {
        console.error("Microphone Access Error:", err);
        alert("Could not access microphone.");
        hideModal(elements.recordingModal);
    }
}

function stopAndSaveRecording() {
    if (mediaRecorder) mediaRecorder.stop();
    if (dgConnection) dgConnection.requestClose();
    
    if (state.currentTranscript.trim()) {
        const entry = {
            id: crypto.randomUUID(),
            startTime: state.lastPromptTime.toISOString(),
            endTime: new Date().toISOString(),
            transcript: state.currentTranscript.trim(),
            recordedAt: new Date().toISOString()
        };
        
        state.entries.unshift(entry);
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(state.entries));
        renderEntries();
    }

    state.isRecording = false;
    hideModal(elements.recordingModal);
    resetTimer();
}

function cancelRecording() {
    if (mediaRecorder) mediaRecorder.stop();
    if (dgConnection) dgConnection.requestClose();
    
    state.isRecording = false;
    hideModal(elements.recordingModal);
    resetTimer();
}

// --- Storage & UI ---

function renderEntries() {
    if (state.entries.length === 0) {
        elements.transcriptList.innerHTML = '<p class="empty-state">Your reporting history will appear here.</p>';
        return;
    }

    elements.transcriptList.innerHTML = state.entries.map(entry => {
        const start = new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const end = new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const date = new Date(entry.recordedAt).toLocaleDateString();
        
        return `
            <div class="transcript-entry" data-id="${entry.id}">
                <button class="delete-entry-btn" onclick="deleteEntry('${entry.id}')">✕</button>
                <div class="entry-header">
                    <span class="entry-time">${date} | ${start} - ${end}</span>
                </div>
                <div class="entry-text">${entry.transcript}</div>
            </div>
        `;
    }).join('');
}

window.deleteEntry = function(id) {
    if (confirm('Delete this entry?')) {
        state.entries = state.entries.filter(e => e.id !== id);
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(state.entries));
        renderEntries();
    }
};

function exportEntries() {
    if (state.entries.length === 0) return;
    
    const dataStr = JSON.stringify(state.entries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `time-audit-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
