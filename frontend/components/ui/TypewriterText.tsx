'use client';

import { useState, useEffect } from 'react';

type TextPart = {
  text: string;
  className?: string;
};

interface TypewriterTextProps {
  parts: TextPart[];
  speed?: number;
  cursorClassName?: string;
}

export function TypewriterText({ parts, speed = 50, cursorClassName = "text-mospi-600" }: TypewriterTextProps) {
  const [displayedParts, setDisplayedParts] = useState<string[]>(parts.map(() => ""));
  const [isTyping, setIsTyping] = useState(true);
  
  useEffect(() => {
    let currentPartIndex = 0;
    let currentCharIndex = 0;
    
    // Reset state in case parts change
    setDisplayedParts(parts.map(() => ""));
    setIsTyping(true);
    
    const timer = setInterval(() => {
      if (currentPartIndex >= parts.length) {
        clearInterval(timer);
        setIsTyping(false);
        return;
      }
      
      const currentPartText = parts[currentPartIndex].text;
      
      setDisplayedParts((prev) => {
        const newParts = [...prev];
        newParts[currentPartIndex] = currentPartText.substring(0, currentCharIndex + 1);
        return newParts;
      });
      
      currentCharIndex++;
      
      if (currentCharIndex >= currentPartText.length) {
        currentPartIndex++;
        currentCharIndex = 0;
      }
      
    }, speed);
    
    return () => clearInterval(timer);
  }, [parts, speed]);

  return (
    <>
      {parts.map((part, index) => (
        <span key={index} className={part.className}>
          {displayedParts[index]}
        </span>
      ))}
      {/* Blinking cursor */}
      <span 
        className={`inline-block w-[3px] h-[1em] ml-1 bg-current align-middle animate-pulse ${cursorClassName} ${!isTyping ? 'opacity-50' : ''}`}
        style={{ animationDuration: '1s' }}
      ></span>
    </>
  );
}
