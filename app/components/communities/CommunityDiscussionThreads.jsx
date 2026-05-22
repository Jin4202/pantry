import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DiscussionThreadItem = ({ thread, onPress }) => (
  <TouchableOpacity style={styles.threadItem} onPress={() => onPress(thread)}>
    <View style={styles.threadDetails}>
      <Text style={styles.threadTitle}>{thread.title}</Text>
      <Text style={styles.threadMeta}>
        Started by **{thread.creatorDisplayName || 'Unknown'}**
      </Text>
    </View>
    <View style={styles.threadCounts}>
      {/* Assuming 'replyCount' is stored on the thread document */}
      <Text style={styles.replyCount}>{thread.replyCount || 0}</Text>
      <Ionicons name="chatbubbles-outline" size={18} color="#4b5563" />
    </View>
  </TouchableOpacity>
);

export default function CommunityDiscussionThreads({ communityId, discussions }) {
  const router = useRouter();

  const handleThreadPress = (thread) => {
    // Navigate to a specific thread's detail view
    router.push({
      pathname: '/discussion/[threadId]', 
      params: { threadId: thread.id }
    });
  };

  const handleCreateNewThread = () => {
    // Navigate to a screen/modal to create a new thread
    router.push({
      pathname: '/discussion/create', 
      params: { communityId: communityId } // Pass community ID for context
    });
  };

  return (
    <View style={styles.container}>
      {/* Button to create a new thread */}
      <TouchableOpacity style={styles.createButton} onPress={handleCreateNewThread}>
        <Ionicons name="pencil-outline" size={20} color="white" />
        <Text style={styles.createButtonText}>Start a New Discussion</Text>
      </TouchableOpacity>

      {discussions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.noThreadsText}>Be the first to start a discussion!</Text>
        </View>
      ) : (
        <FlatList
          data={discussions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DiscussionThreadItem thread={item} onPress={handleThreadPress} />
          )}
          style={styles.list}
          scrollEnabled={false} // Important: If embedded in parent ScrollView
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingVertical: 10,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150, 
  },
  loadingText: {
    fontSize: 16,
    color: '#374151',
  },
  noThreadsText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4d2d',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  list: {
    width: '100%',
  },
  // --- DiscussionThreadItem Styles ---
  threadItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  threadDetails: {
    flex: 1,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  threadMeta: {
    fontSize: 13,
    color: '#6b7280',
  },
  threadCounts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  replyCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginRight: 4,
  }
});