# Watson NLU Integration Setup

## Step 1: Deploy the Appwrite Function

1. **Install dependencies:**
   ```bash
   npm install node-appwrite archiver
   ```

2. **Set up environment variables:**
   Create a `.env` file with your credentials:
   ```env
   # Appwrite Configuration
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your_project_id
   APPWRITE_API_KEY=your_api_key
   APPWRITE_DATABASE_ID=68b10a4800298b059cf0
   APPWRITE_ANALYSIS_COLLECTION_ID=analysis
   APPWRITE_FUNCTION_WATSON_NLU_ID=68b2b9fe0008a37d0428

   # Watson NLU Configuration (from your IBM Cloud)
   WATSON_API_KEY=z2h0cFAU4uZf3CBon4AU07jjG1IDAWZ-YODhVp9mTCCS
   WATSON_URL=https://api.eu-de.natural-language-understanding.watson.cloud.ibm.com/instances/a848c1ec...
   ```

3. **Deploy the function:**
   ```bash
   node deploy-function.js
   ```

## Step 2: Configure Appwrite Function Environment

In your Appwrite Console:

1. Go to **Functions** → **Watson NLU Analysis**
2. Go to **Settings** → **Environment Variables**
3. Add these variables:
   - `WATSON_API_KEY`: `z2h0cFAU4uZf3CBon4AU07jjG1IDAWZ-YODhVp9mTCCS`
   - `WATSON_URL`: `https://api.eu-de.natural-language-understanding.watson.cloud.ibm.com/instances/a848c1ec...`
   - `APPWRITE_DATABASE_ID`: `68b10a4800298b059cf0`
   - `APPWRITE_ANALYSIS_COLLECTION_ID`: `analysis`

## Step 3: Test the Integration

1. **Create a survey** with text questions
2. **Submit responses** with emotional text (e.g., "I'm so excited and happy!")
3. **Check the stats page** - you should see Watson NLU analysis

## How It Works

1. User submits survey → Response saved to database
2. SurveyRunner calls Watson NLU function with response data
3. Function processes text through Watson NLU
4. Emotion analysis results saved to `analysis` collection
5. Stats page displays the analysis

## Troubleshooting

- **No analysis appearing**: Check Appwrite Console → Functions → Logs
- **Function not triggering**: Verify the function ID in your config
- **Watson errors**: Check your API key and URL are correct
