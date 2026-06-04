
import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file by downscaling it to a maximum resolution
 * and converting it to JPEG with a specific quality setting.
 * Automatically handles EXIF orientation rotation.
 */
export const compressImage = async (file: File, maxWidth = 1080, quality = 0.7): Promise<string> => {
  try {
    const compressedFile = await compressImageToFile(file);
    
    // Convert back to base4 for our app's existing flow (some placeholders still use this)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => reject(error);
    });
  } catch (error) {
    console.error("Error compressing image:", error);
    throw error;
  }
};

export const compressImageToFile = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.1, 
    maxWidthOrHeight: 1024, 
    useWebWorker: false, // Disabled web worker to prevent potential hangs in some native WebViews
    initialQuality: 0.7,
    fileType: 'image/jpeg',
    exifOrientation: true as any,
  };
  return await imageCompression(file, options);
};
