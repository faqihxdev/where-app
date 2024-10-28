# WhereApp - Lost and Found Application

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10.13-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Chakra UI](https://img.shields.io/badge/Chakra_UI-2.8-319795?style=for-the-badge&logo=chakra-ui&logoColor=white)](https://chakra-ui.com/)
[![Jotai](https://img.shields.io/badge/Jotai-2.10-black?style=for-the-badge)](https://jotai.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Playwright](https://img.shields.io/badge/Playwright-1.48-45ba4b?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)

## What is WhereApp?

WhereApp is a Progressive Web Application (PWA) designed to streamline the lost and found process. It serves as a comprehensive platform for managing and tracking lost or found items, enabling users to efficiently report missing items, post found items, and facilitate the reunion of lost belongings with their rightful owners. The application combines both list and map views to create an intuitive and effective lost and found management system.

## Why WhereApp?

Losing personal items can be a stressful experience. WhereApp aims to simplify the process of reporting and finding lost items by providing a user-friendly platform that connects people who have lost items with those who have found them. By leveraging modern web technologies and a robust tech stack, WhereApp offers a seamless and efficient solution to a common problem.

## How it Works

WhereApp allows users to:
- Report lost items
- Post found items
- Search for lost items
- View items on a map

## Tech Stack

WhereApp is built using the following technologies:

- **Frontend:**
  - React
  - TypeScript
  - Jotai (for state management)
  - Tailwind CSS (for styling)
  - Chakra UI (for specific components)
  - Heroicons (for icons)

- **Backend:**
  - Firebase (Firestore for database)

- **Build & Development:**
  - Vite (for fast development and building)

- **Deployment:**
  - Firebase Hosting

- **Progressive Web App:**
  - Service Workers
  - Manifest file

## Project Structure

```
  /src
  ├── /components               # Reusable components
  │   └── ListingForm.tsx
  │   └── ...
  ├── /stores                   # Jotai atoms and state management
  │   ├── imageStore.ts
  │   ├── listingStore.ts
  │   └── userStore.ts
  │   └── ...
  ├── /utils                    # Utility functions
  │   └── ...
  ├── /pages                    # Application pages
  │   ├── EditListingPage.tsx
  │   ├── PostPage.tsx
  │   ├── ViewListingPage.tsx
  │   └── ...
  ├── /styles                   # Global styles and Tailwind config
  │   └── ...
  ├── /types                    # TypeScript type definitions
  │   └── types.ts
  │   └── ...
  ├── App.tsx                   # Main application component
  └── main.tsx                  # Entry point
```

## Development Guide

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Git

### Setting Up the Development Environment

1. Clone the repository:
   ```
   git clone https://github.com/aqilakmal/Where-App.git
   cd whereapp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project at https://console.firebase.google.com/
   - Add a web app to your Firebase project
   - Copy the Firebase configuration
   - Create a `.env` file in the root directory and add your Firebase config:
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite)

### Development Workflow

1. Create a new branch for your feature or bug fix:
   ```
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, following the project's coding standards and structure.

3. Test your changes locally:
   - Run the development server: `npm run dev`
   - Check for any console errors or warnings
   - Ensure the feature works as expected
   - If you see uncontrollable 🔥in your devtools console, `Ctr+C` on your terminal to terminate the app
   - If you stopped it in time, you have saved the team from going bankrupt

4. Lint and format your code:
   ```
   npm run lint
   npm run format
   ```

5. Commit your changes with a descriptive commit message:
   ```
   git commit -m "Add feature: description of your changes"
   ```

6. Push your changes to your branch:
   ```
   git push origin feature/your-feature-name
   ```

7. Create a pull request on GitHub for review.

### Important Development Notes

- Use TypeScript for all new files and components.
- Utilize Jotai for state management. Add new atoms and selectors in the appropriate files under the `/stores` directory.
- Style components using Tailwind CSS classes. Use Chakra UI components for "bigger components".
- Keep components small and focused. Extract reusable logic into custom hooks or utility functions.
- Update `types.ts` when adding or modifying data structures.
- Follow the existing patterns in `ListingForm.tsx`, `EditListingPage.tsx`, and `PostPage.tsx` when creating new forms or pages.
- Use the `imageStore.ts` for handling image-related operations.
- Refer to `listingStore.ts` and `userStore.ts` for examples of how to structure Firestore interactions.
