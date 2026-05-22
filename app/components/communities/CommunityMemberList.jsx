import { FlatList, Image, StyleSheet, Text, View } from "react-native";

const CommunityMemberList = ({ communityMembers }) => {
    const renderMembers = ({ item }) => {
        return (
            <View style={styles.memberCard}>
                <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                <Text style={styles.name}>{item.displayName}</Text>
            </View>
        );
    }

    return (
        <View>
            <FlatList
                data={communityMembers}
                keyExtractor={(it) => it.id}
                renderItem={renderMembers}
                contentContainerStyle={{ paddingBottom: 140 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

export default CommunityMemberList;

const styles = StyleSheet.create({
    memberCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
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
  avatar: { width: 40, height: 40, borderRadius: 100, marginRight: 10 },
  name: { fontSize: 16, fontWeight: '700' },
});