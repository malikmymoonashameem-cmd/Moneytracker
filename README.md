# FinTrack - Personal Financial Management

FinTrack is a mobile-first web application designed for seamless expense tracking and financial management.

## Features

- **Mobile-First Design**: Intuitive UI optimized for on-the-go tracking.
- **Expense Tracking**: Easily record spending with categories, dates, and notes.
- **Visual Analytics**: Dashboard with pie charts and trend bars to visualize spending habits.
- **Cloud Sync**: Secure backend storage using SQLite for data persistence.
- **Authentication**: Simple email-based sign-in/registration.
- **Search & Filter**: Quickly find past transactions.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4.
- **Animations**: Motion (formerly Framer Motion).
- **Icons**: Lucide React.
- **Charts**: Recharts.
- **Backend**: Express.js.
- **Database**: Better-SQLite3.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`.

## Project Structure

- `/src/App.tsx`: Main application logic and UI components.
- `/src/types.ts`: TypeScript interfaces and shared constants.
- `/server.ts`: Express server with API routes and SQLite integration.
- `/fintrack.db`: SQLite database file (generated on first run).

## Future Roadmap

- [ ] Real receipt OCR using Gemini AI.
- [ ] Budgeting goals and progress tracking.
- [ ] Multi-currency support.
- [ ] Investment portfolio tracking.
- [ ] Export to PDF/Excel reports.
