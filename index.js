const IncomingWebhook = require('@slack/client').IncomingWebhook;
const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/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"
const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);

module.exports.subscribe = async (event) => {
  try {
    // Log the entire event to debug structure
    // console.log('Received event:', JSON.stringify(event.body, null, 2));

    if (!event || !event.body.message.data) {
      throw new Error('No Pub/Sub message found in event');
    }

    const messageData = Buffer.from(event.body.message.data, 'base64').toString();
    console.log('Decoded string:', messageData);

    const build = JSON.parse(messageData);
    console.log('Decoded build data:', build);

    // Check for 'no-notify' tag - skip notification if present
    if (build.tags && Array.isArray(build.tags) && build.tags.some(tag => tag.includes('no-notify'))) {
      console.log('Skipping notification due to no-notify tag');
      return;
    }

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

//Version Working in cloud function

// const createSlackMessage = (build) => {
//   const triggerName = build.substitutions.TRIGGER_NAME;
//   const publishedAt = new Date(build.createTime).toUTCString();

//   let message = {
//     text: `Triggered by: \`${triggerName}\`\n\nPublished at: ${publishedAt}\n\nBuild_ID \`${build.id}\``,
//     mrkdwn: true,
//     attachments: [
//       {
//         title: 'Build logs',
//         title_link: build.logUrl,
//         fields: [{
//           title: 'Status',
//           value: build.status
//         }]
//       }
//     ]
//   };
//   return message;
// }