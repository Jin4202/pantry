import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CenteredContainer from '../common/CenteredContainer';

const CommunityHeader = ({ communityName, memberCount, onClose, onActionPress }) => (
    <CenteredContainer>
        <View style={styles.header}>
            <View style={styles.backAndTitleColumn}>
                <TouchableOpacity style={styles.backAndTitleRow} onPress={onClose}>
                    <Ionicons name="chevron-back" size={24} color="#111" />
                    <Text style={styles.title} numberOfLines={1}>{communityName}</Text>
                </TouchableOpacity>
                <Text style={styles.headerMeta}>{memberCount} members cooking together</Text>
            </View>
            <TouchableOpacity style={styles.optionsButton} onPress={onActionPress}>
                <Ionicons name="ellipsis-vertical" size={24} color="#111" />
            </TouchableOpacity>
        </View>
    </CenteredContainer>
);

export default CommunityHeader;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems:'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
    },
    backAndTitleColumn: { flex: 1 },
    backAndTitleRow: { flexDirection: 'row',  alignItems: 'center', paddingRight: 20 },
    title: { fontSize: 20, fontWeight: '800', color: '#ff4d2d',  marginLeft: 8, flexShrink: 1 },
    headerMeta: { fontSize: 14, color: '#6b7280', marginTop: 2, marginLeft: 32 },
    optionsButton: { paddingLeft: 10 }
});