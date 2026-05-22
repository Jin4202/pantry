// components/home/InitialSetupModal.jsx

import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import CenteredContainer from '../common/CenteredContainer';

// Define the two possible test groups
const TEST_GROUPS = ['Group A', 'Group B'];

const InitialSetupModal = ({ onSetupComplete }) => {
  const [selectedProfession, setSelectedProfession] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const userId = auth.currentUser?.uid;

  const options = [
    { label: 'Working Professional', value: 'professional' },
    { label: 'Student', value: 'student' },
  ];

  const handleSave = async () => {
    if (!userId || !selectedProfession) {
      Alert.alert('Please select your status before continuing.');
      return;
    }

    setIsSaving(true);
    const userRef = doc(db, 'users', userId);
    
    // Randomly assign the user to Group A or Group B
    const randomGroup = TEST_GROUPS[Math.floor(Math.random() * TEST_GROUPS.length)];

    try {
      await updateDoc(userRef, {
        userType: selectedProfession,
        profession: selectedProfession,
        abTestGroup: randomGroup,
      });
      
      console.log(`User setup complete. Status: ${selectedProfession}, Group: ${randomGroup}`);
      // Notify the parent component (HomeScreen) that setup is finished
      onSetupComplete(); 
    } catch (error) {
      console.error("Error saving initial user setup:", error);
      Alert.alert('Error', 'Failed to save setup. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.fullScreenContainer}>
    <CenteredContainer>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome to Pantry!</Text>
        <Text style={styles.subtitle}>
          To personalize your experience, please tell us your current status.
        </Text>

        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                selectedProfession === option.value && styles.optionSelected,
              ]}
              onPress={() => setSelectedProfession(option.value)}
              disabled={isSaving}
            >
              <Text style={[
                styles.optionText,
                selectedProfession === option.value && styles.textSelected,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleSave}
          disabled={!selectedProfession || isSaving}
        >
          <Text style={styles.continueButtonText}>
            {isSaving ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </CenteredContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#fff', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFF8F0', 
    padding: 30,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#ff4d2d',
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ff4d2d',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#4a4a4a',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ff4d2d',
    width: '48%',
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: '#ff4d2d',
    borderColor: '#ff4d2d',
  },
  optionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4d2d',
  },
  textSelected: {
    color: '#fff',
  },
  continueButton: {
    backgroundColor: '#000000d9',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InitialSetupModal;