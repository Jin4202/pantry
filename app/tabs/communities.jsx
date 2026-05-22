import { Ionicons } from '@expo/vector-icons';
import { addDoc, arrayUnion, collection, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

import CenteredContainer from '../components/common/CenteredContainer';
import CommunityCard from '../components/common/CommunityCard';
import LoadingView from '../components/common/LoadingView';
import PageHeader from '../components/common/PageHeader';
import CommunityScreen from '../components/communities/CommunityScreen';

const showToast = (message) => console.log('TOAST SUCCESS:', message);
const showErrorToast = (message) => console.error('TOAST ERROR:', message);

// Function to join community using the invite code
const joinCommunityByCode = async (inviteCode, userId) => {
  const communityQuery = query(
    collection(db, 'communities'),
    where('inviteCode', '==', inviteCode.trim())
  );

  const snapshot = await getDocs(communityQuery);

  if (snapshot.empty) {
    showErrorToast('Invalid or expired invite code.');
    throw new Error('Invalid or expired invite code.');
  }

  const communityDoc = snapshot.docs[0];
  const communityId = communityDoc.id;
  const communityName = communityDoc.data().name;
  
  const communityRef = doc(db, 'communities', communityId);
  const userRef = doc(db, 'users', userId);

  await updateDoc(communityRef, {
    memberUids: arrayUnion(userId) 
  });

  await updateDoc(userRef, {
    joinedCommunities: arrayUnion(communityId)
  });

  return { success: true, communityId: communityId, communityName: communityName };
};

// This modal will handle creating new communities
const NewCommunityModal = ({ isVisible, onClose, onSave, userId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing Info", "Please provide both a title and a description.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ 
        title: title.trim(),
        description: description.trim(), 
        userId: userId, 
        isPublic: isPublic, 
      });
      setTitle('');
      setDescription('');
      setIsPublic(true);
      onClose();
    } catch (error) {
      console.error("Error saving community:", error);
      Alert.alert("Save Error", "Could not save your community. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const ButtonSelect = () => (
    <View style={modalStyles.selectContainer}>
      {/* PUBLIC BUTTON */}
      <TouchableOpacity
        style={[
          modalStyles.selectButton,
          isPublic && modalStyles.selectButtonActive // Apply active style if selected
        ]}
        onPress={() => setIsPublic(true)}
      >
        <Text style={[
          modalStyles.selectButtonText,
          isPublic && modalStyles.selectButtonTextActive
        ]}>🌍 Public</Text>
      </TouchableOpacity>

      {/* PRIVATE BUTTON */}
      <TouchableOpacity
        style={[
          modalStyles.selectButton,
          !isPublic && modalStyles.selectButtonActive // Apply active style if NOT public (i.e., Private)
        ]}
        onPress={() => setIsPublic(false)}
      >
        <Text style={[
          modalStyles.selectButtonText,
          !isPublic && modalStyles.selectButtonTextActive
        ]}>🔒 Private</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
    
      <View style={modalStyles.modalBackdrop}>
        <CenteredContainer style={modalStyles.topContentWrapper}>
          <View style={modalStyles.modalContainer}>

            {/* Header */}
            <View style={modalStyles.header}>
              <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                <Ionicons name="close" size={28} color="#111216" />
              </TouchableOpacity>
              <Text style={modalStyles.headerTitle}>New Community</Text>
              <TouchableOpacity onPress={handleSave} style={modalStyles.saveButton} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={modalStyles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Title */}
            <TextInput
              style={modalStyles.titleInput}
              placeholder="Community Name"
              placeholderTextColor="#A9A9A9"
              value={title}
              onChangeText={setTitle}
              maxLength={100} 
            />

            {/* Description */}
            <TextInput
              style={modalStyles.bodyInput}
              placeholder="What's your community about?"
              placeholderTextColor="#A9A9A9"
              value={description}
              onChangeText={setDescription}
              multiline={true}
              textAlignVertical="top" 
              maxLength={100}
            />

            {/* Public/Private Toggle */}
            <View style={modalStyles.toggleContainer}>
              <Text style={modalStyles.toggleLabel}>Visibility: {isPublic ? 'Public' : 'Private'}</Text>
              <ButtonSelect />
            </View>

          </View>
        </CenteredContainer>
      </View>
    </Modal>
  );
};

