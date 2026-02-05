# ⏰ Time Audit

A privacy-focused, client-side web application that helps you track your daily activities by prompting you at configurable intervals to record what you've been doing. All data stays in your browser - no server required.

## Features

- **Privacy-First**: All data stored locally in your browser's localStorage
- **Speech-to-Text**: Real-time transcription using Deepgram's API
- **Configurable Intervals**: Choose 10, 15, 20, or 30-minute check-in intervals
- **Manual Editing**: Edit transcripts directly in the browser
- **Export Options**: Download your activity log as JSON or text file
- **No Server Required**: Pure client-side application

## Setup

### 1. Get a Deepgram API Key

1. Sign up for a free account at [Deepgram](https://console.deepgram.com/signup)
2. Navigate to the [API Keys section](https://console.deepgram.com/project/default/settings/api-keys)
3. Create a new API key and copy it

### 2. Run the Application

You have several options to run the app:

#### Option A: Direct File Access
Simply open `index.html` in your web browser. Note that microphone access may be restricted depending on your browser's security settings.

#### Option B: Local Web Server (Recommended)

Using Python:
```bash
# Python 3
python -m http.server 8000

# Then open http://localhost:8000
```

Using Node.js:
```bash
npx serve
# or
npx http-server
```

Using PHP:
```bash
php -S localhost:8000
```

### 3. Configure Your API Key

On first launch, you'll be prompted to enter your Deepgram API key. This key is stored securely in your browser's localStorage and never sent anywhere except directly to Deepgram's API.

## Usage

### Basic Workflow

1. **Set Your Interval**: Choose how often you want to be prompted (10, 15, 20, or 30 minutes)
2. **Wait for Prompts**: The app will automatically open a recording modal at your chosen interval
3. **Record Your Activity**: Click "Start Recording" and speak about what you've been doing
4. **Review & Save**: Edit the transcript if needed, then click "Save Entry"
5. **Export Data**: Use the export buttons to download your activity log

### Recording Tips

- Speak clearly and at a normal pace
- You can manually edit the transcript before saving
- The transcript is editable even after recording stops
- Click "Cancel" to skip an entry without saving

### Managing Entries

- **View All Entries**: Scroll through your activity log in the main area
- **Delete Entry**: Click the trash icon on any entry
- **Clear All**: Use the "Clear All" button to delete all entries (with confirmation)
- **Export JSON**: Download entries as structured JSON data
- **Export Text**: Download a formatted text report

## Data Storage

All data is stored in your browser's localStorage:

- **API Key**: `timeaudit_apikey`
- **Interval Setting**: `timeaudit_interval`
- **Activity Entries**: `timeaudit_entries`

### Data Format

```json
{
  "id": "unique-id",
  "startTime": "2026-02-05T10:00:00Z",
  "endTime": "2026-02-05T10:15:00Z",
  "transcript": "Worked on the API integration for the new feature...",
  "recordedAt": "2026-02-05T10:15:30Z"
}
```

## Privacy & Security

- **No Backend**: Everything runs in your browser
- **Local Storage Only**: Your data never leaves your device (except audio sent to Deepgram for transcription)
- **API Key Security**: Your Deepgram API key is stored locally and only sent to Deepgram's servers
- **No Analytics**: No tracking, cookies, or third-party analytics

## Browser Compatibility

- **Chrome/Edge**: Fully supported
- **Firefox**: Fully supported
- **Safari**: Fully supported (macOS 11+)
- **Mobile**: Supported but requires HTTPS or localhost

### Microphone Permissions

The app requires microphone access to record audio. Modern browsers will prompt you to grant permission when you first try to record.

## Troubleshooting

### Microphone Not Working

1. Check browser permissions for microphone access
2. Ensure you're accessing the app via HTTPS or localhost
3. Try a different browser

### Transcription Issues

1. Verify your API key is correct
2. Check your Deepgram account has available credits
3. Ensure you have a stable internet connection
4. Speak clearly and reduce background noise

### Timer Not Working

1. Keep the browser tab open (timer pauses when tab is inactive in some browsers)
2. Check if your browser allows notifications
3. Refresh the page and try again

## Development

### File Structure

```
time-audit/
├── index.html      # Main HTML structure
├── style.css       # Styling and UI design
├── app.js          # Core application logic
├── test.html       # Test suite
└── README.md       # This file
```

### Technologies Used

- **Vanilla JavaScript**: No frameworks, just pure JS
- **Deepgram SDK**: Loaded via CDN for speech-to-text
- **localStorage API**: For persistent data storage
- **MediaRecorder API**: For capturing microphone audio
- **WebSocket**: For real-time transcription (via Deepgram SDK)

## License

See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! This is a simple client-side app, so:

1. Fork the repository
2. Make your changes
3. Test thoroughly in multiple browsers
4. Submit a pull request

## Support

For issues with:
- **The App**: Open an issue in this repository
- **Deepgram API**: Check [Deepgram's documentation](https://developers.deepgram.com/)

## Roadmap

Potential future enhancements:
- [ ] PWA support for offline functionality
- [ ] Calendar view of activities
- [ ] Search and filter entries
- [ ] Tags and categories
- [ ] Statistics and insights
- [ ] Custom notification sounds
- [ ] Multiple export formats (CSV, Markdown)

---

**Note**: This app requires a Deepgram API key. Free tier includes 12,000 minutes of transcription per year, which is more than enough for personal use.
