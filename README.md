# HeartAttack 2026

A study desk for our Fall 2026 courses at Inha University in Tashkent. All your course files sit on one board. HeartAttack shows what to study next, tracks what you've finished, keeps notes and formula sheets, and includes a **free AI study tutor**.

![HeartAttack 2026 in the day theme](docs/screenshot-light.png)
![HeartAttack 2026 in the night theme](docs/screenshot-dark.png)

## What it does

- **Course board.** Pick a course to see its files as parts on a breadboard. Mark a file done and its LED lights up. The amber pad shows what to study next.
- **Study tutor (AI).** Turns a lecture, lab or textbook into a study guide with a concept diagram, the key formulas (LaTeX), a four-phase learning path and a self-test. You can ask follow-up questions. Guides are saved in your browser, so reopening one costs nothing.
- **Notes.** A notebook for each course that supports Markdown, math (`$E = mc^2$`) and code blocks.
- **Formulas & links.** A formula sheet for each course that you can add to (the tutor can fill it for you), plus useful links.
- **Day and night themes.** Works on phones too.

Everything is one file, `index.html`. There's nothing to install and no account to create.

## Getting started

1. Download this repo: **Code → Download ZIP** (or `git clone https://github.com/Ulugbek220907/HeartAttack.git`).
2. Copy your course files into the same folder as `index.html`. The PDFs and slides aren't included here because they belong to our instructors and publishers. Keep the file names exactly as below and the board picks them up automatically:

   | Course | Files |
   |---|---|
   | Circuit and Lab | `CL2026F00 (1).pdf`, `CL2026F01 (1).pdf` |
   | Engineering Mathematics | `D.Zill-A First Course in Differential Equations with Modeling Applications-11th ed (1) (1).pdf` |
   | Linear Algebra | `Linear Algebra and Its Aplications.pdf` |
   | Application Programming in Java | `SOC2030 APJ syllabus2026.pdf`, `Java_1.pdf`, `Java_1_2 Java basic.pdf`, `Java_2_1_2_26.pdf`, `01 Lab_Assignment 2026 (1).pdf`, `02 Lab_Assignment 2026.pdf` |
   | Data Structure | `DataStructuresUsingC (1).pdf`, `Data Structures.pptx`, `03 -Analyzing Space Complexity.pptx`, `04 -Searching Techniques.pptx`, `Presentation1.pptx` |

   Other files can be added with **Add material** (a file name in this folder, or any web link).
3. Double-click **`run_heartattack.bat`** (Windows), or just open `index.html` in Chrome, Edge or Firefox.

## Free AI setup (pick at least one)

Open **Settings** (the sliders icon, top right) and paste your own key. Keys are stored **only in your browser**; they are never written into the file or sent anywhere except to the AI provider you chose.

| Provider | Cost | How to get access |
|---|---|---|
| **Google Gemini** | Free tier | Create a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (about a minute, no card needed). |
| **OpenRouter** | Free models | Create a key at [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys). Keep the model on **Free Models Router**, or pick any model marked free. Free models have a daily request limit. |
| **Ollama app** | Free | Install [Ollama](https://ollama.com/download) and sign in. In Settings, click **Find models**. Models ending in `-cloud` (for example `gpt-oss:20b-cloud`) run on Ollama's servers within its free limits; other models run on your own computer. |
| DeepSeek | Paid (cheap) | Optional backup: [platform.deepseek.com](https://platform.deepseek.com/api_keys). |

If one provider hits its limit, the tutor automatically tries the next one you've set up.

**Ollama tip:** if **Find models** says it can't connect, allow web pages to talk to Ollama. On Windows, run this once in a terminal, then quit and reopen the Ollama app:

```bat
setx OLLAMA_ORIGINS "*"
```

The API keys on Ollama's website can't be used here, because Ollama's cloud service doesn't accept requests from web pages. The Ollama app is the free way in.

## Good to know

- **Your data stays in your browser.** Progress, notes, formulas, saved guides and keys live in the browser's local storage. Nothing is uploaded, and every classmate has their own.
- **Opening the file straight from the folder:** browsers don't let a page read other local files, so the tutor can't open your course PDFs by itself. When a guide says it only saw the course outline, drop the file into **Use your own file** in the tutor to get a guide built from the actual pages.
- **Keyboard:** `/` searches, `Esc` closes dialogs, `E` starts writing in Notes, and `Enter` sends a question to the tutor.
