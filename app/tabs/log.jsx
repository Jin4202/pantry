import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { auth, db } from '../../firebaseConfig';

import CenteredContainer from '../components/common/CenteredContainer';
import PageHeader from '../components/common/PageHeader';
import LogForm from '../components/log/LogForm';

import { logPostCreation } from '../utils/analyticsHelper';
import { evaluateUserBadges } from '../utils/badgeCalculations';
import { launchImagePicker, uploadImageToFirebase } from '../utils/imageUpload';

export default function LogScreen() {
  const [image, setImage] = useState(null);
  const [assetMimeType, setAssetMimeType] = useState(null);
  const [caption, setCaption] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCommunityIds, setSelectedCommunityIds] = useState([]);

  const [availableCommunities, setAvailableCommunities] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  const user = auth.currentUser;
  const router = useRouter();
  const params = useLocalSearchParams();
  const preSelectedCommunityId = params.preSelectedCommunityId;
  
  useEffect(() => {
    if (!user) {
      setLoadingCommunities(false);
      setAvailableCommunities([]);
      return;
    }

    setLoadingCommunities(true);
    
    const userRef = doc(db, 'users', user.uid);
    let unsubCommunityDetails = () => {};

    // 1. Listen to the user profile document
    const unsubUser = onSnapshot(userRef, async (userSnap) => {
      const joinedIds = userSnap.data()?.joinedCommunities || [];

      if (joinedIds.length > 0) {
        // 2. Query communities based ONLY on the joined IDs
        const q = query(
          collection(db, 'communities'), 
          where('__name__', 'in', joinedIds)
        );
        
        unsubCommunityDetails = onSnapshot(q, (querySnapshot) => {
          const communityDetails = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              memberUids: data.memberUids || [],
            };
          });
          setAvailableCommunities(communityDetails);
          setLoadingCommunities(false);
        }, (error) => {
          console.error("Error listening to community details:", error);
          setLoadingCommunities(false);
        });
        
      } else {
        // No communities joined
        unsubCommunityDetails(); // Clean up if it was running
        setAvailableCommunities([]);
        setLoadingCommunities(false);
      }
    }, (error) => {
        console.error("Error listening to user profile:", error);
        setLoadingCommunities(false);
    });

    // Clean up both listeners when the component unmounts
    return () => {
        unsubUser();
        unsubCommunityDetails();
    };

  }, [user]); // Only depends on the user object

  useEffect(() => {
    if (preSelectedCommunityId && selectedCommunityIds.length === 0 && availableCommunities.length > 0) {
        const isValidId = availableCommunities.some(comm => comm.id === preSelectedCommunityId);

        if (isValidId) {
          console.log(`SUCCESS: Auto-selecting community ID: ${preSelectedCommunityId}`);
          setSelectedCommunityIds([preSelectedCommunityId]);
        } else {
          console.log(`FAIL: ID ${preSelectedCommunityId} is not a valid community the user has joined.`);
        }
    }
  }, [preSelectedCommunityId, availableCommunities, selectedCommunityIds]);

  const launchPicker = async (type) => {
    const asset = await launchImagePicker(type); 
    if (asset) {
      setImage(asset.uri);
      setAssetMimeType(asset.mimeType);
    }
  };

  const pickImage = async () => await launchPicker('library');
  const takePhoto = async () => await launchPicker('camera');
  const clearImage = () => {
    setImage(null);
    setAssetMimeType(null);
  };

  // --- Community Select Handler ---
  const onToggleCommunity = (id) => {
    setSelectedCommunityIds(prev => 
      prev.includes(id) 
        ? prev.filter(cid => cid !== id) // Remove if already selected
        : [...prev, id] // Add if not selected
    );
  };

  // --- Core Upload Logic ---
  const uploadPost = async () => {
    const hasContent = !!image || caption.trim().length > 0;
    if (!hasContent) {
      Alert.alert('Missing content', 'Please add a photo or a caption.');
      return;
    }

    if (!user) return;

    let url = null;

    try {
      setUploading(true);

      // 1. Prepare Post ID + storage path
      const newPhotoRef = doc(collection(db, 'feed'));
      const postId = newPhotoRef.id; // Define postId BEFORE it is used for the storagePath
      
      if (image) {
        const storagePath = `users/${user.uid}/photos/${postId}`; 
        url = await uploadImageToFirebase(image, assetMimeType, storagePath); // <-- Assign URL here
      }

      // 3. Build post data
      const postData = {
        id: postId,
        uid: user.uid,
        url: url,
        displayName: user.displayName,
        displayPhoto: user.photoURL,
        caption: caption.trim() || '',
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        isPublished: isPublished, 
        communityIds: selectedCommunityIds,
      };

      // 4. Write post
      await setDoc(newPhotoRef, postData);

      // 5. Update user's profile with last post time 
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastPostAt: serverTimestamp(),
      });

      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      if (userData) {
        const currentBadges = userData.badges || {};
        const { updatedBadges, newlyUnlocked } = evaluateUserBadges(userData, currentBadges);

        if (newlyUnlocked.length > 0) {
          await updateDoc(userRef, { badges: updatedBadges });
          // Simple alert for new badges
          Alert.alert(
            'New badge unlocked! 🎉',
            `You earned: ${newlyUnlocked.join(', ')}`
          );
        }

        const userGroup = userData.abTestGroup;
        if (userGroup) {
          logPostCreation(userGroup);
        }
      }

      // // Success!
      // Alert.alert('Posted!', 'Your meal has been logged.', [
      //   { text: 'OK', onPress: () => {
      //     setImage(null);
      //     setCaption('');
      //     setIsPublished(true);
      //     setSelectedCommunityIds([]);
      //     router.setParams({ preSelectedCommunityId: null });
      //   }}
      // ]);

      setImage(null);
      setCaption('');
      setIsPublished(true);
      setSelectedCommunityIds([]);
      router.setParams({ preSelectedCommunityId: null });

    } catch (e) {
      console.error('Upload error:', e);
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <PageHeader />
      <CenteredContainer>
        <Text style={styles.title}>Log a Meal</Text>
        <LogForm 
          image={image}
          caption={caption}
          isPublished={isPublished}
          uploading={uploading}
          setCaption={setCaption}
          setIsPublished={setIsPublished}
          pickImage={pickImage}
          takePhoto={takePhoto}
          uploadPost={uploadPost}
          clearImage={clearImage}
          userCommunities={availableCommunities}
          selectedCommunityIds={selectedCommunityIds}
          onToggleCommunity={onToggleCommunity}
        />
      </CenteredContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
});
