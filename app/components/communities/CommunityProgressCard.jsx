import { StyleSheet, Text, View } from 'react-native';

const CommunityProgressCard = ({ totalMembers, membersCooked}) => {
    const progressPercentage = (membersCooked / totalMembers) * 100;

    return (
        <View style={styles.overviewCard}>            
            <View style={styles.progressTop}>
                <Text style={styles.progressLabel}>This Week's Progress</Text>
                <Text style={styles.progressText}>
                    {membersCooked}/{totalMembers}
                </Text>
            </View>
            <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressSubtitle}>
                {progressPercentage.toFixed(0)}% of community cooked this week!
            </Text>
        </View>
    );
};

export default CommunityProgressCard;

const styles = StyleSheet.create({
    overviewCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginVertical: 15,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    progressTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },
    progressBarBackground: {
        height: 10,
        backgroundColor: '#e5e7eb',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 5,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#10b981', // Green color
        borderRadius: 5,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
        textAlign: 'right',
    },
    progressSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'right',
    },
});