import { createContext, useContext, useState, useEffect } from 'react';
import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';

const AuthContext = createContext();
const AUTH_SESSION_FLAG = 'shipguard_session_authenticated';
const DEFAULT_NOTIFICATIONS = { email: true, push: true, sms: false };
const DEFAULT_PREFERENCES = { riskThreshold: 60, slaWarningHours: 48, digestTime: '08:00' };
const DEFAULT_INTEGRATIONS = { weatherApiKey: '', mapsApiKey: '', newsApiKey: '' };

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function createUserDoc(user, extra = {}) {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        displayName: user.displayName || extra.displayName || '',
        email: user.email,
        photoURL: user.photoURL || null,
        role: 'analyst',
        company: extra.company || '',
        notifications: DEFAULT_NOTIFICATIONS,
        preferences: DEFAULT_PREFERENCES,
        integrations: DEFAULT_INTEGRATIONS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existing = snap.data();
      const patch = {};
      if (!existing.notifications) patch.notifications = DEFAULT_NOTIFICATIONS;
      if (!existing.preferences) patch.preferences = DEFAULT_PREFERENCES;
      if (!existing.integrations) patch.integrations = DEFAULT_INTEGRATIONS;

      if (Object.keys(patch).length > 0) {
        patch.updatedAt = serverTimestamp();
        await updateDoc(ref, patch);
      }
    }
    const updated = await getDoc(ref);
    setUserProfile({ id: updated.id, ...updated.data() });
  }

  async function signup(email, password, displayName, company) {
    sessionStorage.setItem(AUTH_SESSION_FLAG, '1');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await createUserDoc(cred.user, { displayName, company });
      return cred;
    } catch (e) {
      sessionStorage.removeItem(AUTH_SESSION_FLAG);
      throw e;
    }
  }

  async function login(email, password) {
    sessionStorage.setItem(AUTH_SESSION_FLAG, '1');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await createUserDoc(cred.user);
      return cred;
    } catch (e) {
      sessionStorage.removeItem(AUTH_SESSION_FLAG);
      throw e;
    }
  }

  async function loginWithGoogle() {
    sessionStorage.setItem(AUTH_SESSION_FLAG, '1');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserDoc(result.user);
      return result;
    } catch (e) {
      sessionStorage.removeItem(AUTH_SESSION_FLAG);
      throw e;
    }
  }

  function logout() {
    setUserProfile(null);
    sessionStorage.removeItem(AUTH_SESSION_FLAG);
    return signOut(auth);
  }

  async function updateUserProfileData(data) {
    if (!currentUser) return;
    const ref = doc(db, 'users', currentUser.uid);
    await updateDoc(ref, data);
    const snap = await getDoc(ref);
    setUserProfile({ id: snap.id, ...snap.data() });
  }

  useEffect(() => {
    let unsub = () => {};

    const initializeAuth = async () => {
      try {
        await setPersistence(auth, browserSessionPersistence);
      } catch (e) {
        console.error('Failed to set auth persistence:', e);
      }

      unsub = onAuthStateChanged(auth, async (user) => {
        if (user && !sessionStorage.getItem(AUTH_SESSION_FLAG)) {
          try {
            await signOut(auth);
          } catch (e) {
            console.error('Failed to clear stale auth session:', e);
          }
          setCurrentUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        setCurrentUser(user);
        if (user) {
          try {
            await createUserDoc(user);
          } catch (e) {
            console.error('Failed to load user profile:', e);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      });
    };

    initializeAuth();
    return () => unsub();
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile: updateUserProfileData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
