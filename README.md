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

## Deploy to GitHub Pages

This repository is configured to deploy automatically to GitHub Pages whenever changes are pushed to the `main` branch:

1. Ensure the `GEMINI_API_KEY` secret is set in the repository if your build requires it.
2. Push to `main`. The **Deploy to GitHub Pages** workflow in `.github/workflows/deploy.yml` installs dependencies, builds the Vite project, and publishes the `dist/` output to GitHub Pages.
3. Once the workflow succeeds, your site will be available at `https://<your-username>.github.io/imagedim/`.
