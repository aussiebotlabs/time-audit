// Storage Keys
export const STORAGE_KEYS = {
    API_KEY: 'timeaudit_apikey',
    INTERVAL: 'timeaudit_interval',
    ENTRIES: 'timeaudit_entries'
};

// State
export let state = {
    apiKey: null,
    interval: 15,
    entries: [],
    timer: null,
    countdownTimer: null,
    nextCheckInTime: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    deepgramConnection: null,
    isRecording: false,
    currentTranscript: ''
};

// DOM Elements
const elements = {
    // Modals
    apiKeyModal: document.getElementById('api-key-modal'),
    recordingModal: document.getElementById('recording-modal'),
    
    // Settings
    intervalSelect: document.getElementById('interval-select'),
    apiKeyDisplay: document.getElementById('api-key-display'),
    editApiKeyBtn: document.getElementById('edit-api-key-btn'),
    countdownDisplay: document.getElementById('countdown-display'),
    
    // API Key Modal
    apiKeyInput: document.getElementById('api-key-input'),
    saveApiKeyBtn: document.getElementById('save-api-key-btn'),
    
    // Recording Modal
    periodStart: document.getElementById('period-start'),
    periodEnd: document.getElementById('period-end'),
    startRecordingBtn: document.getElementById('start-recording-btn'),
    stopRecordingBtn: document.getElementById('stop-recording-btn'),
    recordingStatus: document.getElementById('recording-status'),
    liveTranscript: document.getElementById('live-transcript'),
    saveTranscriptBtn: document.getElementById('save-transcript-btn'),
    cancelRecordingBtn: document.getElementById('cancel-recording-btn'),
    
    // Transcript List
    transcriptList: document.getElementById('transcript-list'),
    exportJsonBtn: document.getElementById('export-json-btn'),
    exportTextBtn: document.getElementById('export-text-btn'),
    clearAllBtn: document.getElementById('clear-all-btn')
};

// Initialize App
function init() {
    loadFromStorage();
    setupEventListeners();
    
    if (!state.apiKey) {
        showApiKeyModal();
    } else {
        startTimer();
    }
    
    renderTranscripts();
    updateApiKeyDisplay();
}

// Storage Functions
function loadFromStorage() {
    state.apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    state.interval = parseInt(localStorage.getItem(STORAGE_KEYS.INTERVAL) || '15', 10);
    
    const storedEntries = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    state.entries = storedEntries ? JSON.parse(storedEntries) : [];
    
    elements.intervalSelect.value = state.interval.toString();
}

function saveToStorage() {
    if (state.apiKey) {
        localStorage.setItem(STORAGE_KEYS.API_KEY, state.apiKey);
    }
    localStorage.setItem(STORAGE_KEYS.INTERVAL, state.interval.toString());
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(state.entries));
}

// Event Listeners
function setupEventListeners() {
    // Settings
    elements.intervalSelect.addEventListener('change', handleIntervalChange);
    elements.editApiKeyBtn.addEventListener('click', showApiKeyModal);
    
    // API Key Modal
    elements.saveApiKeyBtn.addEventListener('click', handleSaveApiKey);
    elements.apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSaveApiKey();
    });
    
    // Recording Modal
    elements.startRecordingBtn.addEventListener('click', startRecording);
    elements.stopRecordingBtn.addEventListener('click', stopRecording);
    elements.saveTranscriptBtn.addEventListener('click', saveTranscriptEntry);
    elements.cancelRecordingBtn.addEventListener('click', cancelRecording);
    
    // Transcript Actions
    elements.exportJsonBtn.addEventListener('click', () => exportTranscripts('json'));
    elements.exportTextBtn.addEventListener('click', () => exportTranscripts('text'));
    elements.clearAllBtn.addEventListener('click', clearAllEntries);
}

// Timer Functions
function startTimer(startTime) {
    stopTimer(); // Clear any existing timer
    
    state.currentPeriodStart = startTime || new Date();
    state.nextCheckInTime = new Date(state.currentPeriodStart.getTime() + state.interval * 60 * 1000);
    
    // Update countdown every second
    updateCountdown();
    state.countdownTimer = setInterval(updateCountdown, 1000);
    
    // Set timer for check-in
    const remainingMs = state.nextCheckInTime.getTime() - Date.now();
    state.timer = setTimeout(triggerCheckIn, Math.max(0, remainingMs));
}

function stopTimer() {
    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
    }
    if (state.countdownTimer) {
        clearInterval(state.countdownTimer);
        state.countdownTimer = null;
    }
}

