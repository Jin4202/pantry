import { signOut, updateProfile } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import logEvent from '../utils/analytics';

import CenteredContainer from '../components/common/CenteredContainer';
import LoadingView from '../components/common/LoadingView';
import PageHeader from '../components/common/PageHeader';
import TabBar from '../components/common/TabBar';
import ProfileCard from '../components/profile/ProfileCard';
import ProfileTabContent from '../components/profile/ProfileTabContent';
import JournalScreen from '../components/profile/screens/JournalScreen';
import PostDetailScreen from '../components/profile/screens/PostDetailScreen';
import SettingsScreen from '../components/profile/screens/SettingsScreen';
import WeeklyProgressBar from '../components/profile/WeeklyProgressBar';
import { evaluateUserBadges } from '../utils/badgeCalculations';
import { uploadImageToFirebase } from '../utils/imageUpload';


export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('Posts');
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [userBadges, setUserBadges] = useState({});
  const [recentJournalEntry, setRecentJournalEntry] = useState(null);
  const [showJournalScreen, setShowJournalScreen] = useState(false);

  const user = auth.currentUser;

  useEffect(() => logEvent("view_profile"), []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Listen to user profile changes in real-time
    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setUserBadges(data.badges || {});
        } else {
          console.log('No profile found');
          // Set default values if profile doesn't exist
          setUserData({
            displayName: user.displayName || 'Pantry User',
            email: user.email,
            streakCount: 0,
            communities: 0,
            photoCount: 0,
            friends: 0,
            badges: 0,
            createdAt: new Date(),
          });
          setUserBadges({});
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading profile:', error);
        setLoading(false);
        setUserBadges({});
      }
    );

    // Listen to user's posts in real-time
    const unsubPosts = onSnapshot(
      query(
        collection(db, 'feed'), // Query the central 'feed'
        where('uid', '==', user.uid), // Filter: ONLY posts belonging to this user
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(data);
      },
      (error) => {
        console.error('Error loading posts:', error);
        setPosts([]);
      }
    );

    // Listen to user's journal entries
    const unsubJournal = onSnapshot(
      query(
        collection(db, 'journals'), // Target the top-level 'journals' collection
        where('uid', '==', user.uid), // Filter: ONLY journals belonging to this user
        orderBy('createdAt', 'desc'), // Sort by newest first
        limit(1) // Get only the single most recent one
      ),
      (snapshot) => {
        if (!snapshot.empty) {
          setRecentJournalEntry({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } else {
          setRecentJournalEntry(null);
        }
      },
      (error) => {
        console.error('Error loading recent journal entry:', error);
        setRecentJournalEntry(null);
      }
    );

    return () => {
      unsubProfile();
      unsubPosts();
      unsubJournal();
    };
  }, [user]);

  useEffect(() => {
    if (!userData) return;

    const { updatedBadges, newlyUnlocked } = evaluateUserBadges(userData, userBadges);

    if (newlyUnlocked.length > 0) {
      setUserBadges(updatedBadges);
      updateDoc(doc(db, 'users', user.uid), { badges: updatedBadges });
    } 
  }, [userData]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowSettings(false); 
    } catch (e) {
      console.error('Sign out error:', e);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleSaveProfile = async ({ displayName, newPhotoAsset, currentPhotoURL }) => {
    if (!user) return; // Must be signed in to save
     
    let finalPhotoURL = currentPhotoURL;
    const trimmedName = displayName.trim();

    try {
      // 1. CONDITIONAL IMAGE UPLOAD
      // If there's a new asset, upload it first
      if (newPhotoAsset) {
        const storagePath = `users/${user.uid}/profile/photo`; 
        finalPhotoURL = await uploadImageToFirebase(
          newPhotoAsset.uri, 
          newPhotoAsset.mimeType, 
          storagePath
        );
        console.log("Photo uploaded successfully:", finalPhotoURL);
      }

      // 2. DEFINE FALLBACK/DEFAULT URL
      // If photo was changed, finalPhotoURL is the new URL. 
      // If photo was NOT changed, finalPhotoURL is currentPhotoURL.
      // If no photo URL exists at all, generate the avatar based on the (possibly new) displayName.
      if (!finalPhotoURL) {
          finalPhotoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=e5e7eb&color=6b7280z&length=1&bold=true`;
      }

      // 3. UPDATE FIREBASE AUTH AND FIRESTORE
      // Data to update in both places
      const updateData = { 
        displayName: trimmedName, 
        photoURL: finalPhotoURL
      };

      await updateProfile(user, updateData);
      await updateDoc(doc(db, 'users', user.uid), updateData);
      console.log("Success", "Your profile changes have been saved!");
      Alert.alert("Success", "Your profile changes have been saved!");

    } catch (e) {
      console.error("Error saving profile:", e);
      Alert.alert("Error", `Failed to save changes: ${e.message}`);
    }
  };

  const handleTogglePublish = async (post) => {
    if (!user) return;
    try {
      const postRef = doc(db, 'feed', post.id);
      const newStatus = !post.isPublished;
      
      await updateDoc(postRef, {
        isPublished: newStatus,
        publishedAt: newStatus ? serverTimestamp() : null 
      });

      const message = newStatus ? 'Post is now PUBLIC on the main feed!' : 'Post is now PRIVATE (archived to your Log).';
      Alert.alert('Success', message);

    } catch (e) {
      console.error('Failed to toggle publish status:', e);
      Alert.alert('Error', 'Could not update post status.');
    }
  };

  if (loading || !userData) {
    return <LoadingView text='Loading your profile...'/>;
  }

  if (selectedPost) {
    return (
      <PostDetailScreen 
        posts={posts} 
        postId={selectedPost.id}
        onClose={() => setSelectedPost(null)} 
        onTogglePublish={handleTogglePublish} 
      />
    );
  }

  if (showSettings) {
    return (
      <SettingsScreen 
        onSignOut={handleSignOut} 
        onClose={() => setShowSettings(false)} 
        userData={userData} 
        onSave={handleSaveProfile}
      />
    );
  }

  if (showJournalScreen) {
      return (
        <JournalScreen 
          onClose={() => setShowJournalScreen(false)} 
          userId={user.uid}
        />
      );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* AppHeader (Brand, Add Friend, Notifications) */}
      <PageHeader />
      <CenteredContainer>

        {/* Profile Card (Avatar, Stats, Sign Out) */}
        <ProfileCard
          userData={userData} 
          postsLength={posts.length} 
          recentJournalEntry={recentJournalEntry} 
          onJournalPress={() => setShowJournalScreen(true)}
          onSettingsPress={() => setShowSettings(true)} 
        />
  
        {/* Progress bar for user-set weekly goals */}
        <WeeklyProgressBar
          currentWeekPosts={userData.currentWeekPosts}
          weeklyGoal={userData.weeklyGoal}
        />

        {/* Tabs (Posts, Saved, Badges) */}
        <TabBar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          tabs={['Posts', 'Saved', 'Badges']}
        />

        {/* Content based on active tab */}
        <ProfileTabContent 
          activeTab={activeTab} 
          posts={posts} 
          onPostPress={setSelectedPost}
          userBadges={userBadges} 
        />

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </CenteredContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, backgroundColor: '#f9fafb' },
});
