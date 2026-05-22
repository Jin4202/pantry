import { Ionicons } from '@expo/vector-icons'; // Assuming you use Ionicons
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Renders a list of communities with selectable checkboxes for sharing a post.
 * @param {object} props
 * @param {Array<object>} props.userCommunities - List of communities to display (e.g., [{ id, name, memberCount }]).
 * @param {Array<string>} props.selectedCommunityIds - Array of community IDs currently selected.
 * @param {function} props.onToggleCommunity - Handler function (communityId) => void to toggle selection.
 */
export default function CommunityShareCheckboxes({
  userCommunities,
  selectedCommunityIds,
  onToggleCommunity,
}) {

  const renderCommunityItem = (community) => {
    const isSelected = selectedCommunityIds.includes(community.id);
    
    return (
      <TouchableOpacity
        key={community.id}
        style={styles.communityRow}
        onPress={() => onToggleCommunity(community.id)}
      >
        <View style={styles.checkbox}>
          {isSelected && <Ionicons name="checkmark" size={18} color="#000" />}
        </View>

        <View style={styles.communityInfo}>
          <Text style={styles.communityName}>
            {community.name}
          </Text>
          <Text style={styles.memberCount}>
            {community.memberUids.length.toLocaleString()} members
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Share to Communities (optional)</Text>
      {userCommunities.map(renderCommunityItem)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  header: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111216',
    marginRight: 8,
  },
  memberCount: {
    fontSize: 14,
    color: '#6b7280',
  },
});