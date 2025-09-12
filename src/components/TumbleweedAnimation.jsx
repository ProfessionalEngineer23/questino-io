import React, { useEffect, useState } from 'react';
import styles from './TumbleweedAnimation.module.css';

export default function TumbleweedAnimation({ onComplete }) {
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
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className={styles.container}>
      <div className={styles.tumbleweed}>
        <div className={styles.tumbleweedBody}>
          <svg className={styles.tumbleweedSvg} viewBox="0 0 60 60">
            {/* Main radiating lines from center */}
            <path className={styles.fluidLine} d="M30,45 C25,40 20,35 15,30 C10,25 8,20 5,15 C3,12 2,8 1,5" />
            <path className={styles.fluidLine} d="M30,45 C35,40 40,35 45,30 C50,25 52,20 55,15 C57,12 58,8 59,5" />
            <path className={styles.fluidLine} d="M30,15 C25,20 20,25 15,30 C10,35 8,40 5,45 C3,48 2,52 1,55" />
            <path className={styles.fluidLine} d="M30,15 C35,20 40,25 45,30 C50,35 52,40 55,45 C57,48 58,52 59,55" />
            <path className={styles.fluidLine} d="M15,30 C20,25 25,20 30,15 C35,10 40,8 45,5 C48,3 52,2 55,1" />
            <path className={styles.fluidLine} d="M45,30 C40,25 35,20 30,15 C25,10 20,8 15,5 C12,3 8,2 5,1" />
            <path className={styles.fluidLine} d="M15,30 C20,35 25,40 30,45 C35,50 40,52 45,55 C48,57 52,58 55,59" />
            <path className={styles.fluidLine} d="M45,30 C40,35 35,40 30,45 C25,50 20,52 15,55 C12,57 8,58 5,59" />
            
            {/* Dense center radiating outward - more lines */}
            <path className={styles.fluidLine} d="M30,30 C28,25 25,20 20,18 C15,16 10,18 8,22 C6,26 8,30 12,32" />
            <path className={styles.fluidLine} d="M30,30 C32,25 35,20 40,18 C45,16 50,18 52,22 C54,26 52,30 48,32" />
            <path className={styles.fluidLine} d="M30,30 C25,28 20,25 18,20 C16,15 18,10 22,8 C26,6 30,8 32,12" />
            <path className={styles.fluidLine} d="M30,30 C35,28 40,25 42,20 C44,15 42,10 38,8 C34,6 30,8 28,12" />
            <path className={styles.fluidLine} d="M30,30 C27,25 23,20 18,18 C13,16 8,18 6,22 C4,26 6,30 10,32" />
            <path className={styles.fluidLine} d="M30,30 C33,25 37,20 42,18 C47,16 52,18 54,22 C56,26 54,30 50,32" />
            <path className={styles.fluidLine} d="M30,30 C25,27 20,23 18,18 C16,13 18,8 22,6 C26,4 30,6 32,10" />
            <path className={styles.fluidLine} d="M30,30 C35,27 40,23 42,18 C44,13 42,8 38,6 C34,4 30,6 28,10" />
            
            {/* Intertwined flowing curves - many more */}
            <path className={styles.fluidLine} d="M30,35 C27,32 24,28 22,25 C20,22 18,18 16,15 C14,12 12,9 10,6" />
            <path className={styles.fluidLine} d="M30,35 C33,32 36,28 38,25 C40,22 42,18 44,15 C46,12 48,9 50,6" />
            <path className={styles.fluidLine} d="M30,25 C27,28 24,32 22,35 C20,38 18,42 16,45 C14,48 12,51 10,54" />
            <path className={styles.fluidLine} d="M30,25 C33,28 36,32 38,35 C40,38 42,42 44,45 C46,48 48,51 50,54" />
            <path className={styles.fluidLine} d="M30,40 C27,37 24,33 22,30 C20,27 18,23 16,20 C14,17 12,14 10,11" />
            <path className={styles.fluidLine} d="M30,40 C33,37 36,33 38,30 C40,27 42,23 44,20 C46,17 48,14 50,11" />
            <path className={styles.fluidLine} d="M30,20 C27,23 24,27 22,30 C20,33 18,37 16,40 C14,43 12,46 10,49" />
            <path className={styles.fluidLine} d="M30,20 C33,23 36,27 38,30 C40,33 42,37 44,40 C46,43 48,46 50,49" />
            
            {/* Additional flowing curves for density - many more */}
            <path className={styles.fluidLine} d="M30,40 C28,35 25,30 22,28 C19,26 16,28 14,31 C12,34 14,37 17,39" />
            <path className={styles.fluidLine} d="M30,40 C32,35 35,30 38,28 C41,26 44,28 46,31 C48,34 46,37 43,39" />
            <path className={styles.fluidLine} d="M30,20 C28,25 25,30 22,32 C19,34 16,32 14,29 C12,26 14,23 17,21" />
            <path className={styles.fluidLine} d="M30,20 C32,25 35,30 38,32 C41,34 44,32 46,29 C48,26 46,23 43,21" />
            <path className={styles.fluidLine} d="M30,42 C28,37 25,32 22,30 C19,28 16,30 14,33 C12,36 14,39 17,41" />
            <path className={styles.fluidLine} d="M30,42 C32,37 35,32 38,30 C41,28 44,30 46,33 C48,36 46,39 43,41" />
            <path className={styles.fluidLine} d="M30,18 C28,23 25,28 22,30 C19,32 16,30 14,27 C12,24 14,21 17,19" />
            <path className={styles.fluidLine} d="M30,18 C32,23 35,28 38,30 C41,32 44,30 46,27 C48,24 46,21 43,19" />
            
            {/* More flowing curves for the tangled effect - many more */}
            <path className={styles.fluidLine} d="M25,30 C22,27 18,25 15,27 C12,29 10,32 12,35 C14,38 17,36 20,34" />
            <path className={styles.fluidLine} d="M35,30 C38,27 42,25 45,27 C48,29 50,32 48,35 C46,38 43,36 40,34" />
            <path className={styles.fluidLine} d="M30,25 C27,22 23,20 20,22 C17,24 15,27 17,30 C19,33 22,31 25,29" />
            <path className={styles.fluidLine} d="M30,35 C33,38 37,40 40,38 C43,36 45,33 43,30 C41,27 38,29 35,31" />
            <path className={styles.fluidLine} d="M23,30 C20,27 16,25 13,27 C10,29 8,32 10,35 C12,38 15,36 18,34" />
            <path className={styles.fluidLine} d="M37,30 C40,27 44,25 47,27 C50,29 52,32 50,35 C48,38 45,36 42,34" />
            <path className={styles.fluidLine} d="M30,23 C27,20 23,18 20,20 C17,22 15,25 17,28 C19,31 22,29 25,27" />
            <path className={styles.fluidLine} d="M30,37 C33,40 37,42 40,40 C43,38 45,35 43,32 C41,29 38,31 35,33" />
            
            {/* Fine flowing details - many more */}
            <path className={styles.fluidLine} d="M30,30 C29,28 27,26 25,27 C23,28 22,30 24,32 C26,34 28,32 29,30" />
            <path className={styles.fluidLine} d="M30,30 C31,28 33,26 35,27 C37,28 38,30 36,32 C34,34 32,32 31,30" />
            <path className={styles.fluidLine} d="M30,30 C28,29 26,27 25,28 C24,29 25,31 27,32 C29,33 31,31 30,30" />
            <path className={styles.fluidLine} d="M30,30 C32,31 34,33 35,32 C36,31 35,29 33,28 C31,27 29,29 30,30" />
            <path className={styles.fluidLine} d="M30,30 C29,26 27,22 25,23 C23,24 22,26 24,28 C26,30 28,28 29,26" />
            <path className={styles.fluidLine} d="M30,30 C31,26 33,22 35,23 C37,24 38,26 36,28 C34,30 32,28 31,26" />
            <path className={styles.fluidLine} d="M30,30 C28,29 26,27 25,28 C24,29 25,31 27,32 C29,33 31,31 30,30" />
            <path className={styles.fluidLine} d="M30,30 C32,31 34,33 35,32 C36,31 35,29 33,28 C31,27 29,29 30,30" />
            
            {/* Extra tangled lines for maximum hairiness */}
            <path className={styles.fluidLine} d="M30,32 C28,30 26,28 24,29 C22,30 21,32 23,34 C25,36 27,34 28,32" />
            <path className={styles.fluidLine} d="M30,32 C32,30 34,28 36,29 C38,30 39,32 37,34 C35,36 33,34 32,32" />
            <path className={styles.fluidLine} d="M30,28 C28,30 26,32 24,31 C22,30 21,28 23,26 C25,24 27,26 28,28" />
            <path className={styles.fluidLine} d="M30,28 C32,30 34,32 36,31 C38,30 39,28 37,26 C35,24 33,26 32,28" />
            <path className={styles.fluidLine} d="M28,30 C26,28 24,26 22,27 C20,28 19,30 21,32 C23,34 25,32 26,30" />
            <path className={styles.fluidLine} d="M32,30 C34,28 36,26 38,27 C40,28 41,30 39,32 C37,34 35,32 34,30" />
            <path className={styles.fluidLine} d="M28,30 C26,32 24,34 22,33 C20,32 19,30 21,28 C23,26 25,28 26,30" />
            <path className={styles.fluidLine} d="M32,30 C34,32 36,34 38,33 C40,32 41,30 39,28 C37,26 35,28 34,30" />
          </svg>
        </div>
      </div>
      <div className={styles.dustTrail}>
        <div className={styles.dust}></div>
        <div className={styles.dust}></div>
        <div className={styles.dust}></div>
        <div className={styles.dust}></div>
        <div className={styles.dust}></div>
      </div>
    </div>
  );
}
