Planner Desktop App

Personal desktop planner application built for organizing my daily tasks, tracking time usage, writing notes, and managing upcoming events.
This project was made primarily for personal use, but also as a way to learn how Claude Code works and how to build a full desktop application.


About the Project

Planner is an offline-first desktop application that combines:

Weekly schedule
Monthly calendar
To-do list
Daily notes
Reading tracker
Statistics (time tracking by category)

The goal of the app is to help me understand how I spend my time during the day, organize tasks, and keep notes and events in one place instead of using multiple different apps.

The application stores everything locally on the computer (SQLite database), and no internet connection or account is required.


Tech Stack

Electron
React
TypeScript
SQLite (WASM)
Tailwind CSS
Zustand
Recharts
electron-builder


Features

Weekly schedule with activity tracking
Calendar with events
To-do list (daily and long-term tasks)
Daily notes (auto-save)
Reading tracker (books and progress)
Statistics (time spent per category)
Dark / Light theme
English / Serbian language
Export / Import data (backup)


Running the Project

npm install
npm run dev


Build Windows Installer

npm run build:win


Purpose

This project is not intended to be a commercial product.
It is a personal productivity tool and a learning project where I explored:

Desktop app development with Electron
Local database design
Application architecture
UI/UX organization for productivity apps
Working with Claude Code


Author

Personal project – built for learning and personal productivity.
