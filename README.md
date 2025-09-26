<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your app

This contains everything you need to run your app locally and deploy it to GitHub Pages.

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key.
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Deploy to GitHub Pages

The Vite configuration already sets `base: '/imagedim/'` so the app serves correctly from `https://<username>.github.io/imagedim/`.

## Build for production

Verify the production build before deploying:

```bash
npm run build
```

## Continuous deployment via GitHub Actions

1. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the deployment source.
2. Push to the `main` branch. The [`Deploy Vite app to GitHub Pages`](.github/workflows/pages.yml) workflow will:
   - install dependencies using `npm ci`
   - build the site with `npm run build`
   - upload the `dist/` output and publish it to GitHub Pages
3. Track the workflow run under the **Actions** tab. When it succeeds, the site is live at the URL shown in the Pages settings page.

### Optional: Redeploy the Google AI Studio app

If you still host the project through Google AI Studio, the [`ai-studio-redeploy.yml`](.github/workflows/ai-studio-redeploy.yml) workflow can be enabled. It requires two repository secrets:

| Secret | Description |
| ------ | ----------- |
| `GCP_SERVICE_ACCOUNT_KEY` | JSON service-account key with permission to deploy the AI Studio app. |
| `AI_STUDIO_APP_ID` | The app identifier from the AI Studio URL (for example, the value after `/apps/drive/`). |

The workflow authenticates with Google Cloud using the service account, builds the Vite project, and calls the AI Studio deployment API so the hosted app always reflects the latest commit.

## Troubleshooting GitHub Desktop commit errors

If GitHub Desktop shows a generic “Something went wrong” message while committing:

1. Re-authenticate with GitHub Desktop (**File → Options → Accounts**) to refresh credentials.
2. Check [GitHub’s status page](https://www.githubstatus.com/) for any incidents.
3. Try committing from a terminal for a clearer error message:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```
   Address any errors printed by Git.
4. Restart GitHub Desktop (or your computer) if the error persists.
