Deploy to Firebase Hosting

This repository includes a GitHub Actions workflow that builds the monorepo and deploys the `apps/infra-admin` app to Firebase Hosting.

What I added

- `.github/workflows/firebase-deploy.yml` — builds and deploys on push to `main`.

What you must do

1. Create a Firebase CI token on your machine:

```bash
npm install -g firebase-tools
firebase login:ci
```

Copy the token printed by the command.

2. In your GitHub repo (`https://github.com/ginoperales/InfraSuite.git`) create a secret named `FIREBASE_TOKEN` with that token.

3. Ensure the `firebase.json` at the repository root points to the correct `public` folder (it already points to `apps/infra-admin/dist`).

4. Push changes to the `main` branch. The workflow will run, build the monorepo and deploy the `apps/infra-admin` build to Firebase Hosting.

Manual deploy (optional)

If you prefer to deploy from your machine without Actions:

```bash
# from repo root
npm ci
npm run build
# install firebase-tools if needed
npm install -g firebase-tools
# login (interactive)
firebase login
# deploy (select project if needed)
firebase deploy --only hosting
```

Notes

- The GitHub Action uses the `FIREBASE_TOKEN` secret to authenticate. Do not share this token.
- If your Firebase project id is not the default, either run `firebase use --add` locally to set the default project in `firebase.json`, or modify the workflow to pass `--project <PROJECT_ID>` in the deploy args.
