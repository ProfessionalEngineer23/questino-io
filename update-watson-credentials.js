// Update Watson NLU function with your credentials
import { Client, Functions } from "node-appwrite";

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("68b10a4800298b059cf0")
  .setKey("YOUR_APPWRITE_API_KEY"); // You'll need to get this from Appwrite Console

const functions = new Functions(client);

async function updateWatsonFunction() {
  try {
    // Update the function with your Watson credentials
    await functions.update(
      "68b10a4800298b059cf0", // Your function ID
      "Watson NLU Analysis",
      ["https://cloud.appwrite.io/v1"],
      "node-18.0",
      {
        WATSON_URL: "https://api.eu-de.natural-language-understanding.watson.cloud.ibm.com/instances/a848e1ec-5a72-446b-96c8-b11d72267caa",
        WATSON_API_KEY: "z2hOcFAU4uZf3CBon4AUO7jjG1IDAWZ-YODhVp9mTCCS",
        APPWRITE_ENDPOINT: "https://cloud.appwrite.io/v1",
        APPWRITE_PROJECT_ID: "68b10a4800298b059cf0",
        APPWRITE_API_KEY: "YOUR_APPWRITE_API_KEY", // You'll need to get this
        DB_ID: "68b10a4800298b059cf0",
        ANALYSIS_COLLECTION_ID: "YOUR_ANALYSIS_COLLECTION_ID" // You'll need to get this
      }
    );
    
    console.log("✅ Watson function updated successfully!");
  } catch (error) {
    console.error("❌ Failed to update Watson function:", error);
  }
}

updateWatsonFunction();
