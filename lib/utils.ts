// Calculate distance between two coordinates in km
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format date to Thai locale
export const formatDateThai = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get current geolocation
export const getCurrentLocation = (): Promise<GeolocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => reject(error),
      { timeout: 10000, maximumAge: 60000 }
    );
  });
};

// Format number with thousand separators
export const formatNumber = (num: number): string => {
  return num.toLocaleString('th-TH');
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Thai fish species list
export const FISH_SPECIES = [
  'ปลาช่อน',
  'ปลาตัวเบ็ญ',
  'ปลาหมอ',
  'ปลากระพง',
  'ปลากะพง',
  'ปลาชะโอด',
  'ปลาแซลมอน',
  'ปลาทอง',
  'ปลาเบญจพรรณ',
  'ปลาสมอ',
  'ปลากัง',
  'ปลาแบน',
  'ปลากระเบน',
  'ปลาดุก',
  'ปลาลีลา',
  'ปลาส้อม',
  'ปลาเม็ด',
  'ปลาหนวด',
  'ปลาเขียด',
  'ปลาชอด',
];

// Distance filters
export const DISTANCE_OPTIONS = [
  { label: '5 กม.', value: 5 },
  { label: '10 กม.', value: 10 },
  { label: '20 กม.', value: 20 },
  { label: '50 กม.', value: 50 },
  { label: '100 กม.', value: 100 },
];
