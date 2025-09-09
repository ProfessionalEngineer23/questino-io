# 🧪 Questino.io Testing Guide

This comprehensive testing guide will help you verify that all features work correctly after deployment.

## 📋 Pre-Testing Setup

### 1. Test Environment
- [ ] Deploy to staging/production environment
- [ ] Verify all environment variables are set
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS Safari, Android Chrome)

### 2. Test Data Preparation
- [ ] Create test Appwrite project
- [ ] Set up test database and collections
- [ ] Prepare sample survey data
- [ ] Create test user accounts

## 🔐 Authentication Testing

### User Registration
- [ ] **Valid Registration**: Create account with valid email/password
- [ ] **Invalid Email**: Try registration with invalid email format
- [ ] **Weak Password**: Try registration with password < 8 characters
- [ ] **Duplicate Email**: Try registering with existing email
- [ ] **Form Validation**: Ensure all required fields are validated

### User Login
- [ ] **Valid Login**: Login with correct credentials
- [ ] **Invalid Credentials**: Try login with wrong email/password
- [ ] **Empty Fields**: Try login with empty fields
- [ ] **Session Persistence**: Refresh page and verify user stays logged in
- [ ] **Logout**: Verify logout clears session

### Guest Mode
- [ ] **Anonymous Access**: Verify users can access surveys without login
- [ ] **Guest Responses**: Ensure anonymous responses are saved correctly
- [ ] **Session Management**: Verify guest sessions work properly

## 📝 Survey Creation & Management

### Survey Builder
- [ ] **Create New Survey**: Create survey from `/create` route
- [ ] **Auto-redirect**: Verify redirect to edit page after creation
- [ ] **Title/Description**: Add and edit survey title and description
- [ ] **Privacy Settings**: Toggle public/private survey settings
- [ ] **Stats Privacy**: Toggle public/private stats settings
- [ ] **Save Functionality**: Verify survey saves correctly

### Question Management
- [ ] **Add Text Question**: Add open-ended text question
- [ ] **Add Multiple Choice**: Add MCQ with multiple options
- [ ] **Add Scale Question**: Add rating scale with custom min/max
- [ ] **Edit Questions**: Modify question text and settings
- [ ] **Delete Questions**: Remove questions from survey
- [ ] **Required Toggle**: Mark questions as required/optional
- [ ] **Question Order**: Verify questions maintain order
- [ ] **Option Management**: Add/remove MCQ options
- [ ] **Scale Configuration**: Set custom scale ranges

### Survey Validation
- [ ] **Empty Survey**: Try to save survey with no questions
- [ ] **Empty Title**: Try to save survey with empty title
- [ ] **Long Text**: Test with very long question text
- [ ] **Special Characters**: Test with special characters in text

## 🎯 Survey Distribution

### Sharing Features
- [ ] **Public Link**: Generate and copy public survey link
- [ ] **QR Code Generation**: Generate QR code for survey
- [ ] **QR Code Download**: Download QR code as image
- [ ] **Link Accessibility**: Verify public links work without authentication
- [ ] **Private Survey Access**: Verify private surveys block unauthorized access

### URL Structure
- [ ] **Slug Generation**: Verify unique slugs are generated
- [ ] **Direct Access**: Access survey via `/s/slug` URL
- [ ] **Invalid Slug**: Try accessing non-existent survey
- [ ] **URL Encoding**: Test with special characters in survey titles

## 📊 Survey Response Collection

### Response Submission
- [ ] **Text Responses**: Submit text answers
- [ ] **Multiple Choice**: Select single choice options
- [ ] **Scale Responses**: Submit rating scale values
- [ ] **Required Fields**: Verify required questions are enforced
- [ ] **Form Validation**: Test client-side validation
- [ ] **Submission Success**: Verify success message after submission
- [ ] **Anonymous Responses**: Submit responses without login

### Response Data
- [ ] **Data Persistence**: Verify responses are saved to database
- [ ] **Answer Format**: Check JSON structure of saved answers
- [ ] **Free Text Concatenation**: Verify text answers are joined for NLU
- [ ] **Timestamps**: Verify submission timestamps are recorded
- [ ] **Participant ID**: Check anonymous participant handling

## 📈 Analytics & Statistics

