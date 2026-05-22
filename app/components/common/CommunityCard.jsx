// CommunityCard.jsx
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CommunityCard = ({ item, userUid, handleAction, isMyCommunitiesView }) => {
    // Determine membership status
    const joined = item.memberUids.includes(userUid); 
    
    let actionElement;
    let actionHandler;
    
    if (isMyCommunitiesView) {
        actionHandler = () => handleAction('CommunityPage', { communityId: item.id, communityName: item.name });
        actionElement = (
            <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={24} />
            </View>
        ); 
    } else {
        actionHandler = () => handleAction(userUid, item.id, item.name, joined);
        actionElement = (
            <TouchableOpacity
                style={[styles.btn, { backgroundColor: joined ? '#e5e7eb' : '#ff4d2d' }]}
                onPress={actionHandler}
            >
                <Text style={{ color: joined ? '#111216' : 'white', fontWeight: '700' }}>
                    {joined ? 'Leave' : 'Join'}
                </Text>
            </TouchableOpacity>
        );
    }

    if (isMyCommunitiesView && !joined) return null;

    const CardContent = (
        <View style={styles.card}>
            <View style={styles.cardInfo}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{item.name}</Text>
                    <Text style={styles.memberCountMeta}>
                        {item.memberUids.length} members
                    </Text>
                </View>
                <Text style={styles.description}>{item.description}</Text> 
            </View>
            
            <TouchableOpacity onPress={actionHandler} disabled={!actionHandler}>
                {actionElement}
            </TouchableOpacity>
        </View>
    );

    if (isMyCommunitiesView) {
        return (
            <TouchableOpacity onPress={actionHandler}>
                {CardContent}
            </TouchableOpacity>
        );
    }

    return CardContent
};

export default CommunityCard;

const styles = StyleSheet.create({
  card: { 
    borderWidth: 1, 
    borderColor: '#eee', 
    padding: 16, 
    borderRadius: 12, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInfo: { flex: 1, marginRight: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '700', marginRight: 5 },
  memberCountMeta: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  description: { fontSize: 13, color: '#6b7280' },
  btn: { 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    borderRadius: 10, 
    minWidth: 70, 
    alignItems: 'center',
  },
  arrowContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '300',
  },
});