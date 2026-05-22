import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import CommunityShareCheckboxes from './CommunityShareCheckboxes';

/**
 * Renders the meal logging UI, separating the view from the screen logic.
 * @param {object} props
 * @param {string | null} props.image - The URI of the selected image.
 * @param {string} props.caption - The current caption text.
 * @param {boolean} props.uploading - Whether an upload is currently in progress.
 * @param {function} props.setCaption - Handler to update caption state.
 * @param {function} props.pickImage - Handler to select image from library.
 * @param {function} props.takePhoto - Handler to take a photo with the camera.
 * @param {function} props.uploadPost - Handler to initiate the post upload.
 * @param {boolean} props.isPublished - Current published status (maps to isPublished).
 * @param {function} props.setIsPublished - Handler to toggle published status.
 * @param {Array<object>} props.userCommunities - List of communities to display.
 * @param {Array<string>} props.selectedCommunityIds - Community IDs currently selected.
 * @param {function} props.onToggleCommunity - Handler to toggle community selection.
 */
export default function LogForm({
  image,
  caption,
  uploading,
  setCaption,
  pickImage,
  takePhoto,
  uploadPost,
  clearImage,
  isPublished,
  setIsPublished,
  userCommunities,
  selectedCommunityIds,
  onToggleCommunity,
}) {
  const hasContent = !!image || caption.trim().length > 0;
  const isPostDisabled = !hasContent || uploading;

  // --- Image Picker/Preview Section ---
  const ImageSection = () => {
    if (image) {
      return (
        <View style={styles.imageContainer}>
          <Image key={image} source={{ uri: image }} style={styles.imagePreview} />
          <TouchableOpacity style={styles.changeImageBtn} onPress={clearImage}>
            <Text style={styles.changeImageText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
      );
    }

    {/* Image Preview or Picker Buttons */}
    return (
      <>
        <Text style={styles.label}>Photo</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity style={styles.pickerButton} onPress={takePhoto}>
            <Text style={styles.pickerIcon}>📷</Text>
            <Text style={styles.pickerText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerButton} onPress={pickImage}>
            <Text style={styles.pickerIcon}>🖼️</Text>
            <Text style={styles.pickerText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  const ButtonSelect = () => (
    <View style={styles.selectContainer}>
      {/* PUBLIC BUTTON */}
      <TouchableOpacity
        style={[
          styles.selectButton,
          isPublished && styles.selectButtonActive // Apply active style if selected
        ]}
        onPress={() => setIsPublished(true)}
      >
        <Text style={[
          styles.selectButtonText,
          isPublished && styles.selectButtonTextActive
        ]}>🌍 Public</Text>
      </TouchableOpacity>

      {/* PRIVATE BUTTON */}
      <TouchableOpacity
        style={[
          styles.selectButton,
          !isPublished && styles.selectButtonActive // Apply active style if NOT public (i.e., Private)
        ]}
        onPress={() => setIsPublished(false)}
      >
        <Text style={[
          styles.selectButtonText,
          !isPublished && styles.selectButtonTextActive
        ]}>🔒 Private</Text>
      </TouchableOpacity>
    </View>
  );
  

  return (
    <View>
      <ImageSection />

      {/* Caption Input */}
      <Text style={styles.label}>Caption</Text>
      <TextInput
        style={styles.captionInput}
        value={caption}
        onChangeText={setCaption}
        placeholder="What did you make today? Add some details!"
        placeholderTextColor="#A9A9A9"
        multiline
        maxLength={2000}
      />
      <Text style={styles.charCount}>{caption.length}/2000</Text>

      {/* Published/Private Selection */}
      <ButtonSelect />
      <Text style={styles.selectHint}>
        {isPublished 
          ? 'Your post will appear on the public feed.' 
          : 'Your post will only be visible to you (private log).'
        }
      </Text>
      
      {isPublished && (
        <CommunityShareCheckboxes
          userCommunities={userCommunities}
          selectedCommunityIds={selectedCommunityIds}
          onToggleCommunity={onToggleCommunity}
        />
      )}

      {/* Upload Button */}
      <TouchableOpacity
        style={[styles.uploadButton, isPostDisabled && styles.uploadButtonDisabled]}
        onPress={uploadPost}
        disabled={isPostDisabled}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadButtonText}>Log Meal</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>
        📸 Tip: Good lighting makes your meals look delicious!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Image Picker Styles
  pickerContainer: { gap: 12, marginBottom: 24 },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  pickerIcon: { fontSize: 20, marginRight: 16 },
  pickerText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  
  // Image Preview Styles
  imageContainer: { marginBottom: 24 },
  imagePreview: { width: '100%', height: 300, borderRadius: 12, marginBottom: 12 },
  changeImageBtn: { alignSelf: 'center' },
  changeImageText: { color: '#6b4eff', fontWeight: '600', fontSize: 14 },
  
  // Input Styles
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#374151' },
  captionInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: { textAlign: 'right', color: '#6b7280', fontSize: 12, marginTop: 4, marginBottom: 16 },
  
  // Button Styles
  uploadButton: {
    backgroundColor: '#ff4d2d',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#ff4d2d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  uploadButtonDisabled: { 
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0, 
  },
  uploadButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  hint: { color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 16 },

  // --- NEW BUTTON GROUP STYLES ---
  selectContainer: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  selectButtonActive: {
    backgroundColor: '#ff4d2d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  selectButtonText: { color: '#374151', fontWeight: '600', fontSize: 16 },
  selectButtonTextActive: { color: 'white', fontWeight: '700' },
  selectHint: { color: '#6b7280', fontSize: 14, marginBottom: 16 },
});

