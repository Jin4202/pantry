import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import notificationService from '../../../services/notificationService';
import webNotificationService from '../../../services/webNotificationService';
import { launchImagePicker } from '../../../utils/imageUpload';
import CenteredContainer from '../../common/CenteredContainer';

/**
 * Settings Screen component.
 * @param {function} onSignOut - The function to execute the Firebase sign-out.
 * @param {function} onClose - The function to navigate back to the Profile screen.
 * @param {function} onSave - The function to save profile changes (display name/photoURL string).
 * @param {object} userData - User profile data (displayName, photoURL, email).
 */
export default function SettingsScreen({ onSignOut, onClose, userData, onSave }) {
  // --- STATE FOR PROFILE MANAGEMENT (FROM FILE 1) ---
  const [displayName, setDisplayName] = useState(userData.displayName || '');
  const [photoURL, setPhotoURL] = useState(userData.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [newPhotoAsset, setNewPhotoAsset] = useState(null);

  // --- STATE FOR NOTIFICATION SETTINGS (FROM FILE 2) ---
  const [settings, setSettings] = useState({
    dailyReminders: true,
    reminderTime: '09:00', // Time setting removed from UI to keep simple, but kept in state logic
    friendActivity: true,
    webNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState('unknown');

  const auth = getAuth();
  const user = auth.currentUser;
  const isWeb = Platform.OS === 'web';

  // --- EFFECTS FOR NOTIFICATION SETTINGS (FROM FILE 2) ---
  useEffect(() => {
    loadSettings();
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = () => {
    if (isWeb && webNotificationService.isSupported()) {
      const status = webNotificationService.getPermissionStatus();
      setNotificationStatus(status);
    }
  };

  const loadSettings = async () => {
    try {
      if (!user) return;
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      if (userData?.notificationSettings) {
        setSettings(userData.notificationSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCTIONS FOR PROFILE MANAGEMENT (FROM FILE 1) ---
  const confirmSignOut = () => {
    // Alerts don't work on web, so if on web, just sign out
    if (Platform.OS === 'web') {
      onSignOut();
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: onSignOut, // Execute the sign-out handler passed from the parent
      }
    ]);
  };

  const handleChangePhoto = async (type) => {
    const asset = await launchImagePicker(type, [1, 1]);
    if (asset) {
      setPhotoURL(asset.uri);  // 1. Set the photoURL state to the local URI for preview
      setNewPhotoAsset(asset); // 2. Store the full asset for upload upon 'Save'
    }
  };

  const handleSave = async () => {
    if (isSaving || loading) return; // Disable save while saving or loading
        
    // 1. Basic Validation: Determine if anything has actually changed
    const displayNameChanged = displayName.trim() !== userData.displayName;
    const photoChanged = newPhotoAsset !== null; // Check if we have a new asset to upload

    if (!displayNameChanged && !photoChanged) {
      Alert.alert("No Changes", "You haven't made any changes to save.");
      return;
    }

    if (!displayName.trim()) {
      Alert.alert("Error", "Display Name cannot be empty.");
      return;
    }

    setIsSaving(true);

    // 2. Pass the new data up to the parent handler
    await onSave({ displayName: displayName.trim(), newPhotoAsset: newPhotoAsset, currentPhotoURL: userData.photoURL });
        
    // 3. Clear the asset after a successful save
    setNewPhotoAsset(null);
    setIsSaving(false);
  };

  // --- FUNCTIONS FOR NOTIFICATION SETTINGS (FROM FILE 2) ---

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      if (!user) return;
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);

      // Save to Firebase
      await setDoc(userRef, { notificationSettings: newSettings }, { merge: true });

      if (isWeb) {
        // Web logic (simplified: webNotificationService.updateSettings logic replaced by direct setDoc above)
      } else {
        // Mobile logic
        // Reschedule notifications if daily reminder settings changed (mobile only)
        if (key === 'dailyReminders' || key === 'reminderTime') {
          if (newSettings.dailyReminders) {
            const [hour, minute] = newSettings.reminderTime.split(':').map(Number);
            await notificationService.scheduleDailyReminder(hour, minute);
          } else {
            await notificationService.cancelAllScheduledNotifications();
          }
        }
      }
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      if (isWeb) {
        // Web notification flow
        if (!webNotificationService.isSupported()) {
          Alert.alert('Unsupported', 'Web notifications are not supported in this browser');
          return;
        }

        const { status, token } = await webNotificationService.requestPermission();

        if (status === 'granted' && token) {
          await webNotificationService.registerToken(user.uid, token);
          setNotificationStatus('granted');
          Alert.alert('Success', 'Web notifications enabled! You will now receive push notifications.');
        } else if (status === 'denied') {
          setNotificationStatus('denied');
          Alert.alert('Denied', 'Notification permission denied. Please enable notifications in your browser settings.');
        } else {
          Alert.alert('Attention', 'Please allow notifications when prompted by your browser.');
        }
      } else {
        // Mobile notification flow
        const { status, token } = await notificationService.requestPermissions();

        if (status === 'granted' && token) {
          await notificationService.registerToken(user.uid, token);
          Alert.alert('Success', 'Notifications enabled!');
        } else {
          Alert.alert('Denied', 'Please enable notifications in your device settings');
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      Alert.alert('Error', 'Failed to enable notifications. Please try again.');
    }
  };


  if (loading) {
    return (
      <CenteredContainer>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ marginTop: 10, fontSize: 16, color: '#6b7280' }}>Loading settings...</Text>
      </CenteredContainer>
    );
  }

  // --- RENDER COMBINED COMPONENT ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <CenteredContainer>
        {/* Header */}
        <View style={styles.pageTitle}>
          <TouchableOpacity style={styles.backButtonContainer} onPress={onClose}>
            <Ionicons name="chevron-back" size={20} color="#111" />
            <Text style={styles.title}>Settings</Text>
          </TouchableOpacity>
        </View>
      </CenteredContainer>

      <ScrollView showsVerticalScrollIndicator={false}>
        <CenteredContainer>
          {/* 1. Profile Information */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            <View style={styles.profileInfoLayout}>
              {/* Profile Photo (Left Side) */}
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: photoURL }} style={styles.largeAvatar} />

                {/* Change Photo Button - Aligned with the avatar */}
                <TouchableOpacity style={styles.changePhotoButton}
                  onPress={() => handleChangePhoto('library')}
                >
                  <Ionicons name="camera-outline" size={18} color="#111" />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Display Name / Username (Right Side) */}
              <View style={styles.displayNameBlock}>
                <TextInput
                  style={styles.nameInput}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Display name"
                  placeholderTextColor="#A9A9A9"
                />
                <Text style={styles.usernameLabel}>Username: @{userData.email.split('@')[0]}</Text>
              </View>
            </View>
          </View>

          {/* 2. User Information (File 1) */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Account Details</Text>

            {/* Email (Read Only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.settingText}>Email</Text>
              <TextInput
                style={styles.readOnlyInput}
                value={userData.email}
                editable={false}
              />
            </View>

            {/* Password (Read Only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.settingText}>Password</Text>
              <TextInput
                style={styles.readOnlyInput}
                value={'••••••••'}
                secureTextEntry={true}
                editable={false}
              />
            </View>
          </View>

          {/* 3. Notification Settings (File 2 Content, File 1 Style) */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Notifications</Text>

            {/* Web-specific notification toggle (Conditionally rendered) */}
            {isWeb && (
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingText}>Web Push Notifications</Text>
                  {notificationStatus === 'granted' && (
                    <Text style={[styles.statusLabel, styles.statusGranted]}>✓ Enabled</Text>
                  )}
                  {notificationStatus === 'denied' && (
                    <Text style={[styles.statusLabel, styles.statusDenied]}>✗ Denied - Check browser settings</Text>
                  )}
                </View>
                <Switch
                  value={settings.webNotifications}
                  onValueChange={(value) => updateSetting('webNotifications', value)}
                  disabled={notificationStatus === 'denied'}
                />
              </View>
            )}
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingText}>Daily Reminders</Text>
              </View>
              <Switch
                value={settings.dailyReminders}
                onValueChange={(value) => updateSetting('dailyReminders', value)}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingText}>Friend Activity</Text>
              </View>
              <Switch
                value={settings.friendActivity}
                onValueChange={(value) => updateSetting('friendActivity', value)}
              />
            </View>

            {/* Request Permissions Button */}
            <TouchableOpacity
              style={[styles.actionButton, { marginTop: 10, borderColor: '#a2decaff', backgroundColor: '#ecfdf5' }]}
              onPress={requestNotificationPermissions}
            >
              <Text style={[styles.actionButtonText, { color: '#10b981' }]}>
                {isWeb ? 'Check/Enable Web Notifications' : 'Check/Enable Push Notifications'}
              </Text>
            </TouchableOpacity>

          </View>

          {/* Save Button (File 1) */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={24} color="#10b981" />
                <Text style={styles.saveButtonText}>Save Profile Changes</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Logout Button (File 1) */}
          <TouchableOpacity style={styles.logoutButton} onPress={confirmSignOut}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </CenteredContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 24 },
  pageTitle: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'left', paddingBottom: 20 },
  backButtonContainer: { flexDirection: 'row', alignItems: 'center', paddingRight: 15 },
  title: { paddingLeft: 10, fontSize: 20, fontWeight: '500', color: '#111' },

  sectionCard: {
    backgroundColor: 'white',
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  sectionTitle: { marginBottom: 20, fontSize: 18, color: '#111', fontWeight: '500' },
  settingText: { fontSize: 16, color: '#111', fontWeight: '500' }, // Adjusted for use in Switch rows

  profileInfoLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginRight: 20,
  },
  largeAvatar: {
    width: 120, // Reduced size slightly for better fit with other sections
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  changePhotoButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
    paddingVertical: 8, paddingHorizontal: 15,
  },
  changePhotoText: { marginLeft: 5, fontWeight: '600', color: '#111', fontSize: 14 },
  displayNameBlock: { flex: 1 },
  nameInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111',
    marginBottom: 8,
    fontWeight: '500',
  },
  usernameLabel: { marginLeft: 5, fontSize: 14, color: '#6b7280' },

  // Input Group for Email/Password
  inputGroup: { marginBottom: 15 },
  readOnlyInput: {
    backgroundColor: '#f3f4f6', // Lighter background for read-only
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    fontSize: 16,
    color: '#939497ff', // Grayed text
    fontWeight: '500',
  },

  // Notification Settings Row Styling (adapted from File 2 to File 1 style)
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 5,
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  statusLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
    marginLeft: 0,
  },
  statusGranted: { color: '#10b981' },
  statusDenied: { color: '#ef4444' },

  // Action Button for Permissions (File 1 Style)
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    // Note: Colors are handled inline for the specific action button
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },

  // Save Button (File 1)
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginBottom: 20,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#a2decaff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  saveButtonText: { marginLeft: 10, fontSize: 16, color: '#10b981', fontWeight: '700' },

  // Logout Button (File 1)
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginBottom: 20,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#fca5a5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  logoutText: { marginLeft: 10, fontSize: 16, color: '#ef4444', fontWeight: '700' },
});