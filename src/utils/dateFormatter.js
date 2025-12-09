// Format date to readable string
export const formatDate = (date, includeTime = false) => {
  if (!date) return '';
  
  const d = new Date(date);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return d.toLocaleDateString('en-US', options);
};

// Format time only
export const formatTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format relative time (e.g., "2 minutes ago")
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(date);
};

// Format duration (e.g., "2h 30m")
export const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Format timestamp for emergency timeline
export const formatTimelineTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get time of day
export const getTimeOfDay = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// Check if date is today
export const isToday = (date) => {
  if (!date) return false;
  
  const today = new Date();
  const d = new Date(date);
  
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

// Format date for display in lists
export const formatListDate = (date) => {
  if (!date) return '';
  
  if (isToday(date)) {
    return `Today, ${formatTime(date)}`;
  }
  
  return formatDate(date, true);
};

export default {
  formatDate,
  formatTime,
  formatRelativeTime,
  formatDuration,
  formatTimelineTime,
  getTimeOfDay,
  isToday,
  formatListDate
};