import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import CenteredContainer from "./components/common/CenteredContainer";

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  // error states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [pwError, setPwError] = useState("");
  const [confirmPwError, setConfirmPwError] = useState("");

  const validate = () => {
    setNameError("");
    setEmailError("");
    setPwError("");
    setConfirmPwError("");

    let isValid = true;

    // --- Name Check ---
    if (!name.trim()) {
      setNameError("Please enter your name.");
      isValid = false;
    }

    // --- Email Checks ---
    if (!email.trim()) {
      setEmailError("Please enter your email.");
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Please enter a valid email.");
      isValid = false;
    }

    // --- Password Checks ---
    if (pw.length < 8) {
      setPwError("Password must be at least 8 characters.");
      isValid = false;
    } else if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) {
      setPwError("Password must include letters and numbers.");
      isValid = false;
    }

    // --- Confirmation Check ---
    if (pw !== pw2) {
      setConfirmPwError("Passwords do not match.");
      isValid = false;
    }

    return isValid;
  };

  const onSignUp = async () => {
    const isValid = validate();

    if (!isValid) {
      console.log("Validation failed. Fix errors displayed.");
      return;
    }

    try {
      setLoading(true);

      const trimmedName = name.trim();
      const trimmedEmail = email.trim();

      // 1. CREATE A DEFAULT PHOTO URL
      // used ui-avatars.com to generate a simple avatar
      const defaultPhotoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        trimmedName
      )}&background=e5e7eb&color=6b7280&length=1&bold=true`;
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, pw);

      // 2. UPDATE AUTH PROFILE (now with displayName AND photoURL)
      await updateProfile(cred.user, {
        displayName: trimmedName,
        photoURL: defaultPhotoURL,
      });

      // 3. CREATE FIRESTORE DOC (with the critical path fix and photoURL)
      // Using 'profile' as the collection name for the user's own profile doc.
      const userProfileRef = doc(db, "users", cred.user.uid);
      console.log("About to write Firestore doc to:", userProfileRef.path);
      await setDoc(userProfileRef, {
        displayName: trimmedName,
        email: trimmedEmail,
        photoURL: defaultPhotoURL,
        streakCount: 0,
        communities: 0,
        photoCount: 0,
        lastJournalDate: null,
        isAdmin: false,
        createdAt: serverTimestamp(),
      });

      console.log("Firestore write completed!");
      router.replace("/tabs/home");
    } catch (e) {
      Alert.alert("Sign up failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CenteredContainer>
        <Text style={styles.brand}>pantry</Text>
        <Text style={styles.title}>Create your account</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={[styles.input, nameError ? styles.inputError : {}]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Jordan Davis"
          placeholderTextColor="#A9A9A9"
        />
        {nameError && <Text style={styles.errorText}>{nameError}</Text>}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, emailError ? styles.inputError : {}]}
          value={email}
          onChangeText={setEmail}
          placeholder="youremail@example.com"
          placeholderTextColor="#A9A9A9"
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        {emailError && <Text style={styles.errorText}>{emailError}</Text>}

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, pwError ? styles.inputError : {}]}
          value={pw}
          onChangeText={setPw}
          placeholder="At least 8 characters. Include letters and numbers."
          placeholderTextColor="#A9A9A9"
          secureTextEntry
          textContentType="newPassword"
        />
        {pwError ? <Text style={styles.errorText}>{pwError}</Text> : null}

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={[styles.input, confirmPwError ? styles.inputError : {}]}
          value={pw2}
          onChangeText={setPw2}
          placeholder="Re-enter password"
          placeholderTextColor="#A9A9A9"
          secureTextEntry
          textContentType="newPassword"
        />
        {confirmPwError ? (
          <Text style={styles.errorText}>{confirmPwError}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          onPress={onSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          By creating an account, you agree to our community guidelines.
        </Text>

        <Link href="/signin" style={styles.link}>
          I already have an account
        </Link>
      </CenteredContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white", padding: 24, paddingTop: 64 },
  brand: { fontSize: 28, fontWeight: "800", color: "#ff4d2d", marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 12, color: "#6b7280", marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
  },

  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    fontWeight: "600",
  },
  inputError: {
    borderColor: "#dc2626",
    borderWidth: 2,
  },

  button: {
    backgroundColor: "#111216",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },
  buttonText: { color: "white", fontWeight: "700" },
  link: {
    marginTop: 18,
    color: "#6b4eff",
    textAlign: "center",
    fontWeight: "600",
  },
  hint: { color: "#6b7280", fontSize: 12, textAlign: "center", marginTop: 12 },
});
