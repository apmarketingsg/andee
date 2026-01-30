# Andee - AI Meeting Assistant

Andee is a sophisticated, voice-first AI meeting assistant designed to help you manage your calendar with natural language and proactive engagement.

## 🚀 Features

- **Voice-First Interaction**: Manage your schedule using the Gemini Live API for low-latency voice conversations.
- **Proactive Meeting Reminders**: Andee "calls" you when meetings are approaching to provide check-ins and quick adjustments.
- **Function Calling**: Real-time integration between voice commands and local calendar state (Simulation).
- **Premium UI**: High-fidelity dark mode interface designed for mobile-first productivity.

## 🛠️ Tech Stack

- **Framework**: React 19
- **Styling**: Tailwind CSS
- **AI Engine**: Google Gemini 2.5 Flash (Live API)
- **Audio Processing**: Web Audio API (PCM Streaming)

## 🚦 Getting Started

### Prerequisites

- A [Gemini API Key](https://aistudio.google.com/app/apikey).

### Environment Variables

The app expects an `API_KEY` to be available. Create a `.env` file in the root:

```env
API_KEY=your_gemini_api_key_here
```

### Running Locally

This project uses standard ES6 modules. You can serve the root directory using any static file server.

```bash
# Example using 'serve'
npx serve .
```

## 🔒 Permissions

The app requires **Microphone** access to interact with the voice assistant.

---

Built with ❤️ by [Your Name]
