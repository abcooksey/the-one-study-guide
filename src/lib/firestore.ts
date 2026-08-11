import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Flashcard, Session, Profile } from '../types';

// Document references
const APP_DATA_DOC = 'app/data';
const getProfileDoc = (profile: Profile) => `profiles/${profile}`;

// Types for Firestore documents
export interface AppData {
  flashcards: Flashcard[];
  initialized: boolean;
  deletedSeedIds?: string[]; // Track deleted seed questions
  lastUpdated: string;
}

interface ProfileData {
  sessions: Session[];
  lastUpdated: string;
}

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  return Boolean(apiKey && apiKey !== 'your-api-key');
};

// Remove undefined values from an object (Firestore doesn't support undefined)
const sanitizeForFirestore = <T>(obj: T): T => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result as T;
  }
  return obj;
};

// Save app data (flashcards)
export const saveAppData = async (
  flashcards: Flashcard[],
  initialized: boolean,
  deletedSeedIds: string[] = []
): Promise<void> => {
  if (!isFirebaseConfigured()) return;

  try {
    const docRef = doc(db, APP_DATA_DOC);
    // Sanitize flashcards to remove undefined values (like removed flags)
    const sanitizedFlashcards = sanitizeForFirestore(flashcards);
    await setDoc(docRef, {
      flashcards: sanitizedFlashcards,
      initialized,
      deletedSeedIds,
      lastUpdated: new Date().toISOString(),
    } as AppData);
  } catch (error) {
    console.error('Error saving app data to Firestore:', error);
  }
};

// Load app data
export const loadAppData = async (): Promise<AppData | null> => {
  if (!isFirebaseConfigured()) return null;

  try {
    const docRef = doc(db, APP_DATA_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as AppData;
    }
    return null;
  } catch (error) {
    console.error('Error loading app data from Firestore:', error);
    return null;
  }
};

// Save profile sessions
export const saveProfileSessions = async (
  profile: Profile,
  sessions: Session[]
): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  if (profile === 'Guest') return; // Don't save Guest data

  try {
    const docRef = doc(db, getProfileDoc(profile));
    await setDoc(docRef, {
      sessions,
      lastUpdated: new Date().toISOString(),
    } as ProfileData);
  } catch (error) {
    console.error(`Error saving ${profile} sessions to Firestore:`, error);
  }
};

// Load profile sessions
export const loadProfileSessions = async (
  profile: Profile
): Promise<Session[]> => {
  if (!isFirebaseConfigured()) return [];
  if (profile === 'Guest') return [];

  try {
    const docRef = doc(db, getProfileDoc(profile));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as ProfileData;
      return data.sessions || [];
    }
    return [];
  } catch (error) {
    console.error(`Error loading ${profile} sessions from Firestore:`, error);
    return [];
  }
};

// Load all sessions (for both Alex and Angus)
export const loadAllSessions = async (): Promise<Session[]> => {
  if (!isFirebaseConfigured()) return [];

  try {
    const [alexSessions, angusSessions] = await Promise.all([
      loadProfileSessions('Alex'),
      loadProfileSessions('Angus'),
    ]);
    return [...alexSessions, ...angusSessions];
  } catch (error) {
    console.error('Error loading all sessions from Firestore:', error);
    return [];
  }
};

// Subscribe to app data changes (real-time updates)
export const subscribeToAppData = (
  callback: (data: AppData | null) => void
): Unsubscribe | null => {
  if (!isFirebaseConfigured()) return null;

  try {
    const docRef = doc(db, APP_DATA_DOC);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as AppData);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error subscribing to app data:', error);
        callback(null);
      }
    );
  } catch (error) {
    console.error('Error setting up app data subscription:', error);
    return null;
  }
};

// Subscribe to profile sessions (real-time updates)
export const subscribeToProfileSessions = (
  profile: Profile,
  callback: (sessions: Session[]) => void
): Unsubscribe | null => {
  if (!isFirebaseConfigured()) return null;
  if (profile === 'Guest') return null;

  try {
    const docRef = doc(db, getProfileDoc(profile));
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as ProfileData;
          callback(data.sessions || []);
        } else {
          callback([]);
        }
      },
      (error) => {
        console.error(`Error subscribing to ${profile} sessions:`, error);
        callback([]);
      }
    );
  } catch (error) {
    console.error(`Error setting up ${profile} session subscription:`, error);
    return null;
  }
};
