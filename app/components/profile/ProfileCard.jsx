import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const getDate = (createdAt, type) => {
    if (!createdAt && type == 'join') return 'Recently';
    if (!createdAt && type == 'journal') return '';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt); 

    if (type == 'join') {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// We pass all necessary data and the sign-out handler as props
const ProfileCard = ({ userData, postsLength, recentJournalEntry, onJournalPress, onSettingsPress }) => {
    const joinDate = getDate(userData?.createdAt, 'join');
    const hasEntry = !!recentJournalEntry;
    const previewText = hasEntry 
        ? recentJournalEntry.text.substring(0, 50) + (recentJournalEntry.text.length > 50 ? '...' : '')
        : 'Start journaling today!';
    const journalDate = hasEntry ? getDate(recentJournalEntry.createdAt, 'journal') : '';

    const badgeCount = userData?.badges ? Object.keys(userData.badges).length : 0;
    const joinedCommunitiesCount = userData?.joinedCommunities?.length ?? 0;

    return (
        <View style={styles.profileCard}>
            {/* Avatar & Name Section */}
            <View style={styles.profileHeader}>
                <Image source={{ uri: userData.photoURL }} style={styles.avatar} />
                <View style={styles.profileInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.displayName}>{userData?.displayName || 'Pantry User'}</Text>
                        <TouchableOpacity onPress={onSettingsPress}>
                            <Ionicons name="settings-outline" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.bio}>
                        Cooking enthusiast · Member since {joinDate}
                    </Text>
                    <View style={styles.socialStats}>
                        <Text style={styles.socialText}>
                            <Text style={styles.socialNumber}>{userData?.friends || 0}</Text> friends
                        </Text>
                        <Text style={styles.socialText}>
                            <Text style={styles.socialNumber}>{joinedCommunitiesCount}</Text> communities
                        </Text>
                    </View>
                </View>
            </View>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                    <View style={styles.statIconRow}>
                        <Ionicons name="calendar-outline" size={20} color="#111" />
                        <Text style={styles.statNumber}>{postsLength}</Text>
                    </View>
                    <Text style={styles.statLabel}>Meals</Text>
                </View>
                <View style={styles.statBox}>
                    <View style={styles.statIconRow}>
                        <Ionicons name="trending-up" size={20} color="#10b981" />
                        <Text style={styles.statNumber}>{userData?.streakCount || 0}</Text>
                    </View>
                    <Text style={styles.statLabel}>Streaks</Text>
                </View>
                <View style={styles.statBox}>
                    <View style={styles.statIconRow}>
                        <Ionicons name="trophy" size={20} color="#f59e0b" />
                        <Text style={styles.statNumber}>{badgeCount}</Text>
                    </View>
                    <Text style={styles.statLabel}>Badges</Text>
                </View>
            </View>
            {/* Journal Entries Preview */}
            <TouchableOpacity 
                style={styles.journalPreviewContainer}
                onPress={onJournalPress}
                activeOpacity={0.7}
            >
                <Ionicons 
                    name={"journal-outline"} 
                    size={22} 
                    color={"#6b7280"} 
                    style={styles.journalIcon}
                />
                
                <View style={styles.journalTextContent}>
                    <Text style={styles.journalTitle}>
                        {hasEntry ? recentJournalEntry.title || "Recent Journal Entry" : "Start Your Food Journal"}
                    </Text>
                    <Text style={styles.journalPreviewText} numberOfLines={1}>
                        {hasEntry ? previewText : "Track meals, thoughts, and progress privately."}
                    </Text>
                </View>

                <View style={styles.journalArrowContainer}>
                    {hasEntry && <Text style={styles.journalDate}>{journalDate}</Text>}
                    <Ionicons name="chevron-forward-outline" size={22} color="#9ca3af" />
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    profileCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    profileHeader: { flexDirection: 'row', marginBottom: 20 },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginRight: 16
    },
    profileInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    displayName: { fontSize: 20, fontWeight: '700', color: '#111' },
    bio: { fontSize: 13, color: '#6b7280', marginTop: 4, marginBottom: 8 },
    socialStats: { flexDirection: 'row', gap: 16 },
    socialText: { fontSize: 13, color: '#6b7280' },
    socialNumber: { fontWeight: '600', color: '#111' },
    
    // Stats Grid
    statsGrid: { flexDirection: 'row', gap: 12 },
    statBox: { flex: 1, alignItems: 'center', paddingVertical: 12 },
    statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    statNumber: { fontSize: 24, fontWeight: '700', color: '#111' },
    statLabel: { fontSize: 12, color: '#6b7280' },

    // Journal Entries Preview
    journalPreviewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1, 
        borderTopColor: '#f3f4f6', 
        marginTop: 12, 
    },
    journalIcon: { marginRight: 12 },
    journalTextContent: { flex: 1, justifyContent: 'center', marginRight: 8 },
    journalTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
    journalPreviewText: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    journalArrowContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    journalDate: { fontSize: 13, color: '#9ca3af', marginRight: 4 },
});

export default ProfileCard;