// Modal for entering the invite code
const JoinByCodeModal = ({ isVisible, onClose, onJoin, userId }) => {
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      showErrorToast("Please enter an invite code.");
      return;
    }
    setJoining(true);
    try {
      const result = await onJoin(code.trim(), userId);
      showToast(`Welcome to ${result.communityName}!`);
      setCode('');
      onClose();
    } catch (error) {
      console.log("error joining community:", error.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalBackdrop}>
        <View style={joinCodeModalStyles.container}>
          <Text style={modalStyles.headerTitle}>Join Private Community</Text>
          <Text style={joinCodeModalStyles.label}>Enter Invite Code</Text>
          <TextInput
            style={joinCodeModalStyles.input}
            placeholder="e.g., A8P5RTx2"
            placeholderTextColor="#A9A9A9"
            value={code}
            onChangeText={(text) => setCode(text)}
            autoCapitalize="characters"
            editable={!joining}
          />

          <TouchableOpacity 
            onPress={handleJoin} 
            style={[modalStyles.saveButton, joinCodeModalStyles.joinButton]}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={modalStyles.saveButtonText}>Join Community</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onClose} style={joinCodeModalStyles.closeButton}>
            <Text style={joinCodeModalStyles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function CommunitiesScreen() {
  const user = auth.currentUser;
  const [allCommunities, setAllCommunities] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showNewCommunityModal, setShowNewCommunityModal] = useState(false);
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }

    // Listen to ALL communities (public or private) to track membership
    const unsub = onSnapshot(collection(db, 'communities'), (snap) => {
      const communityArr = [];
      snap.forEach((d) => {
        const data = d.data();
        communityArr.push({ 
            id: d.id, 
            ...data,
            memberUids: data.memberUids || [],
        });
      });
      setAllCommunities(communityArr);
      setLoading(false);
    }, (error) => {
        console.error("Error listening to communities:", error);
        setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleSaveNewCommunity = async ({ title, description, userId, isPublic }) => {
    try {
      const newCommunityRef = doc(collection(db, 'communities'));
      const uniqueId = newCommunityRef.id;
      const code = isPublic ? null : uniqueId;

      await addDoc(collection(db, 'communities'), {
        creatorId: userId,
        name: title,
        description: description,
        createdAt: serverTimestamp(),
        isPublic: isPublic,
        memberUids: [userId],
        adminUids: [userId],
        inviteCode: code,
      });
      console.log("Community  saved successfully!");
      setShowNewCommunityModal(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      throw error;
    }
  };

  const handleCardPress = (communityId) => {
    const community = allCommunities.find(c => c.id === communityId);

    if (community) {
      setSelectedCommunity(community); 
    } else {
      console.error(`Community not found for ID: ${communityId}`);
    }
  };

  // Filter the list to show only communities the user is a member of
  const myCommunities = allCommunities.filter(c => c.memberUids.includes(user.uid));

  const renderCommunities = ({ item }) => {
    return (
      <CenteredContainer>
        <CommunityCard
          item={item}
          userUid={user?.uid} 
          handleAction={() => handleCardPress(item.id)}
          isMyCommunitiesView={true} 
        />
      </CenteredContainer>
    );
  };

  if (loading) {
    return <LoadingView text="Loading your communities..." />;
  }

  if (selectedCommunity) {
    return (
      <CommunityScreen 
        community={selectedCommunity}
        onClose={() => setSelectedCommunity(null)} 
        currentUserId={user.uid}
      />
    );
  }

  return (
    <View style={styles.screenContainer}>
      <PageHeader />

      <CenteredContainer>
        <View style={styles.headerContainer}> 
          <Text style={styles.myCommunitiesTitle}>My Communities</Text>
          <TouchableOpacity 
            style={styles.plusButton} 
            onPress={() => setShowNewCommunityModal(true)}
          >
            <Ionicons name="add-circle" size={30} color="#ff4d2d" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.subHeaderContainer} 
          onPress={() => setShowJoinByCodeModal(true)}
        >
          <Ionicons name="lock-closed" size={16} color="#ff4d2d" />
          <Text style={styles.subHeaderText}>Join by code</Text>
        </TouchableOpacity>
      </CenteredContainer>

      {/* Community List */}
      <FlatList
        data={myCommunities}
        keyExtractor={(it) => it.id}
        renderItem={renderCommunities}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>You haven't joined any communities yet. Check the Explore tab!</Text>
        }
      />

      {/* New Community Modal */}
      <NewCommunityModal
        isVisible={showNewCommunityModal}
        onClose={() => setShowNewCommunityModal(false)}
        onSave={handleSaveNewCommunity}
        userId={user.uid}
      />

      {/* Join By Code Modal */}
      <JoinByCodeModal
        isVisible={showJoinByCodeModal}
        onClose={() => setShowJoinByCodeModal(false)}
        onJoin={joinCommunityByCode}
        userId={user.uid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24, },
  headerContainer: { 
    flexDirection: 'row',
    justifyContent:'space-between',
    alignItems: 'center',
    position: 'relative', 
  },
  plusButton: {
    padding: 5,
  },
  subHeaderContainer: {
    flexDirection: 'row',
    justifyContent:'left',
    alignItems: 'center',
    position: 'relative', 
  },
  subHeaderText: {
    paddingLeft: 8,
    fontSize: 16,
    color: '#ff4d2d',
  },
  myCommunitiesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    paddingVertical: 10,
  },
  listContent: { 
    paddingBottom: 100 
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6b7280',
  }
});

const modalStyles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'flex-start', 
    alignItems: 'center',
    paddingTop: 80,
  },
  modalContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    borderRadius: 20, 
    paddingTop: 20,
    flexGrow: 1,
    width: '85%',
    maxWidth: 400,
  },
  topContentWrapper: { height: '60%' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111216',
  },
  saveButton: {
    backgroundColor: '#ff4d2d',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'center',
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111216',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 15,
    paddingLeft: 15,
  },
  bodyInput: {
    flex: 1,
    fontSize: 16,
    color: '#111216',
    padding: 15,
    lineHeight: 24,
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 10,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectContainer: {
    flexDirection: 'row',
    borderRadius: 30,
    minWidth: 200,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectButton: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 5 },
  selectButtonActive: {
    backgroundColor: '#ff4d2d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  selectButtonText: { color: '#374151', fontWeight: '500', fontSize: 14 },
  selectButtonTextActive: { color: 'white', fontWeight: '600' },
});

const joinCodeModalStyles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20, 
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111216',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    width: '100%',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 2,
  },
  joinButton: {
    width: '100%',
    marginBottom: 10,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: '#6b7280',
    fontSize: 16,
  }
});