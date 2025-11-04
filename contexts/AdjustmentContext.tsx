import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Adjustment, AdjustmentStatus } from '../types';
import { db, firestore } from '../firebase';
import { useAuth } from '../hooks/useAuth';
// Add MOCK_ADJUSTMENTS to demoData if needed for offline/demo mode.
// For now, we will use an empty array for demo.

interface AdjustmentContextType {
  adjustments: Adjustment[];
  loading: boolean;
  addAdjustment: (adjustment: Omit<Adjustment, 'id' | 'dateCreated' | 'status' | 'driverName'>) => Promise<void>;
  deleteAdjustment: (id: string) => Promise<void>;
}

export const AdjustmentContext = createContext<AdjustmentContextType | undefined>(undefined);

export const AdjustmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isDemo } = useAuth();

  useEffect(() => {
    if (isDemo) {
      setAdjustments([]); // No demo data for adjustments yet
      setLoading(false);
      return;
    }

    if (!user) {
      setAdjustments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = db.collection('pendingAdjustments').orderBy('dateCreated', 'desc').onSnapshot(
      (snapshot: any) => {
        const adjustmentList = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        })) as Adjustment[];
        setAdjustments(adjustmentList);
        setLoading(false);
      },
      (error: any) => {
        console.error("Error fetching adjustments:", error);
        setAdjustments([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, isDemo]);

  const addAdjustment = useCallback(async (adjustmentData: Omit<Adjustment, 'id' | 'dateCreated' | 'status'>) => {
    if (isDemo) {
      console.log("Demo mode: Add adjustment not implemented.");
      return;
    }
    try {
      await db.collection('pendingAdjustments').add({
          ...adjustmentData,
          dateCreated: firestore.FieldValue.serverTimestamp(),
          status: AdjustmentStatus.PENDING,
      });
    } catch (error) {
      console.error("Error adding adjustment: ", error);
    }
  }, [isDemo]);

  const deleteAdjustment = useCallback(async (id: string) => {
    if (isDemo) {
      console.log("Demo mode: Delete adjustment not implemented.");
      return;
    }
    try {
      // For safety, only allow deleting PENDING adjustments.
      const adjDoc = await db.collection('pendingAdjustments').doc(id).get();
      if(adjDoc.exists && adjDoc.data()?.status === AdjustmentStatus.PENDING) {
        await db.collection('pendingAdjustments').doc(id).delete();
      } else {
        throw new Error("Adjustment is already resolved or does not exist.");
      }
    } catch (error) {
      console.error("Error deleting adjustment: ", error);
    }
  }, [isDemo]);

  return (
    <AdjustmentContext.Provider value={{ adjustments, loading, addAdjustment, deleteAdjustment }}>
      {children}
    </AdjustmentContext.Provider>
  );
};
