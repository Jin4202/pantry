import { Ionicons } from '@expo/vector-icons';
import {
  addDoc, collection, deleteDoc, doc, getDoc,
  onSnapshot, orderBy, query, serverTimestamp, setDoc
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert, FlatList, Image,
  Modal,
  StyleSheet, Text,
  TextInput, TouchableOpacity, View
} from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import CenteredContainer from './CenteredContainer';

function usePostData(itemId, user) {
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [liked, setLiked] = useState(false);
  
  useEffect(() => {
    // 1. Likes Subscription
    const likesRef = collection(db, 'feed', itemId, 'likes');
    const unsubLikes = onSnapshot(likesRef, (snap) => {
      setLikesCount(snap.size);
    });

    // 2. Comments Subscription 
    const commentsRef = collection(db, 'feed', itemId, 'comments');
    const unsubComments = onSnapshot(commentsRef, (snap) => {
      setCommentsCount(snap.size);
    });
    
    // 3. Current User Like Status Check
    const checkLike = async () => {
      if (!user) return setLiked(false);
      const likeDoc = await getDoc(doc(db, 'feed', itemId, 'likes', user.uid));
      setLiked(likeDoc.exists());
    };
    checkLike();
    
    // Clean up all subscriptions
    return () => {
      unsubLikes();
      unsubComments();
    };

  }, [itemId, user]); // Re-run if post or user changes

  return { likesCount, commentsCount, liked, setLiked };
}

