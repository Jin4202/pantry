import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebaseConfig';
import CenteredContainer from './components/common/CenteredContainer';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter(); // <-- ADDED

  const onSignIn = async () => {
    setError(''); 
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/tabs/home');
    } catch (e) {
      console.error("Sign-in Error:", e.code); 

      let errorMessage = 'An unexpected sign-in error occurred.';

      switch (e.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-credential': 
        case 'auth/wrong-password':
          errorMessage = 'The email or password you entered is incorrect. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'The email address format is invalid.';
          break;
        default:
          errorMessage = 'Sign in failed. Check your network connection or try again.';
          break;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CenteredContainer>
        <Text style={styles.title}>pantry</Text>

        <TextInput
          style={styles.input}
          value={email} onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#A9A9A9"
          autoCapitalize="none"
        />

        <TextInput 
          style={styles.input} 
          value={password} 
          onChangeText={setPassword} 
          placeholder="Password" 
          placeholderTextColor="#A9A9A9"
          secureTextEntry 
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={onSignIn} disabled={loading}>
          {loading
            ? <Text style={styles.buttonText}>Signing In...</Text>
            : <Text style={styles.buttonText}>Sign In</Text>
          }
        </TouchableOpacity>

        <Link href="/signup" style={styles.link}>Create an account</Link>
      </CenteredContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'white'},
  title: { fontSize: 36, fontWeight: 'bold', marginBottom: 24, color: '#ff4d2d' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12 },
  button: { backgroundColor: '#111216', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  buttonText: { color: 'white', fontWeight: '600' },
  link: { marginTop: 16, color: '#6b4eff', textAlign: 'center' },
  errorText: { color: '#dc2626', fontSize: 14, textAlign: 'center', marginBottom: 10, fontWeight: '600' }
});
