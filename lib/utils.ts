// Maximum length for user-set display names. Applied at every place that
// reads or writes a nickname so DB rows stay within the limit and UI
// rendering doesn't have to truncate visually.
export const NICKNAME_MAX_LENGTH = 15;

export const truncateNickname = (name: string | null | undefined): string => {
  if (!name) return '';
  return name.length > NICKNAME_MAX_LENGTH ? name.slice(0, NICKNAME_MAX_LENGTH) : name;
};

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

// Thai fish species list — curated for sport/recreational fishing.
// Grouped internally by family; flat list for the dropdown.
export const FISH_SPECIES = [
  // น้ำจืด — กลุ่มช่อน
  'ปลาช่อน',
  'ปลาช่อนงูเห่า',
  'ปลาชะโด',
  'ปลากระสง',

  // น้ำจืด — กลุ่มปลาหนัง (ดุก/บึก/เทโพ)
  'ปลาดุก',
  'ปลาดุกอุย',
  'ปลาดุกด้าน',
  'ปลาดุกบิ๊กอุย',
  'ปลาบึก',
  'ปลาเทโพ',
  'ปลาสวาย',
  'ปลาสังกะวาด',
  'ปลาแขยง',
  'ปลากด',
  'ปลาเค้าขาว',
  'ปลาเค้าดำ',

  // น้ำจืด — กลุ่มเกล็ด (ตะเพียน/ยี่สก/นวลจันทร์)
  'ปลาตะเพียนขาว',
  'ปลาตะเพียนทอง',
  'ปลายี่สก',
  'ปลาจาด',
  'ปลากระโห้',
  'ปลานวลจันทร์',
  'ปลาเฉาฮื้อ',
  'ปลาลิ่น',
  'ปลาไน',
  'ปลาคาร์ป',
  'ปลาตะกาก',
  'ปลากะมัง',
  'ปลาแก้มช้ำ',
  'ปลาสร้อย',

  // น้ำจืด — หมอ/นิล/แรด
  'ปลานิล',
  'ปลาทับทิม',
  'ปลาหมอ',
  'ปลาหมอไทย',
  'ปลาหมอช้างเหยียบ',
  'ปลาแรด',

  // น้ำจืด — เสือตอ/ตอง/กราย
  'ปลาเสือตอ',
  'ปลาตอง',
  'ปลาตองลาย',
  'ปลากราย',

  // น้ำจืด — บู่/อื่นๆ
  'ปลาบู่ทราย',
  'ปลาบู่หิน',
  'ปลากระสูบ',
  'ปลาซิว',
  'ปลาก้าง',
  'ปลาไหล',
  'ปลาไหลนา',
  'ปลาปักเป้า',
  'ปลากัด',
  'ปลาทอง',

  // น้ำเค็ม — กะพง
  'ปลากะพงขาว',
  'ปลากะพงแดง',
  'ปลากะพงข้างปาน',
  'ปลากะพงเหลือง',

  // น้ำเค็ม — เก๋า
  'ปลาเก๋า',
  'ปลาเก๋าหิน',
  'ปลาเก๋าเสือ',
  'ปลาเก๋ามังกร',
  'ปลาเก๋าจุด',

  // น้ำเค็ม — ทู/ลัง/อินทรี
  'ปลาทู',
  'ปลาทูแขก',
  'ปลาลัง',
  'ปลาอินทรี',
  'ปลาอินทรีแถบ',

  // น้ำเค็ม — โอ/ทูน่า
  'ปลาโอ',
  'ปลาโอแถบ',
  'ปลาโอดำ',
  'ปลาทูน่า',

  // น้ำเค็ม — นักล่า
  'ปลากระโทงแทง',
  'ปลากระโทงดาบ',
  'ปลาฉลาม',
  'ปลากระเบน',
  'ปลาสาก',
  'ปลาช่อนทะเล',

  // น้ำเค็ม — อื่นๆ
  'ปลาดาบเงิน',
  'ปลาทรายแดง',
  'ปลาทรายขาว',
  'ปลาน้ำดอกไม้',
  'ปลาสีกุน',
  'ปลาสีเสียด',
  'ปลาสำลี',
  'ปลาจะละเม็ดดำ',
  'ปลาจะละเม็ดขาว',
  'ปลาโฉมงาม',
  'ปลาตาเหลือก',
  'ปลาเข็ม',
  'ปลาตะกรับ',
  'ปลาวัว',
  'ปลานกขุนทอง',
  'ปลานกแก้ว',
  'ปลากระบอก',
  'ปลาตาเดียว',
  'ปลาเหลือง',

  'อื่นๆ',
];

// Distance filters. UNLIMITED_DISTANCE_KM is a sentinel that means "no radius
// limit" — the API skips the distance filter and the map hides the circle.
export const UNLIMITED_DISTANCE_KM = 99999;

export const DISTANCE_OPTIONS = [
  { label: '5 กม.', value: 5 },
  { label: '10 กม.', value: 10 },
  { label: '20 กม.', value: 20 },
  { label: '50 กม.', value: 50 },
  { label: '100 กม.', value: 100 },
  { label: 'ทั้งประเทศ', value: UNLIMITED_DISTANCE_KM },
];