### Stats Page Access
- [ ] **Public Stats**: Access public stats without authentication
- [ ] **Private Stats**: Verify private stats require owner access
- [ ] **Owner Access**: Verify survey owners can access private stats
- [ ] **Unauthorized Access**: Try accessing private stats without permission

### Data Visualization
- [ ] **Response Count**: Verify total response count displays
- [ ] **Emotion Analysis**: Check Watson NLU emotion scores
- [ ] **Text Question Stats**: Verify emotion analysis for text questions
- [ ] **Scale Question Stats**: Check histogram and average calculations
- [ ] **Multiple Choice Stats**: Verify bar charts and pie charts
- [ ] **Chart Animations**: Test chart loading animations
- [ ] **Empty State**: Test stats page with no responses

### Watson NLU Integration
- [ ] **Emotion Detection**: Verify joy, sadness, anger, fear, disgust scores
- [ ] **Sentiment Analysis**: Check sentiment scores if available
- [ ] **Per-Question Analysis**: Verify emotion analysis per question
- [ ] **Analysis Timing**: Check if analysis completes within timeout
- [ ] **Error Handling**: Test behavior when NLU analysis fails

## 📤 Export Functionality

### CSV Export
- [ ] **Export Button**: Verify export button is visible and functional
- [ ] **Export Process**: Test export with responses
- [ ] **File Download**: Verify CSV file downloads correctly
- [ ] **File Content**: Check CSV contains all response data
- [ ] **Emotion Data**: Verify Watson NLU data is included in export
- [ ] **File Naming**: Check filename includes survey title
- [ ] **Empty Export**: Test export with no responses
- [ ] **Large Dataset**: Test export with many responses

### Export Data Validation
- [ ] **Headers**: Verify CSV headers are correct
- [ ] **Data Format**: Check data is properly formatted
- [ ] **Special Characters**: Test with special characters in responses
- [ ] **Unicode Support**: Verify international characters work
- [ ] **Date Format**: Check timestamp formatting

## ⚡ Bulk Operations

### Multi-Selection
- [ ] **Select All**: Test select all functionality
- [ ] **Individual Selection**: Select individual surveys
- [ ] **Selection Counter**: Verify selection count displays
- [ ] **Clear Selection**: Test clearing selections

### Bulk Delete
- [ ] **Delete Confirmation**: Verify confirmation dialog appears
- [ ] **Multiple Deletion**: Delete multiple surveys
- [ ] **Single Deletion**: Delete single survey
- [ ] **Cancel Deletion**: Test canceling delete operation
- [ ] **UI Update**: Verify surveys are removed from UI
- [ ] **Database Update**: Check surveys are deleted from database

### Bulk Duplicate
- [ ] **Duplicate Creation**: Duplicate multiple surveys
- [ ] **Question Copying**: Verify questions are copied correctly
- [ ] **Settings Copying**: Check survey settings are preserved
- [ ] **Title Modification**: Verify "(Copy)" is added to titles
- [ ] **UI Update**: Check duplicated surveys appear in dashboard

## 🎨 User Interface & Experience

### Visual Design
- [ ] **Loading States**: Test all loading animations
- [ ] **Skeleton Screens**: Verify skeleton loading displays
- [ ] **Hover Effects**: Test button and card hover animations
- [ ] **Transitions**: Check page and component transitions
- [ ] **Color Scheme**: Verify brand colors are consistent
- [ ] **Typography**: Check font consistency across pages

### Responsive Design
- [ ] **Mobile Layout**: Test on mobile devices (320px+)
- [ ] **Tablet Layout**: Test on tablet devices (768px+)
- [ ] **Desktop Layout**: Test on desktop (1024px+)
- [ ] **Touch Interactions**: Verify touch interactions work
- [ ] **Navigation**: Test mobile navigation and menus

### Accessibility
- [ ] **Keyboard Navigation**: Test tab navigation
- [ ] **Screen Reader**: Test with screen reader
- [ ] **Focus Indicators**: Verify focus rings are visible
- [ ] **Color Contrast**: Check color contrast ratios
- [ ] **Alt Text**: Verify images have alt text

## 🔧 Performance Testing

### Load Times
- [ ] **Initial Load**: Measure time to first contentful paint
- [ ] **Page Transitions**: Test navigation speed
- [ ] **Chart Rendering**: Check chart loading performance
- [ ] **Large Datasets**: Test with many surveys/responses
- [ ] **Image Loading**: Verify QR codes and images load quickly

