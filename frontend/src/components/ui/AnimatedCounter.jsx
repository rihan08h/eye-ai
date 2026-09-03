import { useEffect, useState } from 'react';

export default function AnimatedCounter({ value = 0, duration = 1000, suffix = '', prefix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const targetNumber = typeof value === 'number' ? value : parseInt(value, 10) || 0;

  useEffect(() => {
    let startTimestamp = null;
    const startValue = 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeProgress * (targetNumber - startValue) + startValue));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(targetNumber);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetNumber, duration]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}
