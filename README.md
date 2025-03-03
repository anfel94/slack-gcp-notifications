npm install @slack/client
node test-local.js


Slack notifications from Cloudbuild

Summary

This documentation is currently a manual process. Later, we will integrate CI/CD for the code inside the repository 'loadsure-ops'.


How It Works

 1. Cloud Build Execution: Every time a Cloud Build runs, it publishes a message with the build status to Cloud Pub/Sub.
 2. Cloud Pub/Sub Trigger: The Pub/Sub topic
    cloud-builds
    receives the build event and triggers the Cloud Function
    subscribe
    .
 3. Processing in Cloud Function:
     * The Cloud Function extracts the build status from the Pub/Sub message.
     * It creates a formatted notification message.
     * The message is sent to Slack using a determined bot via the Webhook URL.

 4. Slack Notification: The bot posts the build status to the specified Slack channel.


Stepts to Follow

 * 1. GCP Project
    1. Enable Cloud Functions & Cloud Pub/Sub APIs

 * 2. Prepare Your Slack App
    1. Create a Slack App via the Slack API.



 1. Enable Incoming Webhooks.
 2. Add a new Webhook, select a channel, and copy the Webhook URL.



 * 3. Create the Cloud Function
    * 3.1 Create a Storage Bucket for Staging

gsutil mb gs://[STAGING_BUCKET_NAME]

 * 3.2 Set Up Your Project Directory

mkdir ~/gcb_slack && cd ~/gcb_slack

 * 3.3 Add Required Files
    * package.json:

{  
"name": "google-container-slack",  
"version": "0.0.1",  
"description": "Slack integration for Google Cloud Build, using Google Cloud Functions",  "main": "index.js",  
"dependencies": {    
    "@slack/client": "4.10.0"  
  }
}

 * index.js: (Replace
   <INSERT YOUR WEBHOOK>
   with your Slack Webhook URL)

const IncomingWebhook = require('@slack/client').IncomingWebhook;
const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/dfkjndf6+5+65";
const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);

module.exports.subscribe = async (event) => {
  try {
    // Log the entire event to debug structure
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Ensure event contains a Pub/Sub message
    if (!event || !event.data) {
      throw new Error('No Pub/Sub message found in event');
    }

    // Decode base64 message
    const messageData = Buffer.from(event.data, 'base64').toString();
    console.log('Decoded string:', messageData);

    const build = JSON.parse(messageData);
    console.log('Decoded build data:', build);

    const status = ['SUCCESS', 'FAILURE', 'INTERNAL_ERROR', 'TIMEOUT'];
    if (!status.includes(build.status)) {
      console.log(`Skipping notification for status: ${build.status}`);
      return;
    }

    const message = createSlackMessage(build);
    return webhook.send(message);
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
};

const createSlackMessage = (build) => {
  const triggerName = build.substitutions.TRIGGER_NAME;
  const publishedAt = new Date(build.createTime).toUTCString();

  let message = {
    text: `Triggered by: \`${triggerName}\`\n\nPublished at: ${publishedAt}\n\nBuild_ID \`${build.id}\``,
    mrkdwn: true,
    attachments: [
      {
        title: 'Build logs',
        title_link: build.logUrl,
        fields: [{
          title: 'Status',
          value: build.status
        }]
      }
    ]
  };
  return message;
}

 * 4. Deploy the Cloud Function

gcloud functions deploy subscribe --stage-bucket [STAGING_BUCKET_NAME] \    --trigger-topic cloud-builds

 * 5. Verify Slack Notifications
    * Trigger a build in Cloud Build.
    * Check Slack for notifications.
      
      

