// Setup Watson NLU Integration
// This script will help you deploy the Watson NLU function

const readline = require('readline');
const { execSync } = require('child_process');

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

async function setup() {
  console.log('🎯 Watson NLU Integration Setup');
  console.log('================================\n');

  console.log('To deploy the Watson NLU function, you need your Appwrite API Key.');
  console.log('You can find it in your Appwrite Console:\n');
  console.log('1. Go to https://cloud.appwrite.io/console');
  console.log('2. Select your project');
  console.log('3. Go to Settings → API Keys');
  console.log('4. Copy your API Key\n');

  const apiKey = await askQuestion('Enter your Appwrite API Key: ');

  if (!apiKey || apiKey === '') {
    console.log('❌ API Key is required. Please run this script again with a valid API Key.');
    rl.close();
    return;
  }

  console.log('\n🔧 Setting up environment...');
  
  // Set the API key as environment variable
  process.env.APPWRITE_API_KEY = apiKey;

  try {
    console.log('📦 Creating function deployment package...');
    
    // Create zip file
    const archiver = require('archiver');
    const fs = require('fs');
    
    const output = fs.createWriteStream('./functions/watson-nlu.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', async () => {
      console.log(`✅ Zip created: ${archive.pointer()} bytes`);
      
      try {
        console.log('🚀 Deploying function to Appwrite...');
        
        // Import and run the deploy function
        const { deployFunction } = require('./deploy-function.js');
        await deployFunction();
        
        console.log('\n🎉 Watson NLU Function deployed successfully!');
        console.log('\nNext steps:');
        console.log('1. Go to your Appwrite Console → Functions → Watson NLU Analysis');
        console.log('2. Go to Settings → Environment Variables');
        console.log('3. Add these variables:');
        console.log('   - WATSON_API_KEY: z2h0cFAU4uZf3CBon4AU07jjG1IDAWZ-YODhVp9mTCCS');
        console.log('   - WATSON_URL: https://api.eu-de.natural-language-understanding.watson.cloud.ibm.com/instances/a848c1ec');
        console.log('   - APPWRITE_DATABASE_ID: 68b10a4800298b059cf0');
        console.log('   - APPWRITE_ANALYSIS_COLLECTION_ID: analysis');
        console.log('\n4. Test your integration by creating a survey with text questions!');
        
      } catch (error) {
        console.error('❌ Deployment failed:', error.message);
      }
      
      rl.close();
    });

    archive.on('error', (err) => {
      console.error('❌ Error creating zip:', err);
      rl.close();
    });

    archive.pipe(output);
    archive.directory('./functions/watson-nlu/', false);
    archive.finalize();

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    rl.close();
  }
}

setup();
