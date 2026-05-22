import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CenteredContainer from '../../common/CenteredContainer';
import PostCard from '../../common/PostCard';

/**
 * Full-screen view to display a single post (reusing the PostCard component).
 * @param {object[]} posts - Array of all user posts (for the FlatList).
 * @param {string} postId - The ID of the currently selected post.
 * @param {function} onClose - Function to navigate back to the profile grid.
 * @param {function} onTogglePublish - Handler from ProfileScreen to change post status in Firestore.
 */
export default function PostDetailScreen({ posts, postId, onClose, onTogglePublish }) {
  const initialIndex = posts.findIndex(p => p.id === postId);

  const renderPosts = ({ item }) => (
    <PostCard 
      item={item} 
      isProfileView={true} 
      onTogglePublish={onTogglePublish}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <CenteredContainer>
        <View style={styles.pageTitle}>
          <TouchableOpacity style={styles.backButtonContainer} onPress={onClose}>
            <Ionicons name="chevron-back" size={20} color="#111" /> 
            <Text style={styles.title}>Your Posts</Text> 
          </TouchableOpacity>
        </View>
      </CenteredContainer>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPosts}
          initialScrollIndex={initialIndex >= 0 ? initialIndex : 0}
          getItemLayout={(data, index) => (
            { length: 800, offset: 800 * index, index } 
          )}
          showsVerticalScrollIndicator={false}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 24 },
  pageTitle: { flexDirection: 'row', alignItems: 'basline', justifyContent: 'left', paddingBottom: 20 },
  title: { paddingLeft: 10, fontSize: 20, fontWeight: '500', color: '#111' },
  backButtonContainer: { flexDirection: 'row', alignItems: 'center', paddingRight: 15 },
});
