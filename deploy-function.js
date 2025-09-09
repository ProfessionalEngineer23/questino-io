// Deploy Watson NLU Function to Appwrite
// Run with: node deploy-function.js

const { Client, Functions, ID } = require('node-appwrite');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuration - Update these with your actual values
const CONFIG = {
  APPWRITE_ENDPOINT: 'https://cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: '68b10a4800298b059cf0', // Your project ID
  APPWRITE_API_KEY: process.env.APPWRITE_API_KEY || 'YOUR_API_KEY_HERE', // You need to provide this
  APPWRITE_DATABASE_ID: '68b10a4800298b059cf0',
  APPWRITE_ANALYSIS_COLLECTION_ID: 'analysis',
  APPWRITE_FUNCTION_WATSON_NLU_ID: '68b2b9fe0008a37d0428',
  WATSON_API_KEY: 'z2h0cFAU4uZf3CBon4AU07jjG1IDAWZ-YODhVp9mTCCS',
  WATSON_URL: 'https://api.eu-de.natural-language-understanding.watson.cloud.ibm.com/instances/a848c1ec'
};

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(CONFIG.APPWRITE_ENDPOINT)
  .setProject(CONFIG.APPWRITE_PROJECT_ID)
  .setKey(CONFIG.APPWRITE_API_KEY);

const functions = new Functions(client);

async function deployFunction() {
  try {
    console.log('🚀 Deploying Watson NLU Function...');

    // Create function if it doesn't exist
    let functionId = CONFIG.APPWRITE_FUNCTION_WATSON_NLU_ID;
    
    if (!functionId) {
      console.log('Creating new function...');
      const function = await functions.create(
        ID.unique(),
        'Watson NLU Analysis',
        ['https://cloud.appwrite.io/v1'],
        'nodejs-18.0',
        true
      );
      functionId = function.$id;
      console.log(`✅ Function created: ${functionId}`);
    } else {
      console.log(`Using existing function: ${functionId}`);
    }

    // Create deployment
    console.log('Creating deployment...');
    const deployment = await functions.createDeployment(
      functionId,
      'main',
      fs.createReadStream('./functions/watson-nlu.zip')
    );
    
    console.log(`✅ Deployment created: ${deployment.$id}`);

    // Update function to use new deployment
    await functions.update(
      functionId,
      'Watson NLU Analysis',
      ['https://cloud.appwrite.io/v1'],
      'nodejs-18.0',
      true,
      deployment.$id
    );

    console.log('🎉 Function deployed successfully!');
    console.log(`Function ID: ${functionId}`);
    console.log(`Deployment ID: ${deployment.$id}`);

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Create zip file
function createZip() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream('./functions/watson-nlu.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`📦 Zip created: ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);
    archive.directory('./functions/watson-nlu/', false);
    archive.finalize();
  });
}

async function main() {
  try {
    await createZip();
    await deployFunction();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
