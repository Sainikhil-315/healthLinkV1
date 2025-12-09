// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimals
};

// Convert degrees to radians
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Format distance for display
export const formatDistance = (km) => {
  if (!km || km < 0) return '0m';
  
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  
  return `${km.toFixed(1)}km`;
};

// Calculate ETA based on distance and speed
export const calculateETA = (distanceKm, speedKmh = 40) => {
  if (!distanceKm || distanceKm < 0) return 0;
  
  const hours = distanceKm / speedKmh;
  const minutes = Math.ceil(hours * 60);
  return minutes;
};

// Format ETA for display
export const formatETA = (minutes) => {
  if (!minutes || minutes < 0) return '0 min';
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
};

// Get speed category based on distance and time
export const getSpeedCategory = (distanceKm, timeMinutes) => {
  const speedKmh = (distanceKm / timeMinutes) * 60;
  
  if (speedKmh < 20) return 'slow';
  if (speedKmh < 40) return 'moderate';
  if (speedKmh < 60) return 'fast';
  return 'very_fast';
};

// Calculate bearing between two points
export const calculateBearing = (lat1, lng1, lat2, lng2) => {
  const dLng = toRadians(lng2 - lng1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  const bearing = Math.atan2(y, x);
  return ((bearing * 180) / Math.PI + 360) % 360;
};

// Get direction string from bearing
export const getDirection = (bearing) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

// Check if location is within radius
export const isWithinRadius = (centerLat, centerLng, pointLat, pointLng, radiusKm) => {
  const distance = calculateDistance(centerLat, centerLng, pointLat, pointLng);
  return distance <= radiusKm;
};

// Find nearest location from array
export const findNearest = (originLat, originLng, locations) => {
  if (!locations || locations.length === 0) return null;
  
  let nearest = null;
  let minDistance = Infinity;
  
  locations.forEach(location => {
    const distance = calculateDistance(
      originLat,
      originLng,
      location.lat,
      location.lng
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...location, distance };
    }
  });
  
  return nearest;
};

export default {
  calculateDistance,
  formatDistance,
  calculateETA,
  formatETA,
  getSpeedCategory,
  calculateBearing,
  getDirection,
  isWithinRadius,
  findNearest
};