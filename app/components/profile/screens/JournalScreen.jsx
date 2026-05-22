import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../../../firebaseConfig';
import CenteredContainer from '../../common/CenteredContainer';
import LoadingView from '../../common/LoadingView';

// This modal will handle creating new journal entries
const JournalEntryModal = ({ isVisible, onClose, onSave, userId }) => {
    const [prompt, setPrompt] = useState('');
    const [text, setText] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!prompt.trim() || !text.trim()) {
            Alert.alert("Missing Info", "Please provide both a title and an entry body.");
            return;
        }
        setSaving(true);
        try {
            await onSave({ prompt: prompt.trim(), text: text.trim(), userId });
            setPrompt(''); // Clear form after saving
            setText('');
            onClose(); // Close modal
        } catch (error) {
            console.error("Error saving journal entry:", error);
            Alert.alert("Save Error", "Could not save your journal entry. Please try again.");
        } finally {
            setSaving(false);
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
            <CenteredContainer style={modalStyles.topContentWrapper}>
                <View style={modalStyles.modalContainer}>
                    <View style={modalStyles.header}>
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                            <Ionicons name="close" size={28} color="#111216" />
                        </TouchableOpacity>
                        <Text style={modalStyles.headerTitle}>New Journal Entry</Text>
                        <TouchableOpacity onPress={handleSave} style={modalStyles.saveButton} disabled={saving}>
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={modalStyles.saveButtonText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={modalStyles.titleInput}
                        placeholder="Entry Title"
                        placeholderTextColor="#A9A9A9"
                        value={prompt}
                        onChangeText={setPrompt}
                        maxLength={100} // Limit title length
                    />
                    <TextInput
                        style={modalStyles.bodyInput}
                        placeholder="What's on your mind today?"
                        placeholderTextColor="#A9A9A9"
                        value={text}
                        onChangeText={setText}
                        multiline={true}
                        textAlignVertical="top" // For Android to align placeholder to top
                    />
                </View>
            </CenteredContainer>
        </View>
        </Modal>
    );
};

export default function JournalScreen({ onClose, userId }) {
    // 1. STATE FOR JOURNAL DATA AND LOADING
    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewEntryModal, setShowNewEntryModal] = useState(false);

    // 2. DATA FETCHING LOGIC 
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const journalsRef = collection(db, 'journals');
        
        // Query ALL journal entries for the user, ordered by date
        const journalQuery = query(
            journalsRef,
            where('uid', '==', userId), 
            orderBy('createdAt', 'desc')
        );

        const unsubJournal = onSnapshot(
            journalQuery,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setJournals(data);
                setLoading(false);
            },
            (error) => {
                console.error('Error loading journals:', error);
                setLoading(false);
            }
        );

        return () => unsubJournal();
    }, [userId]);

    const handleSaveNewEntry = async ({ prompt, text, userId }) => {
        try {
            await addDoc(collection(db, 'journals'), {
                uid: userId,
                prompt: prompt,
                text: text,
                createdAt: serverTimestamp(),
            });
            console.log("Journal entry saved successfully!");
            setShowNewEntryModal(false);
        } catch (error) {
            console.error("Error adding document: ", error);
            throw error;
        }
    };

    // 3. RENDER ENTRY FUNCTION
    const renderEntries = ({item}) => {
        // Format the date if available
        const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        
        const journalTitle = item.prompt || 'Untitled Entry'; 
        const journalBody = item.text || '';

        return (
            <View style={styles.journalEntry}>
                <View style={styles.journalHeader}>
                    <View style={styles.journalHeaderTop}>
                        <Ionicons name="book-outline" size={20} color="#ff4d2d" />
                        <Text style={styles.journalTitle}>{journalTitle}</Text>
                    </View>
                    <Text style={styles.journalDate}>{formattedDate}</Text>
                </View>
                <Text style={styles.journalText}>{journalBody}</Text>
            </View>
        );
    };
    
    // 4. MAIN RETURN BLOCK
    if (loading) {
        return <LoadingView text="Loading journal..." />;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <CenteredContainer>
                {/* Header */}
                <View style={styles.pageTitle}>
                    <TouchableOpacity style={styles.backButtonContainer} onPress={onClose}>
                        <Ionicons name="chevron-back" size={20} color="#111" />  
                        <Text style={styles.title}>Your Journal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowNewEntryModal(true)}>
                        <Ionicons name="add-circle-outline" size={28} color="#111" />
                    </TouchableOpacity>
                </View>
                
                {journals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>📔</Text>
                        <Text style={styles.emptyTitle}>Start Journaling</Text>
                        <Text style={styles.emptyText}>
                            Document your cooking journey, track what works, and reflect on your progress.
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.subtitle}>
                            {journals.length} {journals.length === 1 ? 'entry' : 'entries'} • Keep reflecting!
                        </Text>
                        <FlatList
                            data={journals}
                            keyExtractor={(item) => item.id}
                            renderItem={renderEntries}
                            contentContainerStyle={styles.listContent}
                        />
                    </>
                )}

                {/* Journal Entry Modal */}
                <JournalEntryModal
                    isVisible={showNewEntryModal}
                    onClose={() => setShowNewEntryModal(false)}
                    onSave={handleSaveNewEntry}
                    userId={userId}
                />
            </CenteredContainer>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 24, paddingBottom: 40 },
    pageTitle: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 20 },
    backButtonContainer: { flexDirection: 'row', alignItems: 'center', paddingRight: 15 },
    
    title: { paddingLeft: 10, fontSize: 20, fontWeight: '500', color: '#111' },
    subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16, fontWeight: '600' },

    journalEntry: { 
        padding: 16, 
        backgroundColor: 'white', 
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1, 
        borderColor: '#EEE', 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    journalHeader: { alignItems: 'left', marginBottom: 12 },
    journalHeaderTop: { flexDirection: 'row', marginBottom: 5 },
    journalTitle: { fontSize: 16, color: '#ff4d2d', fontWeight: '700', marginLeft: 8 },
    journalDate: { fontSize: 14, color: '#374151', fontWeight: '700' },
    journalText: { fontSize: 14, color: '#374151', lineHeight: 22 },

    listContent: {  paddingBottom: 40 },

    emptyState: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        marginTop: 20,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#374151', marginBottom: 8 },
    emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
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
    },
    topContentWrapper: { height: '80%' },
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
});