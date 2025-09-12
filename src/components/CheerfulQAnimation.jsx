import React, { useEffect, useState } from 'react';
import styles from './CheerfulQAnimation.module.css';

export default function CheerfulQAnimation({ onComplete }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start animation after a brief delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    // Complete animation after duration
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete && onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className={styles.container}>
      <div className={styles.cheerfulQ}>
        <div className={styles.qLogo}>
          <div className={styles.shineEffect}></div>
          <div className={styles.qLetter}>Q</div>
          <div className={styles.smileyFace}>
            <div className={styles.eye}></div>
            <div className={styles.eye}></div>
            <div className={styles.smile}></div>
            <div className={styles.cheek}></div>
            <div className={styles.cheek}></div>
          </div>
          <div className={styles.glowEffect}></div>
        </div>
        
        {/* Stars */}
        <div className={styles.star} style={{ top: '10%', left: '15%', animationDelay: '0s' }}>⭐</div>
        <div className={styles.star} style={{ top: '20%', right: '20%', animationDelay: '0.3s' }}>✨</div>
        <div className={styles.star} style={{ top: '60%', left: '10%', animationDelay: '0.6s' }}>🌟</div>
        <div className={styles.star} style={{ top: '70%', right: '15%', animationDelay: '0.9s' }}>⭐</div>
        <div className={styles.star} style={{ top: '40%', left: '5%', animationDelay: '1.2s' }}>✨</div>
        <div className={styles.star} style={{ top: '30%', right: '5%', animationDelay: '1.5s' }}>🌟</div>
        
        {/* Sparkles */}
        <div className={styles.sparkle} style={{ top: '25%', left: '25%', animationDelay: '0.2s' }}></div>
        <div className={styles.sparkle} style={{ top: '45%', right: '25%', animationDelay: '0.5s' }}></div>
        <div className={styles.sparkle} style={{ top: '65%', left: '30%', animationDelay: '0.8s' }}></div>
        <div className={styles.sparkle} style={{ top: '35%', right: '30%', animationDelay: '1.1s' }}></div>
      </div>
    </div>
  );
}
