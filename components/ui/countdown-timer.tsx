'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string;
  onExpired?: () => void;
}

export function CountdownTimer({ expiresAt, onExpired }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });
  
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        onExpired?.();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    // 立即更新一次
    updateCountdown();

    // 每秒更新
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  if (isExpired) {
    return (
      <span className="inline-flex items-center text-xs text-red-600 font-medium">
        <Clock className="h-3 w-3 mr-1" />
        已过期
      </span>
    );
  }

  // 根据剩余时间选择颜色
  const getTimeColor = () => {
    const totalMinutes = timeLeft.hours * 60 + timeLeft.minutes;
    if (totalMinutes < 60) return 'text-red-600'; // 小于1小时，红色警告
    if (totalMinutes < 180) return 'text-orange-600'; // 小于3小时，橙色
    return 'text-gray-600'; // 超过3小时，正常灰色
  };

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <span className={`inline-flex items-center text-xs font-medium ${getTimeColor()}`}>
      <Clock className="h-3 w-3 mr-1" />
      {timeLeft.hours > 0 ? (
        `${formatTime(timeLeft.hours)}:${formatTime(timeLeft.minutes)}:${formatTime(timeLeft.seconds)}`
      ) : (
        `${formatTime(timeLeft.minutes)}:${formatTime(timeLeft.seconds)}`
      )}
    </span>
  );
}