function updateCountdown() {
    if (!state.nextCheckInTime) {
        elements.countdownDisplay.textContent = '--:--';
        return;
    }
    
    const now = Date.now();
    const remaining = state.nextCheckInTime - now;
    
    if (remaining <= 0) {
        elements.countdownDisplay.textContent = '00:00';
        return;
    }
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    elements.countdownDisplay.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function handleIntervalChange() {
    state.interval = parseInt(elements.intervalSelect.value, 10);
    saveToStorage();
    startTimer();
}

function triggerCheckIn() {
    playNotification();
    showRecordingModal();
}

function playNotification() {
    try {
        // Create a pleasant double-chime using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Helper to create a tone with envelope
        function playTone(frequency, startTime, duration) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            // Exponential fade out envelope
            gainNode.gain.setValueAtTime(0.15, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        }
        
        // Major third chime: A5 (880Hz) followed by C#6 (1109Hz)
        const now = audioContext.currentTime;
        playTone(880, now, 0.15);           // First chime
        playTone(1109, now + 0.2, 0.4);     // Second chime (slightly delayed)
        
    } catch (err) {
        console.log('Could not play notification sound:', err);
    }
}

// Modal Functions
function showApiKeyModal() {
    elements.apiKeyInput.value = state.apiKey || '';
    elements.apiKeyModal.classList.add('active');
    elements.apiKeyInput.focus();
}

function hideApiKeyModal() {
    elements.apiKeyModal.classList.remove('active');
}

function handleSaveApiKey() {
    const apiKey = elements.apiKeyInput.value.trim();
    
    if (!apiKey) {
        alert('Please enter a valid API key');
        return;
    }
    
    state.apiKey = apiKey;
    saveToStorage();
    updateApiKeyDisplay();
    hideApiKeyModal();
    
    if (!state.timer) {
        startTimer();
    }
}

function updateApiKeyDisplay() {
    if (state.apiKey) {
        elements.apiKeyDisplay.value = '••••••••••••••••';
    } else {
        elements.apiKeyDisplay.value = '';
        elements.apiKeyDisplay.placeholder = 'Not set';
    }
}

function showRecordingModal() {
    state.currentPeriodEnd = new Date();
    const periodStart = state.currentPeriodStart || new Date(state.currentPeriodEnd.getTime() - state.interval * 60 * 1000);
    
    elements.periodStart.textContent = formatTime(periodStart);
    elements.periodEnd.textContent = formatTime(state.currentPeriodEnd);
    
    elements.liveTranscript.textContent = '';
    state.currentTranscript = '';
    
    elements.recordingStatus.textContent = '';
    elements.recordingStatus.className = 'recording-status';
    
    elements.startRecordingBtn.style.display = 'inline-flex';
    elements.stopRecordingBtn.style.display = 'none';
    
    elements.recordingModal.classList.add('active');
}

function hideRecordingModal() {
    elements.recordingModal.classList.remove('active');
    if (state.isRecording) {
        stopRecording();
    }
}

function cancelRecording() {
    hideRecordingModal();
    startTimer(state.currentPeriodEnd); // Restart the timer from where we left off
}

// Recording Functions
async function startRecording() {
    if (!state.apiKey) {
        alert('Please configure your Deepgram API key first');
        return;
    }
    
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.audioStream = stream;
        
        state.isRecording = true;
        elements.startRecordingBtn.style.display = 'none';
        elements.stopRecordingBtn.style.display = 'inline-flex';
        elements.recordingStatus.textContent = 'Connecting...';
        elements.recordingStatus.className = 'recording-status processing';
        elements.liveTranscript.textContent = '';
        state.currentTranscript = '';
        
        // Initialize Deepgram connection
        const { createClient, LiveTranscriptionEvents } = deepgram;
        const client = createClient(state.apiKey);
        
        const connection = client.listen.live({
            model: 'nova-2',
            smart_format: true,
            interim_results: true,
            language: 'en'
        });
        
        state.deepgramConnection = connection;
        
        // Handle connection events
        connection.on(LiveTranscriptionEvents.Open, () => {
            console.log('Deepgram connection opened');
            elements.recordingStatus.textContent = '🎤 Recording...';
            elements.recordingStatus.className = 'recording-status active';
            
            // Send audio from microphone to Deepgram
            const mediaRecorder = new MediaRecorder(state.audioStream, {
                mimeType: 'audio/webm'
            });
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && connection.getReadyState() === 1) {
                    connection.send(event.data);
                }
            };
            
            mediaRecorder.start(250); // Send data every 250ms
            
            // Store for cleanup
            state.mediaRecorder = mediaRecorder;
        });
        
        connection.on(LiveTranscriptionEvents.Transcript, (data) => {
            const transcript = data.channel.alternatives[0].transcript;
            
            if (transcript && transcript.trim().length > 0) {
                if (data.is_final) {
                    state.currentTranscript += transcript + ' ';
                    elements.liveTranscript.textContent = state.currentTranscript;
                } else {
                    // Show interim results
                    elements.liveTranscript.textContent = state.currentTranscript + transcript;
                }
            }
        });
        
        connection.on(LiveTranscriptionEvents.Error, (error) => {
            console.error('Deepgram error:', error);
            elements.recordingStatus.textContent = '⚠️ Error: ' + error.message;
            elements.recordingStatus.className = 'recording-status';
            stopRecording();
        });
        
        connection.on(LiveTranscriptionEvents.Close, () => {
            console.log('Deepgram connection closed');
        });
        
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Failed to access microphone: ' + error.message);
        state.isRecording = false;
        
        // Clean up stream if it was obtained
        if (state.audioStream) {
            state.audioStream.getTracks().forEach(track => track.stop());
            state.audioStream = null;
        }
        
        elements.startRecordingBtn.style.display = 'inline-flex';
        elements.stopRecordingBtn.style.display = 'none';
        elements.recordingStatus.textContent = '';
    }
}

