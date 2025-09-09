// Test Watson NLU Integration
// Run with: node test-watson.js

const { Client, Databases, Functions, ID } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const functions = new Functions(client);

async function testWatsonNLU() {
  try {
    console.log('🧪 Testing Watson NLU Integration...');

    // Test data
    const testResponseId = ID.unique();
    const testText = "I am so excited and happy about this amazing opportunity! This makes me feel joyful and optimistic about the future.";

    console.log(`📝 Test text: "${testText}"`);
    console.log(`🆔 Test response ID: ${testResponseId}`);

    // Call the Watson NLU function
    const execution = await functions.createExecution(
      process.env.APPWRITE_FUNCTION_WATSON_NLU_ID || '68b2b9fe0008a37d0428',
      JSON.stringify({
        responseId: testResponseId,
        text: testText
      })
    );

    console.log(`🚀 Function execution started: ${execution.$id}`);

    // Wait for completion (polling)
    let result = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      try {
        result = await functions.getExecution(
          process.env.APPWRITE_FUNCTION_WATSON_NLU_ID || '68b2b9fe0008a37d0428',
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
      
      // Check if analysis was created
      try {
        const analysisDocs = await databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID || '68b10a4800298b059cf0',
          process.env.APPWRITE_ANALYSIS_COLLECTION_ID || 'analysis',
          [`responseId.equal("${testResponseId}")`]
        );
        
        if (analysisDocs.documents.length > 0) {
          console.log('🎉 Analysis document created successfully!');
          console.log('📈 Analysis data:', analysisDocs.documents[0]);
        } else {
          console.log('⚠️ No analysis document found');
        }
      } catch (error) {
        console.log('⚠️ Could not check analysis collection:', error.message);
      }
      
    } else {
      console.log('❌ Function did not complete in time');
      console.log('📊 Final status:', result?.status);
      console.log('📊 Response:', result?.response);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Load environment variables
require('dotenv').config();

testWatsonNLU();
