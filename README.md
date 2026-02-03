# Revsit Safety Audit Tool

A cross-platform application for filing and managing Safety First Information Reports (FIRs).

## Project Structure
- `/web`: React + Vite web application for dashbaord management.
- `/supabase`: SQL schema, triggers, and cleanup scripts.
- `/docs`: Documentation for setup and authentication.

## Getting Started (Web)
1. Navigate to `web/` folder.
2. Install dependencies: `npm install`
3. Configure `.env` with your Supabase credentials.
4. Run development server: `npm run dev`

## Authentication Setup
See [docs/auth_setup.md](docs/auth_setup.md) for detailed instructions on creating and syncing test users.

## Next Phase
- Mobile Application (React Native / Expo)
