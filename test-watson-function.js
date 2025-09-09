// Test if Watson function exists
import { Client, Functions } from "node-appwrite";

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("68b10a4800298b059cf0")
  .setKey("YOUR_API_KEY"); // Replace with your API key

const functions = new Functions(client);

async function testWatsonFunction() {
  try {
    // List all functions to see what's available
    const functionsList = await functions.list();
    console.log("Available functions:");
    functionsList.functions.forEach(func => {
      console.log(`- ${func.name} (ID: ${func.$id})`);
    });
    
    // Try to find the analyzeEmotion function
    const analyzeEmotion = functionsList.functions.find(f => f.name === "analyzeEmotion");
    if (analyzeEmotion) {
      console.log(`✅ Found analyzeEmotion function with ID: ${analyzeEmotion.$id}`);
    } else {
      console.log("❌ analyzeEmotion function not found");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testWatsonFunction();
