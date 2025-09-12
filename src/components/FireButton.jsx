import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './FireButton.css';

const FireButton = ({ children, onClick, className = '', disabled = false, ...props }) => {
  const [isOnFire, setIsOnFire] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [particles, setParticles] = useState([]);
  const inactivityTimer = useRef(null);
  const buttonRef = useRef(null);
  const lastActivityTime = useRef(Date.now());

  // Reset inactivity timer on any user activity
  const resetInactivityTimer = () => {
    lastActivityTime.current = Date.now();
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    
    // If button is on fire, trigger explosion and stop fire after 2 seconds
    if (isOnFire) {
      triggerExplosion();
      // Stop fire animation after 2 seconds
      setTimeout(() => {
        setIsOnFire(false);
      }, 2000);
    }
    
    // Set new timer only if not disabled
    if (!disabled) {
      inactivityTimer.current = setTimeout(() => {
        setIsOnFire(true);
      }, 30000); // 30 seconds
    }
  };

  // Create explosion particles
  const createExplosionParticles = (buttonRect) => {
    const newParticles = [];
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 50 + Math.random() * 100;
      const x = buttonRect.left + buttonRect.width / 2 + Math.cos(angle) * velocity;
      const y = buttonRect.top + buttonRect.height / 2 + Math.sin(angle) * velocity;
      
      newParticles.push({
        id: i,
        x,
        y,
        delay: Math.random() * 0.3,
        type: Math.random() > 0.5 ? 'smoke' : 'fire'
      });
    }
    
    setParticles(newParticles);
  };

  // Trigger explosion effect
  const triggerExplosion = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      createExplosionParticles(buttonRect);
      setShowExplosion(true);
      
      // Clear explosion after animation
      setTimeout(() => {
        setShowExplosion(false);
        setParticles([]);
      }, 2000);
    }
  };

  // Handle button click
  const handleClick = (e) => {
    resetInactivityTimer();
    if (onClick) {
      onClick(e);
    }
  };

  // Set up activity listeners
  useEffect(() => {
    const events = [
      'mousedown', 'mouseup', 'mousemove', 'click',
      'keydown', 'keyup', 'keypress',
      'scroll', 'wheel',
      'touchstart', 'touchend', 'touchmove',
      'focus', 'blur'
    ];
    
    const handleActivity = (e) => {
      // Throttle mousemove events to avoid excessive calls
      if (e.type === 'mousemove') {
        if (handleActivity.throttle) return;
        handleActivity.throttle = true;
        setTimeout(() => {
          handleActivity.throttle = false;
        }, 100); // Throttle to every 100ms
      }
      
      resetInactivityTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the initial timer
    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, []);

  // Clean up particles when component unmounts
  useEffect(() => {
    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, []);

  // Stop fire animation when disabled
  useEffect(() => {
    if (disabled && isOnFire) {
      setIsOnFire(false);
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    }
  }, [disabled, isOnFire]);

  return (
    <>
      <button
        ref={buttonRef}
        className={`fire-button ${isOnFire ? 'fire-active' : ''} ${className}`}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>

      {/* Explosion Portal */}
      {showExplosion && createPortal(
        <div className="smoke-explosion">
          {particles.map(particle => (
            <div
              key={particle.id}
              className={particle.type === 'smoke' ? 'smoke-particle' : 'fire-particle'}
              style={{
                left: particle.x,
                top: particle.y,
                animationDelay: `${particle.delay}s`
              }}
            />
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

export default FireButton;