function stopRecording() {
    if (!state.isRecording) return;
    
    state.isRecording = false;
    elements.startRecordingBtn.style.display = 'inline-flex';
    elements.stopRecordingBtn.style.display = 'none';
    elements.recordingStatus.textContent = '✓ Recording stopped';
    elements.recordingStatus.className = 'recording-status success';
    
    // Stop media recorder
    if (state.mediaRecorder) {
        state.mediaRecorder.stop();
        state.mediaRecorder = null;
    }
    
    // Stop audio stream
    if (state.audioStream) {
        state.audioStream.getTracks().forEach(track => track.stop());
        state.audioStream = null;
    }
    
    // Close Deepgram connection
    if (state.deepgramConnection) {
        state.deepgramConnection.finish();
        state.deepgramConnection = null;
    }
    
    // Use the edited content from the contenteditable div
    state.currentTranscript = elements.liveTranscript.textContent.trim();
}

function saveTranscriptEntry() {
    const transcript = elements.liveTranscript.textContent.trim();
    
    if (!transcript) {
        alert('Please record or enter a transcript first');
        return;
    }
    
    const periodEnd = state.currentPeriodEnd;
    const periodStart = state.currentPeriodStart;
    
    const entry = {
        id: generateId(),
        startTime: periodStart.toISOString(),
        endTime: periodEnd.toISOString(),
        transcript: transcript,
        recordedAt: new Date().toISOString()
    };
    
    state.entries.unshift(entry); // Add to beginning
    saveToStorage();
    renderTranscripts();
    hideRecordingModal();
    startTimer(state.currentPeriodEnd); // Start new timer from where we left off
}

// Transcript Display Functions
function renderTranscripts() {
    if (state.entries.length === 0) {
        elements.transcriptList.innerHTML = `
            <div class="empty-state">
                <p>📝 No entries yet</p>
                <p class="empty-subtitle">Your activity log will appear here</p>
            </div>
        `;
        return;
    }
    
    elements.transcriptList.innerHTML = state.entries.map(entry => `
        <div class="transcript-entry" data-id="${entry.id}">
            <div class="entry-header">
                <div class="entry-time">
                    <div class="time-range">
                        ${formatTime(new Date(entry.startTime))} - ${formatTime(new Date(entry.endTime))}
                    </div>
                    <div class="recorded-at">
                        Recorded: ${formatDateTime(new Date(entry.recordedAt))}
                    </div>
                </div>
                <div class="entry-actions">
                    <button class="btn-icon" onclick="deleteEntry('${entry.id}')" title="Delete">🗑️</button>
                </div>
            </div>
            <div class="entry-text">${escapeHtml(entry.transcript)}</div>
        </div>
    `).join('');
}

function deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }
    
    state.entries = state.entries.filter(entry => entry.id !== id);
    saveToStorage();
    renderTranscripts();
}

function clearAllEntries() {
    if (state.entries.length === 0) {
        return;
    }
    
    if (!confirm('Are you sure you want to delete all entries? This cannot be undone.')) {
        return;
    }
    
    state.entries = [];
    saveToStorage();
    renderTranscripts();
}

// Export Functions
function exportTranscripts(format) {
    if (state.entries.length === 0) {
        alert('No entries to export');
        return;
    }
    
    let content, filename, mimeType;
    
    if (format === 'json') {
        content = JSON.stringify(state.entries, null, 2);
        filename = `time-audit-${formatDateForFilename(new Date())}.json`;
        mimeType = 'application/json';
    } else {
        content = generateTextExport();
        filename = `time-audit-${formatDateForFilename(new Date())}.txt`;
        mimeType = 'text/plain';
    }
    
    downloadFile(content, filename, mimeType);
}

function generateTextExport() {
    let text = 'Time Audit Activity Log\n';
    text += '='.repeat(50) + '\n\n';
    
    state.entries.forEach((entry, index) => {
        text += `Entry ${state.entries.length - index}\n`;
        text += `-`.repeat(50) + '\n';
        text += `Time Period: ${formatTime(new Date(entry.startTime))} - ${formatTime(new Date(entry.endTime))}\n`;
        text += `Recorded: ${formatDateTime(new Date(entry.recordedAt))}\n\n`;
        text += `${entry.transcript}\n\n\n`;
    });
    
    return text;
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Utility Functions
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

export function formatDateTime(date) {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

export function formatDateForFilename(date) {
    return date.toISOString().split('T')[0];
}

export function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Make functions available globally for testing and onclick handlers
window.deleteEntry = deleteEntry;
window.showRecordingModal = showRecordingModal;
window.startRecording = startRecording;
window.stopRecording = stopRecording;
window.saveTranscriptEntry = saveTranscriptEntry;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
