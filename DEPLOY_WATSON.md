# 🚀 Deploy Watson NLU Function - Manual Guide

## Step 1: Get Your Appwrite API Key

1. Go to [Appwrite Console](https://cloud.appwrite.io/console)
2. Select your project (ID: `68b10a4800298b059cf0`)
3. Go to **Settings** → **API Keys**
4. Copy your API Key

## Step 2: Deploy via Appwrite Console

### Option A: Upload the Function Code

1. Go to **Functions** in your Appwrite Console
2. Click **Create Function**
3. Name: `Watson NLU Analysis`
4. Runtime: `Node.js 18.0`
5. Upload the zip file: `functions/watson-nlu.zip` (I'll create this for you)

### Option B: Use the Deploy Script

Run this command with your API key:
```bash
APPWRITE_API_KEY=your_api_key_here node deploy-function.js
```

## Step 3: Configure Environment Variables

In your Appwrite Console → Functions → Watson NLU Analysis → Settings → Environment Variables:

```
WATSON_API_KEY=z2h0cFAU4uZf3CBon4AU07jjG1IDAWZ-YODhVp9mTCCS
WATSON_URL=https://api.eu-de.natural-language-understanding.watson.cloud.ibm.com/instances/a848c1ec
APPWRITE_DATABASE_ID=68b10a4800298b059cf0
APPWRITE_ANALYSIS_COLLECTION_ID=analysis
```

## Step 4: Test the Integration

1. Create a survey with text questions
2. Submit responses with emotional text
3. Check the stats page for Watson NLU analysis

## What the Function Does

The Watson NLU function:
1. Receives survey response data
2. Sends text to IBM Watson NLU for emotion analysis
3. Saves results to the `analysis` collection
4. Links analysis to responses via `responseId`

## Troubleshooting

- **Function not triggering**: Check function logs in Appwrite Console
- **No analysis appearing**: Verify environment variables are set
- **Watson errors**: Check your API key and URL are correct

---

**Ready to deploy?** Let me know your Appwrite API Key and I'll help you deploy it!
