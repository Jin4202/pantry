import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import CenteredContainer from '../common/CenteredContainer';

const FriendActivityCard = () => {
  const router = useRouter();
  const user = auth.currentUser;
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendsList, setFriendsList] = useState([]);

  useEffect(() => {
    if (!user) return;

    // First, get user's friends list
    const friendsRef = collection(db, 'users', user.uid, 'friends');
    const unsubFriends = onSnapshot(friendsRef, (snap) => {
      const friends = snap.docs.map(d => d.id);
      setFriendsList(friends);
      
      if (friends.length > 0) {
        // Subscribe to feed items from friends
        const feedQuery = query(
          collection(db, 'feed'),
          where('uid', 'in', friends.slice(0, 10)), // Firestore 'in' limited to 10
          orderBy('createdAt', 'desc')
        );
        
        const unsubFeed = onSnapshot(feedQuery, (snap) => {
          const items = [];
          snap.forEach(d => items.push({ id: d.id, ...d.data() }));
          setActivities(items.slice(0, 5)); // Show latest 5
          setLoading(false);
        }, () => {
          setLoading(false);
        });

        return () => unsubFeed();
      } else {
        setLoading(false); // Ensure loading is set to false if no friends
      }
    });

    return () => unsubFriends();
  }, [user]);

  const formatTime = (timestamp) => {
    if (!timestamp?.seconds) return '';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <CenteredContainer style={styles.card}>
        <Text style={styles.title}>Friend Activity</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#ff4d2d" />
        </View>
      </CenteredContainer>
    );
  }

  const hasFriends = friendsList.length > 0;

  return (
    <CenteredContainer style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="people" size={20} color="#ff4d2d" />
          <Text style={styles.title}>Friend Activity</Text>
        </View>
        {hasFriends && activities.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/tabs/friends')}>
            <Text style={styles.viewMore}>View More</Text>
          </TouchableOpacity>
        )}
      </View>

      {!hasFriends || activities.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="people-outline" size={32} color="#9ca3af" />
          </View>
          <Text style={styles.emptyTitle}>No updates yet</Text>
          <Text style={styles.emptySubtext}>
            {hasFriends ? 'Your friends haven\'t posted recently' : 'Add or invite friends to see their activity!'}
          </Text>
          <TouchableOpacity 
            style={styles.findFriendsBtn}
            onPress={() => router.push('/tabs/find-friends')}
          >
            <Text style={styles.findFriendsText}>Find Friends</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.activityList}>
          {activities.map(activity => (
            <TouchableOpacity key={activity.id} style={styles.activityItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(activity.userDisplay || 'PM').split(' ').map(s => s[0]).join('').slice(0, 2)}
                </Text>
              </View>
              {activity.type === 'photo' && activity.url ? (
                <Image source={{ uri: activity.url }} style={styles.thumbnail} />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.activityUser}>{activity.userDisplay || 'Friend'}</Text>
                <Text style={styles.activityText} numberOfLines={2}>
                  {activity.text || 'shared a cooking photo'}
                </Text>
                <Text style={styles.activityTime}>{formatTime(activity.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </CenteredContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111216',
  },
  viewMore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b4eff',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111216',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  findFriendsBtn: {
    backgroundColor: '#111216',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  findFriendsText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700',
    fontSize: 12,
    color: '#111216',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  activityUser: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111216',
    marginBottom: 2,
  },
  activityText: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
});

export default FriendActivityCard;