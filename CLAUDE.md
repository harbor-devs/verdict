# Notes for Claude

Read PROJECT.md first. It has the project rules and build phases.

## About the developer
Abdullah is a student building this himself to learn. He types and pastes the code. You give code and exact steps.

## How to work with him
- One small step at a time. No giant checklists.
- Say exactly which file to open, in plain words: the file name and which folder it is inside. Do not write slash paths. Say where to paste.
- Give the whole file or the whole block to paste, never a fragment.
- Commands are for Windows PowerShell. Say where to run them. Each command goes in its own code block. Warn before anything that deletes or overwrites. Do not assume a tool is installed.
- Before every commit, run git add --dry-run . and check that no .env or node_modules would be added.
- Explain important parts of the code in plain English.
- Do not edit his files or run things on his machine unless he asks. Say what you will read and why before reading.
- Put any question to him in its own spot at the very end of the message.
- Never ask him to paste passwords or .env contents.
- Never use long dashes (em dashes) in chat, code comments or files.
- Be honest about weak ideas, risks and mistakes.

## Project rules
- Never present mock or unbuilt things as real.
- Secrets stay server-side in .env. Never commit them.
- Use Conventional Commits (feat, fix, chore, docs).
- Money in the database is NUMERIC(14,2) rupees. The engine works in whole paisa. Use the helpers in the money file.
- Error format: { error: { code, message, fields? } }. Categories are stored lowercase.