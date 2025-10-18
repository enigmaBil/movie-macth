Admin setup and menu
=====================

1) Creating an admin user

- Ensure you have a Firebase service account JSON and set the environment variable:

  Windows PowerShell:

  $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\serviceAccount.json"

- Run the script (Node must be installed):

  node tools/set-admin.js user@example.com

  The script finds the auth user by email and sets their Firestore document `role` to `admin` and `isActive` to true.

2) Menu behavior

- A side menu is available app-wide. Open it from the menu button in the tabs header.
- If you're an admin (your Firestore doc role === 'admin' and isActive === true) you'll see an "Administration" link.
- If you're NOT an admin, you'll see a "Matching" link instead.

3) Admin features (in-app)

- The Administration page allows adding custom movies to the `movies` collection and toggling `isActive` on user documents.

4) Backfilling `createdAt` and creating missing indexes

- If you see a Firestore error in the browser console like "The query requires an index" it usually includes a URL to create that composite index in the Firebase console. Open that link and create the index.

- Some older `movies` documents may not have a `createdAt` field. Because the app queries `orderBy('createdAt', 'desc')`, missing `createdAt` can cause query/index failures. To backfill missing timestamps, use the provided script:

  npm install firebase-admin
  # Set this environment variable to point to your service account JSON (PowerShell example)
  $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\serviceAccount.json"
  node tools/backfill-createdAt.js

- The script sets `createdAt` to a server timestamp for documents that don't have it. It requires a service account with Firestore write permissions.

After backfilling and creating the index, reload the app; the custom movies stream should work and the "outside injection context" warnings should be removed once you update the app (see notes below).
