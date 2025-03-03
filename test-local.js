// test-real.js
const { subscribe } = require('./index.js');

// Create a test message that matches the real Pub/Sub format
const createTestMessage = (buildData) => {
  // First create the inner build data
  const innerData = JSON.stringify(buildData);
  
  // Then create the outer message structure
  const pubsubMessage = {
    attributes: {
      buildId: buildData.id,
      status: buildData.status
    },
    data: Buffer.from(innerData).toString('base64'),
    message_id: "test-message-id",
    publish_time: new Date().toISOString()
  };

  // Finally create the event object
  return {
    data: pubsubMessage
  };
};

// Test function
async function runTest() {
  console.log('🚀 Starting Cloud Function test with real message format...\n');

  // Create test build data matching real structure
  const testBuild = {
    id: "test-build-123",
    status: "WORKING",
    source: {
      gitSource: {
        url: "https://github.com/test/repo.git",
        revision: "test-revision"
      }
    },
    createTime: new Date().toISOString(),
    startTime: new Date().toISOString(),
    logUrl: "https://console.cloud.google.com/cloud-build/builds/test-build-123",
    projectId: "test-project",
    tags: ["test-tag"]
  };

  // Create test event
  const testEvent = createTestMessage(testBuild);
  
  console.log('📋 Test build data:', JSON.stringify(testBuild, null, 2));
  console.log('\n📨 Created Pub/Sub event:', JSON.stringify(testEvent, null, 2));

  try {
    console.log('\n⏳ Calling Cloud Function...');
    await subscribe(testEvent);
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.stack);
  }
}

// Run test
runTest()
  .then(() => console.log('\n✨ Test complete!'))
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });