# HepatoHero: Liver Guardian

An educational and interactive game about liver health, detoxification, and the science of fighting liver cancer.

## Features
- **Multiplayer Mode:** 1v1 and 2v2 private lobbies.
- **Global Leaderboard:** Compete with others for the high score.
- **Shop & Upgrades:** Use credits to buy power-ups and sabotages.
- **Educational Content:** Learn about liver science as you play.

## Deployment to Vercel

To host this app on Vercel, follow these steps:

1. **Export to GitHub:** Use the AI Studio settings menu to push this code to a new GitHub repository.
2. **Connect to Vercel:** Log in to [Vercel](https://vercel.com) and import your new repository.
3. **Configure Environment Variables:** In the Vercel project settings, add the following environment variables. You can find these values in your Firebase Console (Project Settings > General > Your Apps).

| Variable | Description |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Your Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase App ID |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | Your Firestore Database ID (usually `(default)`) |

4. **Deploy:** Click deploy and your app will be live!

## Security Note
The `firebase-applet-config.json` file is ignored by Git to keep your keys safe. When running locally, ensure you have this file or set up a `.env` file with the variables listed above.