function CommentInput({ itemId }) {
  const [commentText, setCommentText] = useState('');
  const user = auth.currentUser;

  const onAddComment = async () => {
    if (!user) return Alert.alert('Sign in', 'Please sign in to comment.');
    if (!commentText.trim()) return;

    const commentsRef = collection(db, 'feed', itemId, 'comments');

    try {
      await addDoc(commentsRef, {
        uid: user.uid,
        text: commentText.trim(),
        displayName: user.displayName || 'Pantry Member',
        createdAt: serverTimestamp()
      });
      setCommentText('');
    } catch (e) {
      console.warn('Add comment error', e);
      Alert.alert('Error', 'Unable to add comment.');
    }
  };

  return (
    <View style={styles.commentInputRow}>
      <TextInput
        value={commentText}
        onChangeText={setCommentText}
        placeholder="Write a comment..."
        placeholderTextColor="#A9A9A9"
        style={styles.commentInput}
      />
      <TouchableOpacity style={styles.sendBtn} onPress={onAddComment}>
        <Text style={{ color: '#fff' }}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

function CommentsSection({ itemId, show }) {
  const [comments, setComments] = useState([]);

  // Subscribe to comments only when comments pane is open
  useEffect(() => {
    if (!show) return;
    const q = query(collection(db, 'feed', itemId, 'comments'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setComments(arr);
    });
    return unsub;
  }, [show, itemId]);

  if (!show) return null;

  return (
    <View style={styles.commentsSection}>
      <FlatList
        data={comments}
        keyExtractor={(it) => it.id}
        renderItem={({ item: c }) => (
          <View style={styles.commentRow}>
            <Text style={styles.commentAuthor}>{c.displayName}</Text>
            <Text style={styles.commentText}>{c.text}</Text>
          </View>
        )}
        style={{ maxHeight: 240 }}
        ListEmptyComponent={<Text style={{ padding: 10, color: '#6B7280' }}>No comments yet. Be the first!</Text>}
      />
      <CommentInput itemId={itemId} />
    </View>
  );
}

// Indicator Component
const PrivateIndicator = () => (
  <View style={styles.privateBadge}>
    <Text style={styles.privateBadgeText}>🔒 PRIVATE LOG</Text>
  </View>
);

// This is the menu that pops up when the user clicks the three dots
const PostOptionsMenu = ({ isVisible, onClose, item, onTogglePublish }) => {
  const menuActionText = item.isPublished ? 'Hide from Feed (Archive)' : 'Publish to Feed';

  const handleAction = () => {
    onTogglePublish(item);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalBackdrop} 
        activeOpacity={1}
        onPress={onClose} 
      >
        {/* Menu content placed strategically */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={handleAction}>
            <Text style={styles.menuText}>{menuActionText}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};


export default function PostCard({ item, isProfileView = false, onTogglePublish }) {
  const [showComments, setShowComments] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const user = auth.currentUser;

  const isAuthorAndInProfile = isProfileView && user && user.uid === item.uid;
  const isPrivate = item.isPublished === false;

  const { likesCount, commentsCount, liked, setLiked } = usePostData(item.id, user);

  const toggleLike = async () => {
    if (!user) return Alert.alert('Sign in', 'Please sign in to like posts.');
    const likeRef = doc(db, 'feed', item.id, 'likes', user.uid);

    try {
      if (liked) {
        await deleteDoc(likeRef);
        setLiked(false);
      } else {
        await setDoc(likeRef, { uid: user.uid, createdAt: serverTimestamp() });
        setLiked(true);
      }
    } catch (e) {
      console.warn('Like toggle error', e);
    }
  };

  const postTime = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleString() : '';

  return (
    <CenteredContainer style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.displayPhoto }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.displayName || 'Pantry Member'}</Text>
          <Text style={styles.cardTime}>{postTime}</Text>
        </View>
        
        {/* Private Indicator */}
        {isAuthorAndInProfile && isPrivate && (
          <View style={styles.privateIndicatorRow}>
            <PrivateIndicator />
          </View>
        )}

        {isAuthorAndInProfile && (
          <TouchableOpacity 
            style={styles.optionsButton} 
            onPress={() => setIsMenuVisible(true)}
          >
           <Ionicons name="ellipsis-vertical" size={24} color="#667" />
          </TouchableOpacity>
        )}
      </View>

      {/* Caption Display */}
      {(item.caption && item.caption.trim()) ? (
        <View style={styles.captionContainer}>
            <Text style={styles.captionText}>{item.caption}</Text>
        </View>
      ) : null}

      {/* Post Image */}
      {item.url && (
        <Image source={{ uri: item.url }} style={styles.feedImage} resizeMode="cover" />
      )}

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#ef4444' : '#111'} />
          <Text style={styles.actionText}>{likesCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(s => !s)}>
          <Ionicons name="chatbubble-outline" size={20} color="#111" />
          <Text style={styles.actionText}>{commentsCount || 0}</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      <CommentsSection itemId={item.id} show={showComments} />

      {/* Options Menu Modal */}
      {isAuthorAndInProfile && (
        <PostOptionsMenu 
          isVisible={isMenuVisible}
          onClose={() => setIsMenuVisible(false)}
          item={item}
          onTogglePublish={onTogglePublish}
        />
      )}
    </CenteredContainer>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: "white",
    borderWidth: 1, 
    borderColor: '#EEE', 
    borderRadius: 14, 
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 100, marginRight: 10 },
  cardTitle: { fontWeight: '700' },
  cardTime: { color: '#6B7280', fontSize: 12 },
  
  feedImage: { 
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginVertical: 6, 
    width: '100%',
    aspectRatio: 1,
  },

  // Caption
  captionContainer: { marginTop: 6, paddingVertical: 8, paddingHorizontal: 4 },
  captionText: { fontSize: 14, color: '#111216'},
  captionAuthor: { fontWeight: '700', marginRight: 4, color: '#111216'},

  // Actions (likes/comments)
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionText: { marginLeft: 4, fontWeight: '700' },

  // Comments
  commentsSection: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f1f1f1', paddingTop: 8 },
  commentRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f3f3' },
  commentAuthor: { fontWeight: '700' },
  commentText: { marginTop: 4 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, marginRight: 8 },
  sendBtn: { backgroundColor: '#111216', padding: 10, borderRadius: 8 },

  // Options Button
  optionsButton: { padding: 8 },
  
  // Options Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start', 
    alignItems: 'flex-end',  
    paddingTop: 100,
    paddingRight: 20, 
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 15 },
  menuText: { fontSize: 15, color: '#333' },

  // privacy indicator
  privateIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  privateBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  privateBadgeText: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 12,
  }
});