### Memory Usage
- [ ] **Memory Leaks**: Test for memory leaks during navigation
- [ ] **Chart Performance**: Test with large datasets
- [ ] **Animation Performance**: Verify smooth animations
- [ ] **Bundle Size**: Check production bundle size

## 🛡️ Security Testing

### Data Protection
- [ ] **Input Sanitization**: Test with malicious input
- [ ] **XSS Prevention**: Try injecting scripts
- [ ] **CSRF Protection**: Test cross-site request forgery
- [ ] **Data Validation**: Verify server-side validation
- [ ] **Privacy Controls**: Test public/private settings

### Authentication Security
- [ ] **Session Management**: Test session expiration
- [ ] **Password Security**: Verify password requirements
- [ ] **Account Protection**: Test account lockout mechanisms
- [ ] **API Security**: Verify API endpoints are protected

## 🐛 Error Handling

### Network Errors
- [ ] **Offline Mode**: Test behavior when offline
- [ ] **Slow Connection**: Test with slow network
- [ ] **API Failures**: Simulate API errors
- [ ] **Timeout Handling**: Test request timeouts
- [ ] **Retry Logic**: Verify retry mechanisms

### User Errors
- [ ] **Invalid Input**: Test with invalid form data
- [ ] **Missing Data**: Test with incomplete submissions
- [ ] **Permission Errors**: Test unauthorized access
- [ ] **Error Messages**: Verify helpful error messages
- [ ] **Recovery Options**: Test error recovery flows

## 📱 Cross-Platform Testing

### Browsers
- [ ] **Chrome**: Test on latest Chrome
- [ ] **Firefox**: Test on latest Firefox
- [ ] **Safari**: Test on latest Safari
- [ ] **Edge**: Test on latest Edge
- [ ] **Mobile Browsers**: Test on mobile Safari/Chrome

### Devices
- [ ] **iPhone**: Test on various iPhone models
- [ ] **Android**: Test on various Android devices
- [ ] **iPad**: Test on iPad
- [ ] **Desktop**: Test on Windows/Mac/Linux

## 🚀 Production Readiness

### Final Checklist
- [ ] **All Features Work**: Every feature functions correctly
- [ ] **Performance Acceptable**: Load times under 3 seconds
- [ ] **No Console Errors**: Clean browser console
- [ ] **Mobile Responsive**: Works on all device sizes
- [ ] **Accessibility Compliant**: Meets WCAG guidelines
- [ ] **Security Verified**: No security vulnerabilities
- [ ] **Error Handling**: Graceful error handling
- [ ] **User Experience**: Intuitive and smooth UX

### Monitoring Setup
- [ ] **Error Tracking**: Set up error monitoring
- [ ] **Analytics**: Configure user analytics
- [ ] **Performance Monitoring**: Set up performance tracking
- [ ] **Uptime Monitoring**: Configure uptime alerts

## 📊 Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: ___________
Browser/Device: ___________

### Authentication
- [ ] Registration: PASS/FAIL
- [ ] Login: PASS/FAIL
- [ ] Logout: PASS/FAIL
- [ ] Guest Mode: PASS/FAIL

### Survey Management
- [ ] Create Survey: PASS/FAIL
- [ ] Edit Survey: PASS/FAIL
- [ ] Delete Survey: PASS/FAIL
- [ ] Bulk Operations: PASS/FAIL

### Response Collection
- [ ] Submit Response: PASS/FAIL
- [ ] Data Persistence: PASS/FAIL
- [ ] Validation: PASS/FAIL

### Analytics
- [ ] Stats Display: PASS/FAIL
- [ ] Charts: PASS/FAIL
- [ ] Export: PASS/FAIL

### UI/UX
- [ ] Responsive Design: PASS/FAIL
- [ ] Animations: PASS/FAIL
- [ ] Loading States: PASS/FAIL

### Performance
- [ ] Load Times: PASS/FAIL
- [ ] Memory Usage: PASS/FAIL
- [ ] Error Handling: PASS/FAIL

### Issues Found:
1. ________________
2. ________________
3. ________________

### Overall Status: ✅ READY / ❌ NEEDS FIXES
```

---

**Testing Complete?** If all tests pass, your Questino.io platform is ready for production! 🎉

**Issues Found?** Document them and fix before going live. Your users deserve a flawless experience!
