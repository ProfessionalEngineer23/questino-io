// Script to update your Appwrite function environment variables
import { Client, Functions } from "node-appwrite";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const prompt = require('prompt-sync')({ sigint: true });

console.log("🔧 Updating Watson NLU Function Environment Variables");
console.log("=" .repeat(50));

const APPWRITE_ENDPOINT = prompt('Enter your Appwrite Endpoint (e.g., https://cloud.appwrite.io/v1): ');
const APPWRITE_PROJECT_ID = prompt('Enter your Appwrite Project ID: ');
const APPWRITE_API_KEY = prompt('Enter your Appwrite API Key (with functions.write scope): ');
const WATSON_NLU_FUNCTION_ID = prompt('Enter your Watson NLU Function ID (68b2b9fe0008a37d0428): ') || "68b2b9fe0008a37d0428";
const WATSON_API_KEY = prompt('Enter your IBM Watson NLU API Key: ');
const WATSON_URL = prompt('Enter your IBM Watson NLU URL: ');
const DB_ID = prompt('Enter your Appwrite Database ID: ');
const ANALYSIS_COLLECTION_ID = prompt('Enter your Appwrite Analysis Collection ID: ');

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const functions = new Functions(client);

async function updateFunctionEnvVars() {
  try {
    console.log("\n🔍 Getting current function details...");
    const currentFunction = await functions.get(WATSON_NLU_FUNCTION_ID);
    
    console.log(`📋 Function: ${currentFunction.name}`);
    console.log(`🆔 ID: ${currentFunction.$id}`);
    
    // Prepare new environment variables
    const newEnvVars = [
      { key: 'WATSON_API_KEY', value: WATSON_API_KEY },
      { key: 'WATSON_URL', value: WATSON_URL },
      { key: 'APPWRITE_ENDPOINT', value: APPWRITE_ENDPOINT },
      { key: 'APPWRITE_PROJECT_ID', value: APPWRITE_PROJECT_ID },
      { key: 'APPWRITE_API_KEY', value: APPWRITE_API_KEY },
      { key: 'APPWRITE_DATABASE_ID', value: DB_ID },
      { key: 'APPWRITE_ANALYSIS_COLLECTION_ID', value: ANALYSIS_COLLECTION_ID }
    ];

    console.log("\n📝 Updating environment variables...");
    await functions.update(
      WATSON_NLU_FUNCTION_ID,
      currentFunction.name,
      currentFunction.execute,
      currentFunction.events,
      currentFunction.schedule,
      currentFunction.timeout,
      currentFunction.enabled,
      currentFunction.logging,
      currentFunction.runtime,
      currentFunction.entrypoint,
      currentFunction.commands,
      currentFunction.installation,
      newEnvVars
    );

    console.log("✅ Successfully updated environment variables!");
    console.log("\n📋 Environment variables set:");
    newEnvVars.forEach(env => {
      console.log(`   ${env.key}: ${env.value.substring(0, 20)}...`);
    });
    
    console.log("\n🚀 Next steps:");
    console.log("1. Go to Appwrite Console → Functions → analyzeEmotion");
    console.log("2. Upload the updated files from ./functions/watson-nlu/");
    console.log("3. Deploy the function");
    console.log("4. Test by submitting a survey response");
    
  } catch (error) {
    console.error("❌ Error updating function environment variables:", error.message);
    console.log("\n💡 Make sure to:");
    console.log("1. Use the correct Appwrite credentials");
    console.log("2. Get your API key from Appwrite Console → Settings → API Keys");
    console.log("3. Make sure the API key has 'Functions' permission");
  }
}

updateFunctionEnvVars();
