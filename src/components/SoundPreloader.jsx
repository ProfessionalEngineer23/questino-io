import { useEffect } from 'react';
import { loadSfx } from '../lib/sfx';

export default function SoundPreloader() {
  useEffect(() => {
    // Preload sound effects (now using Web Audio API)
    loadSfx('correct', '');
    loadSfx('progress', '');
    loadSfx('submit', '');
    loadSfx('celebration', '');
  }, []);

  return null; // This component doesn't render anything
}
