// Simple deployment script
const { Client, Functions } = require('node-appwrite');
const fs = require('fs');

async function deploy() {
  try {
    console.log('🚀 Deploying updated Watson NLU function...');
    
    // Configuration
    const CONFIG = {
      APPWRITE_ENDPOINT: 'https://cloud.appwrite.io/v1',
      APPWRITE_PROJECT_ID: '68b10a4800298b059cf0',
      APPWRITE_API_KEY: 'z2hOcFAU4uZf3CBon4AUO7jjG1IDAWZ-YODhVp9mTCCS',
      APPWRITE_FUNCTION_WATSON_NLU_ID: '68b2b9fe0008a37d0428'
    };

    // Initialize Appwrite client
    const client = new Client();
    client
      .setEndpoint(CONFIG.APPWRITE_ENDPOINT)
      .setProject(CONFIG.APPWRITE_PROJECT_ID)
      .setKey(CONFIG.APPWRITE_API_KEY);

    const functions = new Functions(client);

    // Create deployment
    const zipPath = './functions/watson-nlu-new.zip';
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
    console.log('\n📋 The function now supports per-question emotion analysis!');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

deploy();