// Deploy Watson NLU Function with API Key prompt
const { Client, Functions, ID } = require('node-appwrite');
const fs = require('fs');
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

async function deploy() {
  try {
    console.log('🎯 Deploying Watson NLU to your existing analyzeEmotion function...\n');
    
    const apiKey = await askQuestion('Enter your Appwrite API Key: ');
    
    if (!apiKey || apiKey.trim() === '') {
      console.log('❌ API Key is required. Exiting...');
      rl.close();
      return;
    }

    // Configuration
    const CONFIG = {
      APPWRITE_ENDPOINT: 'https://cloud.appwrite.io/v1',
      APPWRITE_PROJECT_ID: '68b10a4800298b059cf0',
      APPWRITE_API_KEY: apiKey.trim(),
      APPWRITE_DATABASE_ID: '68b10a4800298b059cf0',
      APPWRITE_ANALYSIS_COLLECTION_ID: 'analysis',
      APPWRITE_FUNCTION_WATSON_NLU_ID: '68b2b9fe0008a37d0428'
    };

    // Initialize Appwrite client
    const client = new Client();
    client
      .setEndpoint(CONFIG.APPWRITE_ENDPOINT)
      .setProject(CONFIG.APPWRITE_PROJECT_ID)
      .setKey(CONFIG.APPWRITE_API_KEY);

    const functions = new Functions(client);

    console.log('\n🚀 Deploying to existing analyzeEmotion function...');
    console.log(`📦 Using function ID: ${CONFIG.APPWRITE_FUNCTION_WATSON_NLU_ID}`);

    // Create deployment
    const zipPath = './functions/watson-nlu-new.zip';
    if (!fs.existsSync(zipPath)) {
      throw new Error(`Zip file not found: ${zipPath}`);
    }
    
    console.log(`📦 Using zip file: ${zipPath}`);
    const deployment = await functions.createDeployment(
      CONFIG.APPWRITE_FUNCTION_WATSON_NLU_ID,
      'main',
      fs.createReadStream(zipPath)
    );
    
    console.log(`✅ Deployment created: ${deployment.$id}`);

    // Update function to use new deployment
    await functions.update(
      CONFIG.APPWRITE_FUNCTION_WATSON_NLU_ID,
      'Watson NLU Analysis',
      ['https://cloud.appwrite.io/v1'],
      'nodejs-18.0',
      true,
      deployment.$id
    );

    console.log('🎉 Function deployed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to your Appwrite Console → Functions → analyzeEmotion');
    console.log('2. Go to Settings → Environment Variables');
    console.log('3. Add these variables:');
    console.log('   - WATSON_API_KEY: z2h0cFAU4uZf3CBon4AU07jjG1IDAWZ-YODhVp9mTCCS');
    console.log('   - WATSON_URL: https://api.eu-de.natural-language-understanding.watson.cloud.ibm.com/instances/a848c1ec');
    console.log('   - APPWRITE_DATABASE_ID: 68b10a4800298b059cf0');
    console.log('   - APPWRITE_ANALYSIS_COLLECTION_ID: analysis');
    console.log('\n4. Test by creating a survey with text questions!');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    
    if (error.message.includes('Function not found')) {
      console.log('\n💡 The function ID might not exist. Let me create it...');
      try {
        const newFunction = await functions.create(
          ID.unique(),
          'Watson NLU Analysis',
          ['https://cloud.appwrite.io/v1'],
          'nodejs-18.0',
          true
        );
        console.log(`✅ New function created: ${newFunction.$id}`);
        console.log('Please update your config with this new function ID and run the deployment again.');
      } catch (createError) {
        console.error('❌ Failed to create function:', createError.message);
      }
    }
  } finally {
    rl.close();
  }
}

deploy();
