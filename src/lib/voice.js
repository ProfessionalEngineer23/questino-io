let speechSynthesis = null;
let currentUtterance = null;

export function canTTS() {
  return 'speechSynthesis' in window;
}

export function speak(text, options = {}) {
  if (!canTTS()) return;
  
  stopSpeak(); // Stop any current speech
  
  speechSynthesis = window.speechSynthesis;
  currentUtterance = new SpeechSynthesisUtterance(text);
  
  // Set voice options
  currentUtterance.rate = options.rate || 0.9;
  currentUtterance.pitch = options.pitch || 1;
  currentUtterance.volume = options.volume || 0.8;
  
  // Handle voice selection with a delay to ensure voices are loaded
  const setVoice = () => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
      );
      if (preferredVoice) {
        currentUtterance.voice = preferredVoice;
      }
    }
  };
  
  // Try to set voice immediately, or wait for voices to load
  setVoice();
  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.addEventListener('voiceschanged', setVoice, { once: true });
  }
  
  // Add error handling
  currentUtterance.onerror = (event) => {
    console.warn('Speech synthesis error:', event.error);
    if (options.onerror) options.onerror();
  };
  
  currentUtterance.onend = () => {
    if (options.onend) options.onend();
  };
  
  try {
    speechSynthesis.speak(currentUtterance);
  } catch (error) {
    console.warn('Failed to speak:', error);
  }
}

export function stopSpeak() {
  if (speechSynthesis) {
    speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function canSpeechRecognition() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export function startSpeechRecognition(onResult, onError) {
  if (!canSpeechRecognition()) {
    onError('Speech recognition not supported');
    return null;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };
  
  recognition.onerror = (event) => {
    onError(event.error);
  };
  
  recognition.start();
  return recognition;
}
