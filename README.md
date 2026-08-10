# VoiceOS Hackathon - Dear Future Me

Dear Future Me is a reflection notebook. You tell it a thought, a proud moment, or a letter to your future self. It keeps your words and gives them back to you later.

Before this hackathon, Dear Future Me was a website. You typed into forms. At the VoiceOS hackathon we gave it a voice. Now you tap a widget on your iPhone lock screen, the app opens already listening, and you just talk. An agent decides what to keep, saves it to your notebook, and answers you in a natural voice. Months later, your letter comes back to you as a text message.

This repository is the whole build.

## What it does

1. Tap the widget on the lock screen or home screen.
2. The app opens and listens. A green orb shows the state of the conversation.
3. Say what is on your mind. The agent asks one short question if something is unclear.
4. The agent saves your words to your notebook, in your words, and confirms out loud.
5. If you wrote a letter to your future self, it arrives later by SMS.

The same notebook is readable everywhere: in the app, on the website, and through the API.

## What is in this repository

| Folder | Contents |
| --- | --- |
| `ios/` | The iPhone app. SwiftUI, with a WebGL voice orb, lock and home screen widgets, Siri shortcuts, a notebook browser, and voice chat history. |
| `api/` | The backend. FastAPI with a public `/v1` API, personal API keys, an agent gateway, text-to-speech and speech-to-text proxies, and SMS delivery. |
| `src/` | The website. React and Vite, with an animated walkthrough of DFM Voice, a developer page for API keys, and a waitlist. |
| `supabase/` | Database migrations. Supabase holds all notebook data behind row-level security. |
| `integrations/` | Setup guides and scripts for ChatGPT (custom GPT) and Gemini (function declarations). |
| `VOICE_OS_PLAN.md` | The plan we wrote at the start and mostly followed. |

## How the pieces connect

The phone stays thin. It records speech and plays audio. Everything else happens on a gateway server:

- The agent turn runs through VoiceOS, which generates the conversational replies.
- The gateway validates every request with the caller's API key and writes to Supabase.
- ElevenLabs turns replies into speech. The phone never holds a provider key.
- A1Mobile sends the SMS messages, but only to numbers that confirmed an OTP code first.

Dear Future Me is API-first. The same `/v1` API serves the app, the website, a ChatGPT custom GPT, and Gemini function calls. One account, one notebook, many doors.

## Safety choices

The agent cannot delete or share anything. Those tools do not exist in its toolset. Crisis resources come from a static endpoint and never pass through a model. Saved entries keep the user's own words, not a paraphrase.

## Team

The hackathon build is the work of Arnav K and Nikhilesh S. Dear Future Me is a NeuroHealth Alliance project, co-founded by Nikhilesh S, Suhani Gupta, and Tanvi Bharadwaj.

The voice orb started from [aguscruiz/voiceorb](https://github.com/aguscruiz/voiceorb) (MIT). Thanks to the VoiceOS team for the platform and the weekend.
