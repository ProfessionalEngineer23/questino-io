# 🚀 Questino.io Deployment Guide

This guide will help you deploy your Questino.io survey platform to various hosting platforms.

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup

Create a `.env` file in your project root with the following variables:

```env
# Required - Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_PROJECT_NAME=Questino.io

# Optional - Database and Collection IDs (defaults provided)
VITE_APPWRITE_DATABASE_ID=68b10a4800298b059cf0
VITE_APPWRITE_SURVEYS_COLLECTION=surveys
VITE_APPWRITE_QUESTIONS_COLLECTION=questions
VITE_APPWRITE_RESPONSES_COLLECTION=responses
VITE_APPWRITE_ANALYSIS_COLLECTION=analysis

# Optional - Function IDs (defaults provided)
VITE_APPWRITE_WATSON_FUNCTION_ID=68b2b9fe0008a37d0428
```

### 2. Appwrite Setup

1. **Create Appwrite Project**:
   - Go to [Appwrite Console](https://cloud.appwrite.io)
   - Create a new project
   - Copy your Project ID

2. **Create Database**:
   - Create a database named `app` (or update the ID in config)
   - Create the following collections:
     - `surveys`
     - `questions` 
     - `responses`
     - `analysis`

3. **Set Collection Attributes**:
   - See the data model in `src/surveyApi.js` for required attributes
   - Ensure proper permissions are set

4. **Create Watson NLU Function**:
   - Create a Cloud Function for Watson NLU analysis
   - Update the function ID in your environment variables

### 3. Build and Test Locally

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Build for production
npm run build

# Test the build locally
npm run preview
```

## 🌐 Deployment Options

### Option 1: Netlify (Recommended)

1. **Connect Repository**:
   - Go to [Netlify](https://netlify.com)
   - Connect your GitHub repository
   - Netlify will auto-detect the build settings from `netlify.toml`

2. **Set Environment Variables**:
   - Go to Site Settings > Environment Variables
   - Add all your `VITE_*` variables

3. **Deploy**:
   - Netlify will automatically build and deploy
   - Your site will be available at `https://your-site-name.netlify.app`

### Option 2: Vercel

1. **Connect Repository**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect the build settings from `vercel.json`

2. **Set Environment Variables**:
   - Go to Project Settings > Environment Variables
   - Add all your `VITE_*` variables

3. **Deploy**:
   - Vercel will automatically build and deploy
   - Your site will be available at `https://your-project.vercel.app`

### Option 3: GitHub Pages

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script to package.json**:
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Deploy**:
   ```bash
   npm run build
   npm run deploy
   ```

### Option 4: Custom Server

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Serve the dist folder**:
   - Upload the `dist` folder to your server
   - Configure your web server to serve `index.html` for all routes
   - Ensure proper CORS headers if needed

## 🔧 Post-Deployment Configuration

### 1. Update Appwrite Settings

- Update your Appwrite project settings with the production domain
- Configure CORS settings to allow your production domain
- Update any webhook URLs if applicable

### 2. Test All Features

Run through the comprehensive testing checklist (see TESTING.md)

### 3. Set Up Monitoring

- Consider setting up error tracking (Sentry, LogRocket)
- Monitor performance and user analytics
- Set up uptime monitoring

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check for linting errors: `npm run lint`
   - Ensure all dependencies are installed: `npm install`
   - Check for TypeScript errors if using TS

2. **Environment Variables Not Working**:
   - Ensure variables start with `VITE_`
   - Check that variables are set in your hosting platform
   - Verify variable names match exactly

3. **Routing Issues**:
   - Ensure your hosting platform is configured for SPA routing
   - Check that `_redirects` file is in the `public` folder
   - Verify `netlify.toml` or `vercel.json` redirect rules

4. **Appwrite Connection Issues**:
   - Verify your Appwrite endpoint and project ID
   - Check CORS settings in Appwrite console
   - Ensure your domain is whitelisted

### Performance Optimization

1. **Enable Compression**:
   - Most hosting platforms enable gzip compression automatically
   - Consider enabling Brotli compression for better performance

2. **CDN Configuration**:
   - Use a CDN for static assets
   - Configure proper cache headers

3. **Bundle Analysis**:
   ```bash
   npm install --save-dev vite-bundle-analyzer
   npx vite-bundle-analyzer dist
   ```

## 📊 Monitoring and Analytics

### Recommended Tools

1. **Error Tracking**: Sentry, LogRocket
2. **Analytics**: Google Analytics, Mixpanel
3. **Performance**: Web Vitals, Lighthouse
4. **Uptime**: UptimeRobot, Pingdom

### Key Metrics to Monitor

- Page load times
- User engagement
- Survey completion rates
- Error rates
- API response times

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm install
    - name: Build
      run: npm run build
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v1.2
      with:
        publish-dir: './dist'
        production-branch: main
        github-token: ${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Deploy from GitHub Actions"
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## ✅ Success Criteria

Your deployment is successful when:

- [ ] Site loads without errors
- [ ] All routes work correctly (SPA routing)
- [ ] Authentication flow works
- [ ] Survey creation and editing works
- [ ] Survey sharing and QR codes work
- [ ] Response collection works
- [ ] Analytics and charts display correctly
- [ ] CSV export functions properly
- [ ] Bulk operations work
- [ ] Mobile responsiveness is maintained

## 🆘 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are set
3. Test locally with `npm run preview`
4. Check Appwrite console for API errors
5. Review hosting platform logs

---

**Ready to deploy?** Choose your preferred platform and follow the steps above. Your Questino.io platform is production-ready! 🎉
