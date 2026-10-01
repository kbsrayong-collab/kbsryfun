import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Unsubscribe
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { LoanContract } from '../types/loan';

const COLLECTION_NAME = 'contracts';

function cleanPayload<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (Array.isArray(val)) {
        result[key] = val.map(item => (item && typeof item === 'object') ? cleanPayload(item) : item);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

export class FirebaseLoanService {
  /**
   * Subscribe to real-time updates of all contracts
   */
  static subscribeContracts(
    onData: (contracts: LoanContract[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const contractsCol = collection(db, COLLECTION_NAME);

    return onSnapshot(
      contractsCol,
      (snapshot) => {
        const list: LoanContract[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as LoanContract;
          list.push({
            ...data,
            id: docSnap.id,
            repayments: data.repayments || []
          });
        });
        // Sort by contractDate descending
        list.sort((a, b) => (b.contractDate || '').localeCompare(a.contractDate || ''));
        onData(list);
      },
      (error) => {
        console.error('Firestore subscribe error:', error);
        if (onError) {
          try {
            handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
          } catch (err: any) {
            onError(err);
          }
        }
      }
    );
  }

  /**
   * Add a new contract to Firestore
   */
  static async addContract(contract: LoanContract): Promise<void> {
    const path = `${COLLECTION_NAME}/${contract.id}`;
    try {
      const contractRef = doc(db, COLLECTION_NAME, contract.id);
      const rawPayload = {
        ...contract,
        createdBy: auth.currentUser?.uid || 'anonymous',
        createdAt: contract.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(contractRef, cleanPayload(rawPayload));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  /**
   * Update an existing contract in Firestore
   */
  static async updateContract(contract: LoanContract): Promise<void> {
    const path = `${COLLECTION_NAME}/${contract.id}`;
    try {
      const contractRef = doc(db, COLLECTION_NAME, contract.id);
      const rawPayload = {
        ...contract,
        updatedAt: new Date().toISOString()
      };
      await setDoc(contractRef, cleanPayload(rawPayload), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  /**
   * Delete a contract from Firestore
   */
  static async deleteContract(contractId: string): Promise<void> {
    const path = `${COLLECTION_NAME}/${contractId}`;
    try {
      const contractRef = doc(db, COLLECTION_NAME, contractId);
      await deleteDoc(contractRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  /**
   * Seed / Sync local contracts to Firestore if Firestore is empty
   */
  static async seedContractsIfEmpty(localContracts: LoanContract[]): Promise<number> {
    const path = COLLECTION_NAME;
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      if (snapshot.empty && localContracts.length > 0) {
        let count = 0;
        for (const c of localContracts) {
          const docRef = doc(db, COLLECTION_NAME, c.id);
          const raw = {
            ...c,
            createdBy: auth.currentUser?.uid || 'initial-seed',
            createdAt: c.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(docRef, cleanPayload(raw));
          count++;
        }
        return count;
      }
      return 0;
    } catch (error) {
      console.warn('Could not seed contracts to Firestore:', error);
      return 0;
    }
  }

  /**
   * Upload all local contracts to Firestore (explicit user backup/sync)
   */
  static async uploadAllContractsToFirestore(contracts: LoanContract[]): Promise<number> {
    let successCount = 0;
    for (const c of contracts) {
      try {
        const docRef = doc(db, COLLECTION_NAME, c.id);
        const raw = {
          ...c,
          createdBy: auth.currentUser?.uid || 'officer',
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(docRef, cleanPayload(raw), { merge: true });
        successCount++;
      } catch (err) {
        console.error('Failed to sync contract to Firestore:', c.id, err);
      }
    }
    return successCount;
  }

  /**
   * Synchronize user profile into Firestore /users/{userId}
   */
  static async syncUserProfile(user: User): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.uid);
      const profileData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'เจ้าหน้าที่การเงิน',
        photoURL: user.photoURL || '',
        role: 'officer',
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, cleanPayload(profileData), { merge: true });
    } catch (error) {
      console.warn('Could not sync user profile to Firestore:', error);
    }
  }
}
