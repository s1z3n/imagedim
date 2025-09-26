<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1raorT9ncyeb9b9omWOGyc8nE0Sd5snMU

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Continuous deployment via GitHub Actions

Pushing to `main` automatically builds the app and triggers a redeploy in Google AI Studio.

### Required GitHub secrets

| Secret | Description |
| ------ | ----------- |
| `GCP_SERVICE_ACCOUNT_KEY` | JSON service-account key with permission to deploy the AI Studio app. |
| `AI_STUDIO_APP_ID` | The app identifier from the AI Studio URL (for example, the value after `/apps/drive/`). |

The workflow authenticates with Google Cloud using the service account, builds the Vite project, and calls the AI Studio deployment API so the hosted app always reflects the latest commit.
