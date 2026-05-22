import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import CenteredContainer from './CenteredContainer';

const PageHeader = () => {
  const router = useRouter();
  const user = auth.currentUser;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notificationsRef, where('read', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddFriend = () => {
    // Logic to open Add Friend modal
    console.log("Add Friend tapped");
  };

  const handleNotifications = () => {
    router.push('/notifications');
  };

  return (
    <CenteredContainer style={styles.header}>
      <Text style={styles.brand}>pantry</Text>
      <View style={styles.headerIcons}>
        <TouchableOpacity style={styles.iconButton} onPress={handleAddFriend}>
          <Ionicons name="person-add-outline" size={24} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleNotifications}>
          <Ionicons name="notifications-outline" size={24} color="#111" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </CenteredContainer>
  );
}

const styles = StyleSheet.create({
  header: { 
    paddingTop: 56, 
    paddingBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  brand: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#ff4d2d', 
    letterSpacing: 0.2 
  },
  headerIcons: { 
    flexDirection: 'row', 
    gap: 15 
  },
  iconButton: { 
    position: 'relative',
    padding: 4 
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default PageHeader;
