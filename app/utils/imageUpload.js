import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Alert, Platform } from 'react-native';
import { storage } from '../../firebaseConfig'; // Adjust the import path as needed

// --- Image Picker/Camera Logic ---
/**
 * Requests necessary permissions for the image picker/camera.
 * @param {'camera' | 'library'} type - The type of permission to request.
 * @returns {Promise<boolean>} - True if permission is granted, false otherwise.
 */
const requestPermissions = async (type) => {
  const permissionMethod =
    type === 'camera'
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
  
  const { status } = await permissionMethod();
  if (status !== 'granted') {
    Alert.alert('Permission needed', `Please allow access to your ${type} to continue.`);
    return false;
  }
  return true;
};

/**
 * Launches the image library or camera.
 * @param {'camera' | 'library'} type - The source to launch.
 * @returns {Promise<{uri: string, mimeType: string} | null>} - The image asset data or null if cancelled/failed.
 */
export const launchImagePicker = async (type) => {
  const isGranted = await requestPermissions(type);
  if (!isGranted) return null;

  const launchMethod =
    type === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
  
  const result = await launchMethod({
    mediaTypes: 'Images',
    allowsEditing: true,
    aspect: [4, 3], // You might want to make this configurable for profile vs. post
    quality: 0.7,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }
  
  const asset = result.assets[0];

  // HEIC/TIFF web check
  if (Platform.OS === 'web' && asset.mimeType && (asset.mimeType.includes('heic') || asset.mimeType.includes('tiff'))) {
    Alert.alert(
      "File Conversion Failed", 
      "This file type cannot be displayed in the web browser. Please convert the image to JPEG or PNG externally before uploading."
    );
    return null;
  }
  
  return {
    uri: asset.uri,
    mimeType: asset.mimeType || 'image/jpeg' // Default to jpeg if mimeType is null
  };
};

// --- Core Upload Logic ---

/**
 * Helper function to safely get the file extension.
 */
const getFileExtension = (uri, mimeType) => {
  const match = /\.(\w+)$/.exec(uri);
  if (match) return match[1].toLowerCase();
  if (mimeType) return mimeType.split('/').pop().toLowerCase();
  return 'jpg'; // Default to a safe format
};

/**
 * Uploads an image to Firebase Storage and returns the download URL.
 * @param {string} imageUri - The local URI of the image to upload.
 * @param {string} mimeType - The MIME type of the image.
 * @param {string} storagePath - The full path in Firebase Storage (e.g., 'users/{uid}/profile/photo.jpg').
 * @returns {Promise<string>} - The download URL of the uploaded image.
 */
export const uploadImageToFirebase = async (imageUri, mimeType, storagePath) => {
  // Validate and ensure we have a valid MIME type
  const validMimeType = mimeType || 'image/jpeg';
  
  // 1. Fetch the image and create a Blob
  const response = await fetch(imageUri);
  const blob = await response.blob(); 
  
  // 2. Determine the full filename with extension
  const extension = getFileExtension(imageUri, validMimeType);
  const fullPath = `${storagePath}.${extension}`;

  // 3. Upload to Firebase Storage with content type metadata
  const storageRef = ref(storage, fullPath);
  await uploadBytes(storageRef, blob, {
    contentType: validMimeType  // Fix: Explicitly set content type to prevent MIME error
  });
  
  // 4. Get the public download URL
  const url = await getDownloadURL(storageRef);
  
  return url;
};

export default {
  requestPermissions,
  launchImagePicker,
  getFileExtension,
  uploadImageToFirebase,
};
