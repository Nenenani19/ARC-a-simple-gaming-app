import { useState, useEffect, useRef } from 'react';

export const useAnimatedScore = (targetScore: number = 0, duration = 500) => {
  const [displayedScore, setDisplayedScore] = useState(targetScore);
  // FIX: The useRef hook requires an initial value.
  const frameRef = useRef<number | null>(null);
  const prevScoreRef = useRef(targetScore);

  useEffect(() => {
    const startScore = prevScoreRef.current;
    if (startScore === targetScore) return; // No change, no animation

    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const currentAnimatedScore = Math.round(startScore + (targetScore - startScore) * percentage);
      setDisplayedScore(currentAnimatedScore);

      if (progress < duration) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayedScore(targetScore);
        prevScoreRef.current = targetScore;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      // FIX: Check against null to correctly handle a request ID of 0.
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      // Update prevScoreRef immediately for the next potential change
      prevScoreRef.current = targetScore;
    };
  }, [targetScore, duration]);

  return displayedScore;
};
