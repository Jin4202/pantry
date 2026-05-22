// app/utils/analytics.js
import { getAuth } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";

/**
 * Log a lightweight analytics event to Firestore.
 * Firestore collection: events
 *
 * eventType examples:
 *  - "app_open"
 *  - "view_home"
 *  - "create_post"
 *  - "complete_challenge"
 *  - "view_profile"
 */
export default function logEvent(eventType, metadata = {}) {
  (async () => {
    try {
      const auth = getAuth();
      const uid = auth?.currentUser?.uid || null;

      await addDoc(collection(db, "events"), {
        uid,
        type: eventType,
        metadata,
        ts: serverTimestamp(),
      });
    } catch (e) {
      // don't crash UX if analytics fails
      console.warn("logEvent failed:", e?.message);
    }
  })();
}

