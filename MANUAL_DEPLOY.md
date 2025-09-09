# 🚀 Manual Deployment Guide

Since the automated deployment is having issues, here's how to deploy manually:

## Option 1: Upload via Appwrite Console

1. **Go to your Appwrite Console:**
   - https://cloud.appwrite.io/console/project-fra-68b1072d00299f0f88b9/functions/function-68b2b9fe0008a37d0428

2. **Click "Create deployment"**

3. **Upload the zip file:**
   - Use: `functions/watson-nlu-new.zip`

4. **Set environment variables:**
   - Go to Settings → Environment Variables
   - Add these:
     ```
     WATSON_API_KEY=z2h0cFAU4uZf3CBon4AU07jjG1IDAWZ-YODhVp9mTCCS
     WATSON_URL=https://api.eu-de.natural-language-understanding.watson.cloud.ibm.com/instances/a848c1ec
     APPWRITE_DATABASE_ID=68b10a4800298b059cf0
     APPWRITE_ANALYSIS_COLLECTION_ID=analysis
     ```

## Option 2: Test Current Function

Let's test if your current function already works:

1. **Go to your function in Appwrite Console**
2. **Click "Execute"**
3. **Test with this payload:**
   ```json
   {
     "responseId": "test123",
     "text": "I am so excited and happy about this amazing opportunity!"
   }
   ```

## Option 3: Check Function Code

Your current function might already have the right code. Let's check:

1. **Go to your function → Deployments**
2. **Check the source code**
3. **If it's already calling Watson NLU, just add the environment variables**

## Quick Test

Once deployed, test by:
1. Creating a survey with text questions
2. Submitting responses with emotional text
3. Checking the stats page for analysis

---

**Which option would you like to try first?**
