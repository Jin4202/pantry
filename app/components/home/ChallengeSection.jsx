import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CenteredContainer from '../common/CenteredContainer';
import ChallengeCard from './ChallengeCard';

// Example dummy data for testing
const DUMMY_CHALLENGES = [
  { id: '1', title: "New User Challenge", description: "Cook a meal today!", participants: 5000, daysLeft: 100, badge: "Beginner Chef Badge", initialStatus: "in-progress" },
  { id: '2', title: "Fall Comfort Challenge", description: "Cook 3 cozy autumn meals this month", participants: 324, daysLeft: 12, badge: "Seasonal Chef Badge", initialStatus: "in-progress" },
  { id: '3', title: "Weekend Quick Cook", description: "Prepare a meal in under 30 minutes.", participants: 105, daysLeft: 3, badge: "Speed Chef Badge", initialStatus: "in-progress" },
];

const ChallengeSection = ({ challenges = DUMMY_CHALLENGES }) => {
  
  const renderItem = ({ item }) => (
    <View style={styles.cardWrapper}>
        <ChallengeCard challenge={item} />
    </View>
  );

  return (
    <CenteredContainer style={styles.sectionContainer}>
      <View style={styles.challengeHeader}> 
        <Text style={styles.challengeTitle}>Challenges</Text>
        <TouchableOpacity onPress={() => console.log('View All Challenges')}>
            <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* 2. CHALLENGE LIST */}
      <FlatList  
        data={challenges}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

    </CenteredContainer>
  );
};

const styles = StyleSheet.create({
    sectionContainer: { 
      marginVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: '#f4faffff',
      borderColor: '#adc2efff',
      borderWidth: 2,
      borderRadius: 12,
    },
    challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    challengeTitle: { fontSize: 16, fontWeight: '800', color: '#263d92ff', textTransform: 'uppercase' },
    viewAllText: { fontSize: 14, color: '#263d92ff', fontWeight: '600' },
    listContainer: { paddingRight: 16 },
    cardWrapper: { width: 325, marginRight: 12 }
});

export default ChallengeSection;