import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CenteredContainer from '../common/CenteredContainer';

const WeeklyGoalSetter = ({ onSubmitGoal }) => {
  const [goal, setGoal] = useState('3'); // Default to 3, or read from saved data
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const numericGoal = parseInt(goal, 10);
    if (!isNaN(numericGoal) && numericGoal >= 3) { 
      onSubmitGoal(numericGoal);
    } else {
      console.warn("Please enter a valid positive number for your goal.");
      setError(`Your weekly goal must be at least 3 meals.`);
    }
  };

  return (
    <CenteredContainer style={styles.container}>
        <View style={styles.topRow}>
            <View style={styles.textGroup}>
                <Text style={styles.title}>Set Your Weekly Cooking Goal 🎯</Text>
                <Text style={styles.text}>How many meals do you want to cook this week?</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Set Goal</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.inputWrapper}>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                maxLength={2}
                value={goal}
                onChangeText={setGoal}
            />
            <Text style={styles.unit}>meals</Text>
        </View>
        {/* --- NEW ERROR DISPLAY --- */}
        {error ? (
            <Text style={styles.errorText}>{error}</Text>
        ) : null}
        {/* ------------------------- */}
    </CenteredContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFF2F0',
    borderColor: '#FFE0DB',
    borderWidth: 2,
    borderRadius: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    width: '100%', 
    marginBottom: 10,
  },
  textGroup: { flex: 1, paddingRight: 10 },
  title: { 
    fontSize: 16, 
    fontWeight: '800', 
    marginBottom: 6, 
    color: '#ff4d2d',
    textAlign: 'left', 
    width: '100%',
    textTransform: 'uppercase',
  },
  text: { 
    fontSize: 14, 
    color: '#4a4a4a', 
    marginBottom: 15, 
    textAlign: 'left', 
    width: '100%',
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
    alignSelf: 'center', 
  },
  input: {
    borderBottomWidth: 3,
    borderBottomColor: '#ff4d2d',
    fontSize: 45,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 70,
  },
  unit: { fontSize: 18, color: '#ff4d2d', fontWeight: '500' },
  button: {
    backgroundColor: '#111216',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'center', 
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' }, 
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 5,
  },
});

export default WeeklyGoalSetter;