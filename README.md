# Academic Dictionary

A Chrome extension that provides academic definitions for selected text using AI language models.

## Description

Academic Dictionary allows you to quickly look up definitions for academic terms or concepts without leaving your browser. Simply select text on any webpage, right-click, and choose "Define" to get an academic explanation powered by OpenAI or Google Gemini.

## Setup Instructions

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top right
4. Click "Load unpacked" and select the extension folder
5. Obtain an API key from OpenAI or Google Gemini
6. Click the extension icon and enter your API key

## Features

- Get academic definitions for any selected text with right-click context menu
- Switch between different explanation styles (academic and simplified)
- Save definitions for later reference
- Support for both OpenAI and Google Gemini APIs
- Modern, user-friendly interface
- Offline access to previously saved definitions
- Error handling with clear user feedback
- Easy API key management

## Individual Contributions

Liam Kiernan:

Gordon Chen:

Joyce Chen: UI and User Flow
- Modern user interface with clean styling
- Added error handling for invalid API keys and duplicate note saving with user-friendly notifications
- Improved user flow with the ability to change API keys and providers at any time

Immanuel Anaborne: Testing and Notes Functionality
- Conducted rigorous manual testing across all functionalities of the extension
- Implemented a smooth and intuitive way for users to save AI-generated notes into the notes list in the popup

## Known Issues & Future Work

- No synchronization of saved definitions across devices
- Limited to 10 saved definitions
- Potential future features:
  - Automatic text highlighting for common academic terms
  - Language translation support
  - Export definitions to common formats

## License

MIT

---

*Icons provided by Font Awesome*
