// Utility script to end all open tournaments
// Run this from browser console or import and call endAllOpenTournaments()

import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Tournament } from '../types/tournament';
import { isFirebaseConfigured } from './firestore';

const TOURNAMENTS_COLLECTION = 'tournaments';

/**
 * Delete all open tournaments (active, waiting_for_players, registration)
 */
export async function endAllOpenTournaments(): Promise<number> {
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured');
    return 0;
  }

  try {
    const tournamentsRef = collection(db, TOURNAMENTS_COLLECTION);

    // Get all non-completed tournaments
    const q = query(
      tournamentsRef,
      where('status', 'in', ['active', 'waiting_for_players', 'registration'])
    );

    const querySnapshot = await getDocs(q);

    let deletedCount = 0;

    for (const docSnapshot of querySnapshot.docs) {
      const tournament = docSnapshot.data() as Tournament;
      console.log(`Deleting tournament: ${tournament.name} (${tournament.id}) - Status: ${tournament.status}`);

      await deleteDoc(doc(db, TOURNAMENTS_COLLECTION, tournament.id));
      deletedCount++;
    }

    console.log(`Deleted ${deletedCount} open tournament(s)`);
    return deletedCount;
  } catch (error) {
    console.error('Error ending tournaments:', error);
    return 0;
  }
}

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).endAllOpenTournaments = endAllOpenTournaments;
}
