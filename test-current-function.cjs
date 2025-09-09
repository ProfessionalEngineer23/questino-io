// Test your current analyzeEmotion function
const { Client, Functions } = require('node-appwrite');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function testFunction() {
  try {
    console.log('🧪 Testing your current analyzeEmotion function...\n');
    
    const apiKey = await askQuestion('Enter your Appwrite API Key: ');
    
    if (!apiKey || apiKey.trim() === '') {
      console.log('❌ API Key is required. Exiting...');
      rl.close();
      return;
    }

    // Initialize Appwrite client
    const client = new Client();
    client
      .setEndpoint('https://cloud.appwrite.io/v1')
      .setProject('68b1072d00299f0f88b9') // Correct project ID from your console
      .setKey(apiKey.trim());

    const functions = new Functions(client);

    console.log('\n🚀 Executing function with test data...');
    
    // Test payload
    const testPayload = {
      responseId: 'test-' + Date.now(),
      text: 'I am so excited and happy about this amazing opportunity! This makes me feel joyful and optimistic about the future.'
    };

    console.log('📝 Test text:', testPayload.text);
    console.log('🆔 Test response ID:', testPayload.responseId);

    // Execute the function
    const execution = await functions.createExecution(
      '68b2b9fe0008a37d0428', // Your function ID
      JSON.stringify(testPayload)
    );

    console.log(`✅ Function execution started: ${execution.$id}`);

    // Wait for completion (polling)
    let result = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      try {
        result = await functions.getExecution(
          '68b2b9fe0008a37d0428',
          execution.$id
        );
        
        if (result.status === 'completed') {
          break;
        }
        
        console.log(`⏳ Status: ${result.status} (attempt ${attempts + 1}/${maxAttempts})`);
        attempts++;
      } catch (error) {
        console.log(`⏳ Waiting for completion... (attempt ${attempts + 1}/${maxAttempts})`);
        attempts++;
      }
    }

    if (result && result.status === 'completed') {
      console.log('✅ Function completed successfully!');
      console.log('📊 Response:', result.response);
      
      if (result.response && result.response.includes('success')) {
        console.log('🎉 Your function is working! Watson NLU analysis should now appear in your stats page.');
      } else {
        console.log('⚠️ Function executed but may need environment variables or code updates.');
      }
      
    } else {
      console.log('❌ Function did not complete in time');
      console.log('📊 Final status:', result?.status);
      console.log('📊 Response:', result?.response);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    rl.close();
  }
}

testFunction();
