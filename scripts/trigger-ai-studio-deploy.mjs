import { execSync } from 'node:child_process';

const { AI_STUDIO_APP_ID, GITHUB_SHA } = process.env;

if (!AI_STUDIO_APP_ID) {
  console.error('Missing required environment variable AI_STUDIO_APP_ID.');
  process.exit(1);
}

function getAccessToken() {
  try {
    return execSync('gcloud auth print-access-token', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    }).trim();
  } catch (error) {
    console.error('Failed to obtain access token from gcloud. Ensure the workflow is authenticated.');
    throw error;
  }
}

async function triggerRedeploy() {
  const token = getAccessToken();
  const url = `https://aistudio.googleapis.com/v1alpha/apps/${AI_STUDIO_APP_ID}:deploy`;
  const payload = {
    gitCommitSha: GITHUB_SHA,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI Studio deploy request failed with status', response.status, errorText);
    process.exit(1);
  }

  const data = await response.json().catch(() => ({}));
  console.log('Deployment triggered successfully in AI Studio.');
  if (Object.keys(data).length > 0) {
    console.log('Response:', JSON.stringify(data, null, 2));
  }
}

triggerRedeploy().catch((error) => {
  console.error('Failed to trigger AI Studio redeploy:', error);
  process.exit(1);
});
