import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const LoadingView = ({ text = ' ' }) => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#ff4d2d" />
        <Text style={styles.loadingText}>{text}</Text>
    </View>
);

export default LoadingView;

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { marginTop: 8, color: '#6b7280' },
});