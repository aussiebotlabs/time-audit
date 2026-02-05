# Time Audit App

A privacy-focused, client-side web application that helps you track your time by prompting you to report your activities every 15 minutes (or your chosen interval) using high-quality speech-to-text.

## Features

- **Privacy First**: No server-side code. All transcripts and your Deepgram API key are stored locally in your browser's `localStorage`.
- **Speech-to-Text**: Powered by Deepgram's Nova-3 model for fast and accurate transcription.
- **Configurable Intervals**: Choose between 10, 15, 20, or 30-minute check-ins.
- **Real-time Preview**: See your transcript as you speak.
- **Export Data**: Download your entire history as a JSON file.
- **Clean UI**: Modern, distraction-free design with dark mode support (coming soon).

## Getting Started

1. **Obtain a Deepgram API Key**:
   - Go to [Deepgram Console](https://console.deepgram.com/).
   - Create a free account and generate an API key.

2. **Open the App**:
   - Simply open `index.html` in any modern web browser.
   - You can also host it on GitHub Pages, Vercel, or any static hosting service.

3. **Configure**:
   - Upon first launch, you'll be prompted to enter your Deepgram API Key.
   - Select your preferred check-in interval.

4. **Start Auditing**:
   - The app will run in the background.
   - When the timer reaches zero, a popup will appear.
   - Speak into your microphone to report what you've been doing.
   - Click "Stop & Save" to store the entry.

## Technical Details

- **No Build Step**: Built with vanilla HTML, CSS, and JavaScript.
- **Dependencies**: Uses the Deepgram JavaScript SDK via CDN.
- **Storage**: Uses browser `localStorage` for persistence.
- **Browser APIs**: Utilizes `Web Audio API`, `MediaRecorder API`, and `crypto.randomUUID()`.

## Development & Testing

To run the tests:

```bash
pnpm install
pnpm test
```

## Security & Privacy

- Your API key is stored in `localStorage.timeaudit_apikey`.
- Your transcripts are stored in `localStorage.timeaudit_entries`.
- No data is ever sent to any server except for the audio stream sent directly to Deepgram's API for transcription.

---
Created as a tool for better time awareness and productivity.
