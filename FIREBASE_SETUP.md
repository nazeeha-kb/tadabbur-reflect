Firebase Firestore integration setup for Tadabbur

1) What I added
- `lib/firebase/firebaseClient.js` — client SDK initializer (uses NEXT_PUBLIC_* env vars)
- `lib/firebase/firebaseAdmin.js` — server/admin initializer (uses service account env vars)
- `lib/db/reflections.js` — server-safe Firestore functions (create/get/update/delete), and `updateStreakOnReflection`
- `app/api/reflections/route.js` — API route (GET/POST) deriving `userId` from `getSessionUser()`
- package.json dependencies: `firebase`, `firebase-admin`

2) Environment variables required
- `NEXT_PUBLIC_FIREBASE_API_KEY` (client)
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (client)
- `NEXT_PUBLIC_FIREBASE_APP_ID` (client)
- `FIREBASE_PROJECT_ID` (server)
- `FIREBASE_CLIENT_EMAIL` (server, service account)
- `FIREBASE_PRIVATE_KEY` (server, service account; replace newlines with `\n` in .env)

3) Console steps for you
- Create a Firebase project in the Firebase Console.
- Enable Firestore in native mode (free tier is available).
- (Optional) Enable Firebase Auth providers you want to support.
- Create a service account for server access: Project Settings → Service Accounts → Generate new private key. Use the `client_email` and `private_key` values as `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`.

4) .env example additions
```
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxx:web:yyy

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

5) Notes / potential issues to watch for
- Ensure server uses `FIREBASE_PRIVATE_KEY` with literal `\n` escaped correctly in env files.
- Firestore security rules: default rules are open in dev; add rules before production.
- Auth mapping: this implementation uses the app's `getSessionUser()` JWT session; ensure `user.id` remains stable across sign-ins.
- Use Admin SDK only on server routes; do not expose private credentials to client.
- If you prefer not to use Admin service account, you can use callable functions or REST with IAM tokens, but admin SDK is simplest for server-side.

6) Next steps for me (ask if you want any of these done)
- Add Firestore security rules tuned for `reflections` and `streaks`.
- Wire client-side reflection UI to call `/api/reflections` endpoints.
- Add server-side tests for the DB layer and API route.

9) Client token usage

- The client should obtain a Firebase ID token after Google sign-in and attach it to API requests as `Authorization: Bearer <idToken>`.
- This repo includes a helper at `lib/firebase/firebaseClientAuth.js` with `getFirebaseIdToken()` and `signInWithGoogle()` to obtain tokens and sign in.
- The reflection save/update/delete flows will attempt to attach this token automatically if present in the client runtime.

7) Firebase deploy (recommended) — quick guide

- Install Firebase CLI:

```bash
npm install -g firebase-tools
```

- Login and select project:

```bash
firebase login
firebase use --add
```

- To test rules locally using emulator:

```bash
firebase emulators:start --only firestore
```

- To deploy only rules/config (no hosting configured):

```bash
firebase deploy --only firestore:rules
```

Notes:
- Replace `your-firebase-project-id` in `.firebaserc` with your real project id or run `firebase use`.
- This repo includes `firebase.json` and `firestore.rules` to deploy rules safely.

8) Final checklist for you

- Create Firebase project and enable Firestore (native mode).
- Create service account JSON and set `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` in your environment.
- Add `NEXT_PUBLIC_FIREBASE_*` env values to `.env.local` for local dev.
- Run `firebase emulators:start --only firestore` to test rules locally before deploying.
- Deploy rules with `firebase deploy --only firestore:rules` when ready.

