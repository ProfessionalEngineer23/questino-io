import { useState, useRef } from 'react';
import { speak, stopSpeak, canTTS, canSpeechRecognition, startSpeechRecognition } from '../lib/voice';

export default function VoiceControls({ 
  text, 
  enableRead, 
  enableRec, 
  onTranscript,
  // New props for option/scale selection
  questionType,
  options,
  scaleMin,
  scaleMax,
  onOptionSelect,
  onScaleSelect
}) {
  const [isListening, setIsListening] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const recognitionRef = useRef(null);

  const handleRead = () => {
    if (isReading) {
      stopSpeak();
      setIsReading(false);
    } else {
      setIsReading(true);
      speak(text, {
        onend: () => setIsReading(false),
        onerror: () => setIsReading(false)
      });
    }
  };

  const handleRecord = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setIsListening(true);
      setLastTranscript('');
      
      recognitionRef.current = startSpeechRecognition(
        (transcript) => {
          console.log('Voice transcript:', transcript);
          setLastTranscript(transcript);
          
          // Handle different question types
          if (questionType === 'text') {
            onTranscript(transcript);
          } else if (questionType === 'mcq' && options) {
            const selectedOption = findBestOptionMatch(transcript.toLowerCase(), options);
            if (selectedOption) {
              console.log('Selected option via voice:', selectedOption);
              onOptionSelect(selectedOption);
            }
          } else if (questionType === 'yes_no') {
            const selectedOption = findBestOptionMatch(transcript.toLowerCase(), ['yes', 'no']);
            if (selectedOption) {
              console.log('Selected yes/no via voice:', selectedOption);
              onOptionSelect(selectedOption);
            }
          } else if (questionType === 'scale' && scaleMin !== undefined && scaleMax !== undefined) {
            const selectedNumber = findBestNumber(transcript.toLowerCase(), scaleMin, scaleMax);
            if (selectedNumber !== null) {
              console.log('Selected scale value via voice:', selectedNumber);
              onScaleSelect(selectedNumber);
            }
          }
          
          setIsListening(false);
        },
        (error) => {
          console.error('Speech recognition error:', error);
          setIsListening(false);
        }
      );
    }
  };

  // Find the best matching option based on transcript
  const findBestOptionMatch = (transcript, options) => {
    if (!transcript || !options || options.length === 0) return null;
    
    // First, try exact matches (case insensitive)
    const exactMatch = options.find(option => 
      option.toLowerCase() === transcript
    );
    if (exactMatch) return exactMatch;
    
    // Then try partial matches (option contains transcript or vice versa)
    const partialMatch = options.find(option => 
      option.toLowerCase().includes(transcript) || 
      transcript.includes(option.toLowerCase())
    );
    if (partialMatch) return partialMatch;
    
    // Finally, try fuzzy matching for common words
    const fuzzyMatch = options.find(option => {
      const optionWords = option.toLowerCase().split(/\s+/);
      const transcriptWords = transcript.split(/\s+/);
      
      // Check if any significant words match
      return optionWords.some(optionWord => 
        optionWord.length > 2 && transcriptWords.some(transcriptWord => 
          transcriptWord.length > 2 && (
            optionWord.includes(transcriptWord) || 
            transcriptWord.includes(optionWord)
          )
        )
      );
    });
    
    return fuzzyMatch || null;
  };

  // Find the best matching number based on transcript
  const findBestNumber = (transcript, min, max) => {
    if (!transcript) return null;
    
    // Remove common filler words and clean up the transcript
    const cleanTranscript = transcript
      .replace(/\b(please|i|want|would|like|to|select|choose|pick)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Try to extract numbers from the transcript
    const numbers = cleanTranscript.match(/\d+/g);
    if (numbers) {
      for (const numStr of numbers) {
        const num = parseInt(numStr, 10);
        if (num >= min && num <= max) {
          return num;
        }
      }
    }
    
    // Try word-to-number conversion for common words
    const wordToNumber = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
      'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
      'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10
    };
    
    // Check for word matches
    for (const [word, num] of Object.entries(wordToNumber)) {
      if (cleanTranscript.includes(word) && num >= min && num <= max) {
        return num;
      }
    }
    
    // Try to find ordinal numbers (1st, 2nd, 3rd, etc.)
    const ordinalMatch = cleanTranscript.match(/(\d+)(st|nd|rd|th)/);
    if (ordinalMatch) {
      const num = parseInt(ordinalMatch[1], 10);
      if (num >= min && num <= max) {
        return num;
      }
    }
    
    // Special cases for common scale responses
    if (cleanTranscript.includes('maximum') || cleanTranscript.includes('highest') || cleanTranscript.includes('most')) {
      return max;
    }
    if (cleanTranscript.includes('minimum') || cleanTranscript.includes('lowest') || cleanTranscript.includes('least')) {
      return min;
    }
    if (cleanTranscript.includes('middle') || cleanTranscript.includes('center')) {
      return Math.round((min + max) / 2);
    }
    
    return null;
  };

  // Determine what voice input is available
  const hasVoiceInput = enableRec && canSpeechRecognition() && (
    questionType === 'text' || 
    (questionType === 'mcq' && options) || 
    (questionType === 'yes_no') || 
    (questionType === 'scale' && scaleMin !== undefined && scaleMax !== undefined)
  );

  if (!enableRead && !hasVoiceInput) return null;

  return (
    <div style={{ 
      display: 'flex', 
      gap: '8px', 
      alignItems: 'center', 
      marginTop: '12px',
      padding: '8px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    }}>
      {enableRead && canTTS() && (
        <button
          onClick={handleRead}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            backgroundColor: isReading ? '#ef4444' : '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title={isReading ? 'Stop reading' : 'Read question aloud'}
        >
          {isReading ? '⏹️' : '🔊'} {isReading ? 'Stop' : 'Read'}
        </button>
      )}
      
      {hasVoiceInput && (
        <button
          onClick={handleRecord}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            backgroundColor: isListening ? '#ef4444' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title={isListening ? 'Stop listening' : getVoiceButtonTitle()}
        >
          {isListening ? '⏹️' : '🎤'} {isListening ? 'Listening...' : getVoiceButtonLabel()}
        </button>
      )}
      
      {lastTranscript && (
        <div style={{ 
          fontSize: '11px', 
          color: '#475569',
          backgroundColor: '#f1f5f9',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #cbd5e1',
          marginLeft: '8px'
        }}>
          <strong>Heard:</strong> "{lastTranscript}"
        </div>
      )}
    </div>
  );

  function getVoiceButtonTitle() {
    if (questionType === 'text') return 'Answer by voice';
    if (questionType === 'mcq' || questionType === 'yes_no') return 'Say an option to select it';
    if (questionType === 'scale') return `Say a number from ${scaleMin} to ${scaleMax}`;
    return 'Answer by voice';
  }

  function getVoiceButtonLabel() {
    if (questionType === 'text') return 'Voice';
    if (questionType === 'mcq' || questionType === 'yes_no') return 'Voice Select';
    if (questionType === 'scale') return 'Voice Scale';
    return 'Voice';
  }
}
