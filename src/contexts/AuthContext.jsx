import { createContext, useContext, useState, useEffect } from 'react';
import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  setPersistence,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';

const AuthContext = createContext();
const AUTH_SESSION_FLAG = 'shipguard_session_authenticated';
const AUTH_LAST_ACTIVITY_KEY = 'shipguard_last_activity_ms';
const AUTH_REDIRECT_PENDING_KEY = 'shipguard_google_redirect_pending';
const AUTH_REDIRECT_PENDING_AT_KEY = 'shipguard_google_redirect_pending_at';
const REDIRECT_PENDING_MAX_AGE_MS = 15 * 60 * 1000;
const SESSION_TIMEOUT_MINUTES = Math.min(1440, Math.max(15, Number(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES) || 1440));
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;
const DEFAULT_NOTIFICATIONS = { email: true, push: true, sms: false };
const DEFAULT_PREFERENCES = { riskThreshold: 60, slaWarningHours: 48, digestTime: '08:00' };
const DEFAULT_INTEGRATIONS = { weatherApiKey: '', mapsApiKey: '', newsApiKey: '' };

function isFirestoreOfflineError(error) {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  return (
    code.includes('unavailable') ||
    message.includes('client is offline') ||
    message.includes('could not reach cloud firestore backend')
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  function markActivity() {
    localStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(Date.now()));
  }

  function isSessionExpired() {
    const lastActivityRaw = localStorage.getItem(AUTH_LAST_ACTIVITY_KEY);
    const lastActivity = Number(lastActivityRaw || 0);
    if (!lastActivity || !Number.isFinite(lastActivity)) return false;
    return Date.now() - lastActivity > SESSION_TIMEOUT_MS;
  }

  function isRedirectPending() {
    if (localStorage.getItem(AUTH_REDIRECT_PENDING_KEY) !== '1') return false;
    const pendingAt = Number(localStorage.getItem(AUTH_REDIRECT_PENDING_AT_KEY) || 0);
    if (!Number.isFinite(pendingAt) || pendingAt <= 0) return false;
    const fresh = Date.now() - pendingAt <= REDIRECT_PENDING_MAX_AGE_MS;
    if (!fresh) {
      localStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
      localStorage.removeItem(AUTH_REDIRECT_PENDING_AT_KEY);
    }
    return fresh;
  }

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
    markActivity();
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
    markActivity();
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
    localStorage.setItem(AUTH_REDIRECT_PENDING_KEY, '1');
    localStorage.setItem(AUTH_REDIRECT_PENDING_AT_KEY, String(Date.now()));
    markActivity();
    try {
      await signInWithRedirect(auth, googleProvider);
      return null;
    } catch (e) {
      sessionStorage.removeItem(AUTH_SESSION_FLAG);
      localStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
      localStorage.removeItem(AUTH_REDIRECT_PENDING_AT_KEY);
      throw e;
    }
  }

  function logout() {
    setUserProfile(null);
    sessionStorage.removeItem(AUTH_SESSION_FLAG);
    localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
    localStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
    localStorage.removeItem(AUTH_REDIRECT_PENDING_AT_KEY);
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

      try {
        // Ensure redirect result is processed before auth state decisions.
        await getRedirectResult(auth);
      } catch (e) {
        console.error('Failed to process Google redirect result:', e);
      }

      unsub = onAuthStateChanged(auth, async (user) => {
        const redirectPending = isRedirectPending();

        if (user && isSessionExpired()) {
          try {
            await signOut(auth);
          } catch (e) {
            console.error('Failed to sign out expired session:', e);
          }
          sessionStorage.removeItem(AUTH_SESSION_FLAG);
          localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
          setCurrentUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        setCurrentUser(user);
        if (user) {
          // Always trust Firebase auth state for authenticated users.
          // Session storage can be dropped across redirects in some browsers.
          sessionStorage.setItem(AUTH_SESSION_FLAG, '1');
          if (redirectPending) {
            localStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
            localStorage.removeItem(AUTH_REDIRECT_PENDING_AT_KEY);
          }
          markActivity();
          try {
            await createUserDoc(user);
          } catch (e) {
            if (isFirestoreOfflineError(e)) {
              setUserProfile((prev) =>
                prev || {
                  id: user.uid,
                  displayName: user.displayName || '',
                  email: user.email || '',
                  photoURL: user.photoURL || null,
                  role: 'analyst',
                  company: '',
                  notifications: DEFAULT_NOTIFICATIONS,
                  preferences: DEFAULT_PREFERENCES,
                  integrations: DEFAULT_INTEGRATIONS,
                }
              );
              console.warn('Firestore is offline; using temporary profile until reconnection.');
            } else {
              console.error('Failed to load user profile:', e);
            }
          }
        } else {
          if (!redirectPending) {
            localStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
            localStorage.removeItem(AUTH_REDIRECT_PENDING_AT_KEY);
          }
          setUserProfile(null);
        }
        setLoading(false);
      });
    };

    initializeAuth();
    return () => unsub();
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const onActivity = () => {
      if (currentUser) markActivity();
    };

    events.forEach((eventName) => window.addEventListener(eventName, onActivity, { passive: true }));
    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, onActivity));
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const timer = setInterval(async () => {
      if (!isSessionExpired()) return;
      try {
        await signOut(auth);
      } catch (e) {
        console.error('Failed to auto-signout expired session:', e);
      }
      sessionStorage.removeItem(AUTH_SESSION_FLAG);
      localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
      setCurrentUser(null);
      setUserProfile(null);
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const tryReloadProfile = async () => {
      try {
        await createUserDoc(currentUser);
      } catch (e) {
        if (!isFirestoreOfflineError(e)) {
          console.error('Failed to refresh user profile after reconnect:', e);
        }
      }
    };

    window.addEventListener('online', tryReloadProfile);
    return () => window.removeEventListener('online', tryReloadProfile);
  }, [currentUser]);

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
