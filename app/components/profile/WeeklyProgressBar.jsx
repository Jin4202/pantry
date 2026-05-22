import { StyleSheet, Text, View } from 'react-native';

const WeeklyProgressBar = ({ currentWeekPosts = 0, weeklyGoal = 0 }) => {
  if (weeklyGoal <= 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noGoalText}>Set your weekly goal to track progress! 🎯</Text>
      </View>
    );
  }

  const rawPercentage = (currentWeekPosts / weeklyGoal) * 100;
  const clampedPercentage = Math.min(rawPercentage, 100);
  const progressBarWidth = `${clampedPercentage}%`;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>This Week's Progress</Text>
        <Text style={styles.progressText}>
          {currentWeekPosts} / {weeklyGoal} meals ({Math.floor(clampedPercentage)}%)
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: progressBarWidth }]}>
          {clampedPercentage === 100 }
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#f9f9f9', 
    borderRadius: 8,
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  noGoalText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  track: {
    height: 12,
    width: '100%',
    backgroundColor: '#e5e7eb', 
    borderRadius: 6,
    overflow: 'hidden', 
  },
  fill: {
    height: '100%',
    backgroundColor: '#34d399',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
});

export default WeeklyProgressBar;