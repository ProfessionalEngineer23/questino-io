import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { FEATURES } from '../featureFlags';

interface Survey {
  $id: string;
  title: string;
  slug: string;
  description?: string;
  allowAnonymous?: boolean;
  isPublic?: boolean;
  statsPublic?: boolean;
  $createdAt: string;
}

interface SurveyDetailsProps {
  survey: Survey;
}

export default function SurveyDetails({ survey }: SurveyDetailsProps) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/s/${survey.slug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="survey-card p-6 rounded-2xl">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{survey.title}</h2>
          {survey.description && (
            <p className="text-gray-600 mb-4">{survey.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {survey.isPublic && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="icon-globe mr-1"></span>
                Public
              </span>
            )}
            {survey.allowAnonymous && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <span className="icon-shield mr-1"></span>
                Anonymous
              </span>
            )}
            {survey.statsPublic && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <span className="icon-bar-chart mr-1"></span>
                Public Stats
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Created: {new Date(survey.$createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* QR Code and Sharing Section */}
      {FEATURES.QR_CODES && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Share Your Survey</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* QR Code */}
            <div className="text-center">
              <div className="inline-block p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <QRCodeCanvas
                  value={shareUrl}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">Scan to access survey</p>
            </div>

            {/* Share URL */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Survey Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-r-lg text-sm font-medium transition-colors ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-brand-500 text-white hover:bg-brand-600'
                    }`}
                  >
                    {copied ? (
                      <>
                        <span className="icon-check mr-1"></span>
                        Copied!
                      </>
                    ) : (
                      <>
                        <span className="icon-copy mr-1"></span>
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">Share this survey by:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Printing the QR code for offline sharing</li>
                  <li>• Sending the link via email or messaging</li>
                  <li>• Embedding in websites or social media</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback for when QR codes are disabled */}
      {!FEATURES.QR_CODES && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Share Your Survey</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Survey Link
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-r-lg text-sm font-medium transition-colors ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-brand-500 text-white hover:bg-brand-600'
                  }`}
                >
                  {copied ? (
                    <>
                      <span className="icon-check mr-1"></span>
                      Copied!
                    </>
                  ) : (
                    <>
                      <span className="icon-copy mr-1"></span>
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
