import React, { useState, useEffect } from 'react';

interface TypingEffectProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ text, speed = 25, className, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    setIsCompleted(false);
    setDisplayedText('');
    
    if (text) {
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(text.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingInterval);
          setIsCompleted(true);
          if (onComplete) {
            onComplete();
          }
        }
      }, speed);

      return () => clearInterval(typingInterval);
    }
  }, [text, speed, onComplete]);

  return (
    <p className={className}>
      {displayedText}
      {!isCompleted && <span className="ml-1 animate-pulse">▌</span>}
    </p>
  );
};

export default TypingEffect;
