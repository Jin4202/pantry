import dayjs from 'dayjs';
import {
  addDoc, collection, doc, getDoc,
  serverTimestamp, setDoc
} from 'firebase/firestore';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import CenteredContainer from '../common/CenteredContainer';

const PromptCard = ({ journalPrompt }) => {
  const user = auth.currentUser;
  const [journalText, setJournalText] = useState('');
  const [saving, setSaving] = useState(false);

  const defaultPrompt = "What's your favorite Thanksgiving dish?";
  const PROMPT = journalPrompt || defaultPrompt;

  // ---- ensure user profile doc exists ----
  const ensureUserDoc = async () => {
    const uref = doc(db, 'users', user.uid);
    const snap = await getDoc(uref);
    if (!snap.exists()) {
      await setDoc(uref, {
        displayName: user.displayName || 'Pantry Member',
        streakCount: 0,
        communities: 0,
        photoCount: 0,
        createdAt: Date.now()
      });
    }
  };

  // ---- save journal ----
  const onPostJournal = async () => {
    if (!journalText.trim()) {
      Alert.alert('Add a thought', 'Write a quick sentence before saving.');
      return;
    }
    if (!user) {
        Alert.alert('Sign in required', 'Please sign in to save a journal entry.');
        return;
    }
    try {
      setSaving(true);
      await ensureUserDoc();
      const uref = doc(db, 'users', user.uid);
      const today = dayjs().format('YYYY-MM-DD');

      await addDoc(collection(db, 'journals'), {
        uid: user.uid,
        text: journalText.trim(),
        prompt: PROMPT,
        createdAt: serverTimestamp()
      });
      setJournalText('');
      Alert.alert('Saved', 'Your thoughts were saved!');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CenteredContainer style={styles.promptCard}>
      <View style={styles.headerRow}>
        <View style={styles.headerColLeft}>
          <Text style={styles.promptHeader}>Today's Prompt</Text>
          <Text style={styles.promptText}>{PROMPT}</Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={onPostJournal} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save</Text>}
        </TouchableOpacity>
    </View>
    <TextInput
        value={journalText}
        onChangeText={setJournalText}
        placeholder="Share your thoughts..."
        placeholderTextColor="#A9A9A9"
        style={styles.input}
        multiline
    />
</CenteredContainer>
  );
}

const styles = StyleSheet.create({
  promptCard: {
    marginVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFF2F0',
    borderColor: '#FFE0DB',
    borderWidth: 2,
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 10, 
  },
  headerColLeft: { flex: 1, paddingRight: 10 },
  promptHeader: { 
    fontSize: 16,
    fontWeight: '800',  
    marginBottom: 6,
    color: '#ff4d2d',  
    textAlign: 'left', 
    width: '100%',
    textTransform: 'uppercase' 
  },
  promptText: { 
    fontSize: 14, 
    color: '#4a4a4a', 
    marginBottom: 15,
    textAlign: 'left', 
    width: '100%',
  },
  input: { 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    padding: 12, 
    marginBottom: 10,
    minHeight: 120 
  },
  primaryBtn: { 
    backgroundColor: '#111216', 
    paddingVertical: 10, 
    paddingHorizontal: 20,
    borderRadius: 10, 
    alignSelf: 'center', 
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700' },
});

export default PromptCard;