import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { FEATURES } from "../featureFlags";
import AuthChoiceModal from "../components/AuthChoiceModal";

export default function HomeV2() {
  const [showAuthChoice, setShowAuthChoice] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Demo images data - Using your actual image names
  const demoImages = [
    {
      src: "/demo-images/Questions_confetti_clear.png",
      alt: "Interactive Survey Experience",
      title: "Interactive Survey Experience",
      description: "Engaging survey interface with voice options and conversational mode"
    },
    {
      src: "/demo-images/Charts_enhanced.png",
      alt: "Survey Results Dashboard",
      title: "Survey Results Dashboard",
      description: "View comprehensive analytics with emotion analysis and response breakdowns"
    },
    {
      src: "/demo-images/charts1_enhanced.png",
      alt: "Study Method Analysis",
      title: "Study Method Analysis",
      description: "Track which study methods work best with visual charts and insights"
    },
    {
      src: "/demo-images/Dashboard_enhanced.png",
      alt: "Survey Management Dashboard",
      title: "Survey Management Dashboard",
      description: "Manage all your surveys with templates and quick creation tools"
    },
    {
      src: "/demo-images/Emotion_Treds_enhanced.png",
      alt: "Emotion Trends",
      title: "Emotion Trends",
      description: "Monitor emotional patterns over time with beautiful visualizations"
    },
    {
      src: "/demo-images/Starting_enhanced.png",
      alt: "AI-Powered Insights",
      title: "AI-Powered Insights",
      description: "Get intelligent analysis of emotions, trends, and patterns in your data"
    }
  ];

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === demoImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [demoImages.length]);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === demoImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? demoImages.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              <span className="text-white text-2xl font-bold">Q</span>
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-800">Questino.io</h1>
              <p className="text-sm text-gray-600">Survey Platform</p>
            </div>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Wellbeing & Emotion-Aware Questionnaires
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
            A safe, engaging platform for students and employees to express their honest feelings. 
            Perfect for the quiet, shy, or those who need a comfortable space to share.
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            Quick surveys, AI-powered emotion analysis, happiness assessments, and conversational 
            questionnaires that feel natural and human-like.
          </p>
          
          <button
            onClick={() => setShowAuthChoice(true)}
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-semibold rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            <span className="icon-rocket mr-3"></span>
            Start a Wellbeing Survey
          </button>
        </div>
      </section>

      {/* Why This Matters Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
            Why This Matters
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Many students and employees don't feel comfortable expressing their emotions in person. 
            Some are introverted, shy, or simply need a safe space to share honest feedback.
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Our platform creates that safe medium, helping schools and workplaces understand 
            wellbeing and improve culture through genuine, emotion-aware insights.
          </p>
        </div>
      </section>

      {/* Built for Students & Employees Section */}
      <section className="py-16 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
            Built for Students & Employees
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Students */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="icon-user text-white text-2xl"></span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Students</h3>
              <p className="text-gray-600 text-lg">
                Understand wellbeing, stress levels, and happiness trends. Get insights into 
                study methods, confidence, and overall academic experience.
              </p>
            </div>

            {/* Employees */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="icon-users text-white text-2xl"></span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Employees</h3>
              <p className="text-gray-600 text-lg">
                Collect honest feedback to improve workplace culture. Track engagement, 
                satisfaction, and emotional wellbeing in your organization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
            Powerful Features for Better Insights
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Emotion Analysis */}
            <div className="survey-card p-6 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center mb-4">
                <span className="icon-heart text-white text-xl"></span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Emotion Analysis</h3>
              <p className="text-gray-600 mb-4">
                AI-powered detection of joy, stress, sadness, and more. Get deeper insights 
                beyond just statistics.
              </p>
            </div>

            {/* Happiness Assessment */}
            <div className="survey-card p-6 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mb-4">
                <span className="icon-sun text-white text-xl"></span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Happiness Assessment</h3>
              <p className="text-gray-600 mb-4">
                Research-based questionnaires following the World Happiness Report framework. 
                15 questions across key life areas.
              </p>
            </div>

            {/* Conversational Surveys */}
            <div className="survey-card p-6 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                <span className="icon-phone text-white text-xl"></span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Conversational Mode</h3>
              <p className="text-gray-600 mb-4">
                Optional human-like voice interactions and animations. Makes questionnaires 
                feel natural and engaging.
              </p>
            </div>

            {/* Accessibility */}
            <div className="survey-card p-6 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                <span className="icon-eye text-white text-xl"></span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Accessibility</h3>
              <p className="text-gray-600 mb-4">
                Text-to-speech and voice input for sensory-impaired users. Inclusive design 
                for everyone.
              </p>
            </div>

            {/* Fun & Rewarding */}
            <div className="survey-card p-6 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                <span className="icon-star text-white text-xl"></span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Fun & Rewarding</h3>
              <p className="text-gray-600 mb-4">
                Smooth animations, sounds, and engaging interactions. Make surveys 
                enjoyable to complete.
              </p>
            </div>

            {/* Export & Insights */}
            <div className="survey-card p-6 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-xl flex items-center justify-center mb-4">
                <span className="icon-download text-white text-xl"></span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Export & Insights</h3>
              <p className="text-gray-600 mb-4">
                AI-powered summaries and CSV data export. Get actionable insights 
                from your survey data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Preview Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
            See It In Action
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">From Simple Questions to Powerful Insights</h3>
              <p className="text-lg text-gray-600 mb-6">
                Watch how a simple wellbeing questionnaire transforms into comprehensive 
                emotion analysis and actionable insights.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="icon-check text-green-500 mr-3"></span>
                  Conversational survey experience
                </li>
                <li className="flex items-center">
                  <span className="icon-check text-green-500 mr-3"></span>
                  Real-time emotion analysis
                </li>
                <li className="flex items-center">
                  <span className="icon-check text-green-500 mr-3"></span>
                  AI-powered insights dashboard
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="relative h-80 bg-gray-100 rounded-lg overflow-hidden">
                {/* Carousel Container */}
                <div className="relative h-full">
                  {/* Image */}
                  <div className="absolute inset-0 transition-opacity duration-500 ease-in-out">
                    <img
                      src={demoImages[currentImageIndex].src}
                      alt={demoImages[currentImageIndex].alt}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                    {/* Image Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h4 className="text-lg font-semibold mb-1">
                        {demoImages[currentImageIndex].title}
                      </h4>
                      <p className="text-sm opacity-90">
                        {demoImages[currentImageIndex].description}
                      </p>
                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    aria-label="Previous image"
                  >
                    <span className="icon-chevron-left text-xl"></span>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    aria-label="Next image"
                  >
                    <span className="icon-chevron-right text-xl"></span>
                  </button>

                  {/* Dots Indicator */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {demoImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          index === currentImageIndex
                            ? 'bg-white scale-125'
                            : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            Ready to Understand Wellbeing in Your School or Workplace?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join educators and managers already using emotion-aware surveys to build 
            safer, happier communities.
          </p>
          <button
            onClick={() => setShowAuthChoice(true)}
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-semibold rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            <span className="icon-rocket mr-3"></span>
            Start Your First Survey Free
          </button>
          
          {/* Privacy Note */}
          <p className="text-sm text-gray-500 mt-6">
            🔒 Anonymous responses • Your data is secure • Only shared if you choose
          </p>
        </div>
      </section>

      {showAuthChoice && (
        <AuthChoiceModal onClose={() => setShowAuthChoice(false)} />
      )}
    </div>
  );
}
