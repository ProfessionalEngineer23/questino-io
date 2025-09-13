# 🎯 Questino.io

A modern, lightweight survey platform with emotion analytics powered by IBM Watson NLU. Create, share, and analyze surveys with beautiful visualizations and comprehensive insights.

## ✨ Features

- **🔐 User Authentication** - Secure login/registration with guest mode support
- **📝 Survey Builder** - Intuitive drag-and-drop survey creation
- **🎨 Modern UI** - Beautiful, responsive design with smooth animations
- **📊 Advanced Analytics** - Emotion analysis, sentiment tracking, and data visualization
- **📤 Export Capabilities** - CSV export with comprehensive response data
- **⚡ Bulk Operations** - Multi-select and bulk actions for survey management
- **🔗 Easy Sharing** - Public links and QR codes for survey distribution
- **📱 Mobile Responsive** - Works perfectly on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Appwrite account and project


## 📚 Documentation

- [🚀 Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [🧪 Testing Guide](./TESTING.md) - Comprehensive testing checklist
- [⚙️ Configuration](./src/config/appwrite.js) - Appwrite configuration

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Appwrite (Database, Authentication, Functions)
- **Analytics**: IBM Watson NLU
- **Charts**: Custom chart components
- **Icons**: Appwrite Pink Icons, Lucide React
- **Deployment**: Netlify/Vercel ready

## 🎨 Design System

- **Colors**: Custom brand palette with pink accent
- **Typography**: Clean, modern fonts
- **Components**: Reusable, accessible components
- **Animations**: Smooth micro-interactions
- **Responsive**: Mobile-first design approach

## 📊 Features Overview

### Survey Management
- Create surveys with multiple question types
- Public/private survey settings
- Bulk operations (delete, duplicate)
- Real-time preview and editing

### Question Types
- **Text Questions**: Open-ended responses
- **Multiple Choice**: Single or multiple selection
- **Scale Questions**: Rating scales with custom ranges

### Analytics & Insights
- **Emotion Analysis**: Joy, sadness, anger, fear, disgust
- **Sentiment Tracking**: Positive/negative sentiment scores
- **Visual Charts**: Histograms, pie charts, bar charts
- **Export Data**: CSV export with all response data

### User Experience
- **Authentication**: Secure login with guest mode
- **Responsive Design**: Works on all devices
- **Loading States**: Skeleton screens and animations
- **Error Handling**: Graceful error management

## 🔧 Development

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthModal.jsx   # Authentication modal
│   ├── Charts.jsx      # Chart components
│   ├── LoadingSpinner.jsx # Loading states
│   └── Toast.jsx       # Notification system
├── config/             # Configuration files
│   └── appwrite.js     # Appwrite settings
├── hooks/              # Custom React hooks
│   └── useAuth.js      # Authentication hook
├── lib/                # External library configs
│   └── appwrite.js     # Appwrite client setup
├── Dashboard.jsx       # Main dashboard
├── SurveyBuilder.jsx   # Survey creation/editing
├── SurveyRunner.jsx    # Survey response collection
├── Stats.jsx          # Analytics and statistics
└── surveyApi.js       # API functions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run deploy` - Build and preview

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Deployment Guide](./DEPLOYMENT.md)
2. Review the [Testing Guide](./TESTING.md)
3. Check browser console for errors
4. Verify environment variables are set correctly

## 🎉 Acknowledgments

- Built with [Appwrite](https://appwrite.io) for backend services
- Powered by [IBM Watson NLU](https://www.ibm.com/cloud/watson-natural-language-understanding) for emotion analysis
- Icons by [Appwrite Pink Icons](https://github.com/appwrite/pink-icons)
- UI components with [Tailwind CSS](https://tailwindcss.com)

---

**Ready to create amazing surveys?** 🚀 Start building with Questino.io today!
