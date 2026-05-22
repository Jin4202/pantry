import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PostCard from '../common/PostCard';

const CommunityActivityFeed = ({ communityFeed, onPress }) => {
    const renderPosts = ({ item }) => <PostCard item={item} />;
    return (
        <View>
            {/* Share Input */}
            <TouchableOpacity style={styles.shareInput} onPress={onPress}>
                <Ionicons name="camera-outline" size={20} color="#6b7280" />
                <Text style={styles.shareInputText}>Share your cooking win!! 🙌</Text>
            </TouchableOpacity>

            {/* Activity Feed List */}
            <View>
                  <FlatList
                    data={communityFeed}
                    keyExtractor={(it) => it.id}
                    renderItem={renderPosts}
                    contentContainerStyle={{ paddingBottom: 140 }}
                    showsVerticalScrollIndicator={false}
                  />
            </View>
        </View>
    );
};

export default CommunityActivityFeed;

const styles = StyleSheet.create({
    shareInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f4f5f6',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    shareInputText: {
        marginLeft: 10,
        color: '#6b7280',
        fontSize: 14,
    },
});