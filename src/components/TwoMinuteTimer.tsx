import { useState, useEffect, useCallback } from 'react';

interface TwoMinuteTimerProps {
  taskTitle: string;
  onComplete: () => void;
  onAddToActive: () => void;
  onCancel: () => void;
}

export function TwoMinuteTimer({ taskTitle, onComplete, onAddToActive, onCancel }: TwoMinuteTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleDone = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((120 - secondsLeft) / 120) * 100;

  if (isExpired) {
    return (
      <div className="two-minute-timer expired">
        <div className="timer-expired-icon">&#9200;</div>
        <h3>Time's up!</h3>
        <p className="timer-prompt">Still working on this?</p>
        <p className="timer-task-title">"{taskTitle}"</p>
        <div className="timer-expired-actions">
          <button className="timer-btn complete" onClick={onComplete}>
            Done - mark complete
          </button>
          <button className="timer-btn active" onClick={onAddToActive}>
            Add to active list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="two-minute-timer">
      <div className="timer-circle">
        <svg viewBox="0 0 100 100">
          <circle
            className="timer-circle-bg"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
          />
          <circle
            className="timer-circle-progress"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
            strokeDasharray={`${progress * 2.827} 282.7`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="timer-time">{formatTime(secondsLeft)}</div>
      </div>
      <p className="timer-task-title">"{taskTitle}"</p>
      <div className="timer-actions">
        <button className="timer-btn done" onClick={handleDone}>
          Done
        </button>
        <button className="timer-btn cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
