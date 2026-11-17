import { supabase } from './supabase';

export const TASK_IMAGES_BUCKET = 'task-images';
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB
export const SIGNED_URL_EXPIRES_IN = 3600; // 1 ชั่วโมง (3600 วินาที)

// In-memory cache สำหรับเก็บ Signed URLs: Map<path, { url: string, expiresAt: number }>
const signedUrlCache = new Map();

/**
 * ตรวจสอบว่า path เป็น storage path ของผู้ใช้ใน Supabase Storage หรือไม่
 */
export const isUserStoragePath = (path, userId) => {
  if (!path || typeof path !== 'string') return false;
  // ข้ามข้อมูล Base64 เดิม, Blob URL หรือ HTTP URL ทั่วไป
  if (
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return false;
  }
  return userId ? path.startsWith(`${userId}/`) : path.includes('/');
};

/**
 * ดึง Signed URL จากแคชทันทีหากยังมีอายุใช้งาน (คืนค่าสตริงว่างหากไม่มีแคช)
 */
export const getCachedSignedUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  if (
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now() + 60 * 1000) {
    return cached.url;
  }
  return '';
};

/**
 * ดึง Signed URL สำหรับ Storage Path พร้อมระบบ In-Memory Cache
 */
export const getTaskSignedUrl = async (path, forceRefresh = false) => {
  if (!path || typeof path !== 'string') return '';

  // หากเป็น Base64 เดิม, Blob URL หรือ Web URL ให้ส่งกลับทันที
  if (
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }

  const now = Date.now();
  if (!forceRefresh) {
    const cached = signedUrlCache.get(path);
    // หากมีแคชและอายุคงเหลือมากกว่า 60 วินาที ให้ใช้แคชทันที
    if (cached && cached.expiresAt > now + 60 * 1000) {
      return cached.url;
    }
  }

  try {
    const { data, error } = await supabase.storage
      .from(TASK_IMAGES_BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRES_IN);

    if (error) {
      console.error('สร้าง Signed URL ไม่สำเร็จ:', error.message);
      return '';
    }

    if (data?.signedUrl) {
      signedUrlCache.set(path, {
        url: data.signedUrl,
        expiresAt: now + SIGNED_URL_EXPIRES_IN * 1000,
      });
      return data.signedUrl;
    }
    return '';
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการสร้าง Signed URL:', err);
    return '';
  }
};

/**
 * ล้างแคช Signed URL สำหรับ path ที่ระบุ
 */
export const invalidateSignedUrlCache = (path) => {
  if (path) {
    signedUrlCache.delete(path);
  }
};

/**
 * ตรวจสอบชนิดและขนาดไฟล์รูปภาพ
 */
export const validateImageFile = (file) => {
  if (!file) {
    throw new Error('ไม่พบไฟล์รูปภาพ');
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('รองรับเฉพาะไฟล์รูปภาพ JPG, PNG และ WebP เท่านั้น');
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB');
  }
};

/**
 * อัปโหลดไฟล์รูปภาพไปยัง Supabase Storage Bucket task-images
 * ใช้ path รูปแบบ: ${userId}/${crypto.randomUUID()}.${extension}
 */
export const uploadTaskImage = async (file, userId) => {
  validateImageFile(file);
  if (!userId) {
    throw new Error('กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปภาพ');
  }

  const extMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const extFromName = file.name?.split('.').pop()?.toLowerCase();
  const extension =
    extMap[file.type] ||
    (['jpg', 'jpeg', 'png', 'webp'].includes(extFromName)
      ? extFromName
      : 'png');

  const fileId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);

  const filePath = `${userId}/${fileId}.${extension}`;

  const { error } = await supabase.storage
    .from(TASK_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`อัปโหลดรูปภาพไปยัง Storage ไม่สำเร็จ: ${error.message}`);
  }

  return filePath;
};

/**
 * ลบไฟล์ออกจาก Supabase Storage เฉพาะเมื่อมั่นใจว่าเป็นไฟล์ในโฟลเดอร์ของผู้ใช้
 */
export const removeStorageFile = async (path, userId) => {
  if (!isUserStoragePath(path, userId)) return;
  try {
    invalidateSignedUrlCache(path);
    const { error } = await supabase.storage
      .from(TASK_IMAGES_BUCKET)
      .remove([path]);
    if (error) {
      console.warn('ลบไฟล์รูปภาพจาก Storage ไม่สำเร็จ:', error.message);
    }
  } catch (err) {
    console.warn('เกิดข้อผิดพลาดในการลบไฟล์จาก Storage:', err);
  }
};
