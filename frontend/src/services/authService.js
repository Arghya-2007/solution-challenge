import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';

const googleProvider = new GoogleAuthProvider();

export const signUpWithEmail = async (email, password, displayName = '') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update Firebase Auth profile so the JWT token contains the displayName
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    try {
      const token = await user.getIdToken();
      await api.post('/auth/sessionLogin', { idToken: token });
      await api.post('/profile/sync');
    } catch (syncError) {
      console.warn("Profile sync or session login failed:", syncError);
    }
    return user;
  } catch (error) {
    console.error("Error in signUpWithEmail:", error);
    throw error;
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    try {
      const token = await userCredential.user.getIdToken();
      await api.post('/auth/sessionLogin', { idToken: token });
      await api.post('/profile/sync');
    } catch (syncError) {
      console.warn("Profile sync or session login failed:", syncError);
    }
    return userCredential.user;
  } catch (error) {
    console.error("Error in signInWithEmail:", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;

    try {
      const token = await user.getIdToken();
      await api.post('/auth/sessionLogin', { idToken: token });
      await api.post('/profile/sync');
    } catch (syncError) {
      console.warn("Profile sync or session login failed:", syncError);
    }
    return user;
  } catch (error) {
    console.error("Error in signInWithGoogle:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await api.post('/auth/sessionLogout');
  } catch (e) {
    console.warn("Session logout failed", e);
  }
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error in signOut:", error);
    throw error;
  }
};
