import dayjs from 'dayjs';

import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export function formatRelativeTime(date: string | Date) {
  return dayjs(date).fromNow();
}

export function formatTimeSMHD(date: string | Date) {
  return dayjs(date).format('h:mm A');
}

export function formatElapsedSMHD(date: string | Date) {
  const seconds = dayjs().diff(dayjs(date), 'seconds');

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainingMinutes = (minutes % 60).toString().padStart(2, '0');
    return `${hours}h ${remainingMinutes}m`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d`;
}
