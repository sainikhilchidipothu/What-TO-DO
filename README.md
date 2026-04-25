# What-TO-DO

A personal productivity tracker to keep your daily routine in one place. Goals, tasks, classes, and journaling, all offline-first and free to use.

🔗 **Live app:** [what-to-do-nu.vercel.app](https://what-to-do-nu.vercel.app/)

## Features

- **Goals & habits** with streaks, categories, and daily check-ins
- **Tasks** with priority, due dates, subtasks, and class linking
- **Semester setup** so class indicators stay inside the dates you set
- **Class schedule** that shows today's classes at a glance
- **Pomodoro timer** with focus and break sessions
- **Daily journal** for each day
- **Year & month calendar views** with completion heatmap
- **Vacation mode** to pause tracking during breaks
- **XP & levels**, earn XP for completing tasks
- **Keyboard shortcuts** for power users
- **Responsive design** that works on desktop, tablet, and mobile
- **Offline-first**, everything saves to your browser. No sign-up, no account, no tracking.

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Vitest for testing
- localStorage for persistence

## Run Locally

```bash
git clone https://github.com/YOUR-USERNAME/What-TO-DO.git
cd What-TO-DO
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build for Production

```bash
npm run build
```

## Run Tests

```bash
npm test
```

## Keyboard Shortcuts

- `Ctrl+N` for a new goal
- `Ctrl+T` for a new task
- `Ctrl+J` for a new journal entry
- `← →` to navigate months
- `Esc` to go back or close

## Project Structure

```
src/
├── components/   # UI components
├── hooks/        # Custom React hooks
├── utils/        # Pure helpers (dates, streaks, semester logic)
├── __tests__/    # Unit tests
├── App.jsx       # App orchestrator
├── theme.js      # Shared style tokens
└── constants.js  # App constants
```

## Screenshots

_(coming soon)_

## Feedback

Found a bug or have a suggestion? Open an issue or send a PR.

## License

MIT
