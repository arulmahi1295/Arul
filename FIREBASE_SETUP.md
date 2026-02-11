# Firebase Setup Guide for GreenHealth LIMS

The application uses Firebase Firestore for data storage. If you are experiencing "Permission Denied" or "Missing or insufficient permissions" errors, it is likely due to Firestore Security Rules blocking unauthenticated access.

## Quick Fix: Update Security Rules

Since the application currently uses a custom username/password system that does not integrate with Firebase Authentication, all requests from the app are technically "unauthenticated" (anonymous). You must allow public read/write access to your Firestore database.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (**greenhealth-lis**).
3.  Navigate to **Firestore Database** > **Rules**.
4.  Replace the existing rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5.  Click **Publish**.

> **Note:** This allows anyone with your project configuration to read/write to your database. This is acceptable for development or internal networks but should be secured properly for public production deployments using Firebase Authentication.

## Long-Term Solution: Firebase Authentication

To properly secure the application:
1.  Enable **Email/Password** sign-in method in Firebase Console > Authentication > Sign-in method.
2.  Update the application to use `signInWithEmailAndPassword` from Firebase SDK instead of the custom logic in `Login.jsx`.
3.  Update Firestore Rules to: `allow read, write: if request.auth != null;`
