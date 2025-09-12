const cache = {};

// Create simple beep sounds using Web Audio API
function createBeepSound(frequency = 800, duration = 0.2) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

// Create celebration sound with multiple ascending tones
function createCelebrationSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6 (C major chord progression)
  
  frequencies.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    
    const startTime = audioContext.currentTime + (index * 0.1);
    const duration = 0.3;
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  });
}

export function loadSfx(name, src) {
  if (cache[name]) return cache[name];
  
  // For now, we'll use Web Audio API to create sounds instead of loading files
  // This avoids the file loading issues
  cache[name] = { 
    play: () => {
      try {
        if (name === 'correct' || name === 'progress') {
          createBeepSound(800, 0.2);
        } else if (name === 'submit') {
          createBeepSound(1000, 0.5);
        } else if (name === 'celebration') {
          // Create a more elaborate celebration sound with multiple tones
          createCelebrationSound();
        }
      } catch (e) {
        console.warn(`Failed to create sound: ${name}`, e);
      }
    },
    pause: () => {},
    currentTime: 0,
    volume: 0.5
  };
  
  return cache[name];
}
export function playSfx(name, volume = 0.5) {
  const a = cache[name];
  if (!a) {
    console.warn(`Sound file not loaded: ${name}`);
    return;
  }
  try {
    a.volume = volume;
    a.play();
  } catch (e) {
    console.warn(`Error playing sound: ${name}`, e);
  }
}
export function stopAll() {
  Object.values(cache).forEach(a => { 
    try { 
      a.pause(); 
      a.currentTime = 0;
    } catch (e) {
      console.warn('Error stopping sound:', e);
    }
  });
}
