import { StyleSheet, Text } from 'react-native';
import { auth } from '../../../firebaseConfig';
import CenteredContainer from '../common/CenteredContainer';

const PersonalGreeting = () => {
  const user = auth.currentUser;
  const firstName = user?.displayName?.split(' ')[0] || 'Chef';
  
  const formatDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();
    
    return `${dayName}, ${monthName} ${date}, ${year}`;
  };

  return (
    <CenteredContainer>
      <Text style={styles.greeting}>What's cooking today, {firstName}?</Text>
      <Text style={styles.date}>{formatDate()}</Text>
    </CenteredContainer>
  );
};

const styles = StyleSheet.create({
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111216',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default PersonalGreeting;