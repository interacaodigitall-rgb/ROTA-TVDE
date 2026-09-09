import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Company } from '../types';
import { DEFAULT_COMPANY, MOCK_COMPANIES } from '../data/adTechDemoData';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';

interface CompanyContextType {
  currentCompany: Company;
  companies: Company[];
  loading: boolean;
  setCompanyId: (id: string) => void;
  updateCurrentCompany: (updates: Partial<Company>) => Promise<void>;
  addCompany: (company: Omit<Company, 'id'>) => Promise<void>;
  getCompanyId: (item?: { companyId?: string }) => string;
}

export const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isDemo } = useAuth();
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [currentCompanyId, setCurrentCompanyId] = useState<string>(DEFAULT_COMPANY.id);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isDemo) {
      setCompanies(MOCK_COMPANIES);
      return;
    }

    try {
      const unsubscribe = db.collection('companies').onSnapshot(
        (snapshot: any) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data()
            } as Company));
            setCompanies(list);
            // If current company not found in list, fallback to first or default
            if (!list.find((c: Company) => c.id === currentCompanyId)) {
              setCurrentCompanyId(list[0]?.id || DEFAULT_COMPANY.id);
            }
          } else {
            // Seed or keep default Asfalto Cativante
            setCompanies([DEFAULT_COMPANY]);
          }
        },
        (error: any) => {
          console.warn("Using fallback company data due to firestore error:", error);
          setCompanies(MOCK_COMPANIES);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      setCompanies(MOCK_COMPANIES);
    }
  }, [isDemo, currentCompanyId]);

  const currentCompany = companies.find(c => c.id === currentCompanyId) || DEFAULT_COMPANY;

  const setCompanyId = useCallback((id: string) => {
    setCurrentCompanyId(id);
  }, []);

  const updateCurrentCompany = useCallback(async (updates: Partial<Company>) => {
    const updated = { ...currentCompany, ...updates };
    setCompanies(prev => prev.map(c => c.id === currentCompany.id ? updated : c));

    if (!isDemo) {
      try {
        await db.collection('companies').doc(currentCompany.id).set(updated, { merge: true });
      } catch (err) {
        console.error("Error updating company in firestore:", err);
      }
    }
  }, [currentCompany, isDemo]);

  const addCompany = useCallback(async (newComp: Omit<Company, 'id'>) => {
    const newId = `comp-${Date.now()}`;
    const fullCompany: Company = { ...newComp, id: newId };
    setCompanies(prev => [...prev, fullCompany]);

    if (!isDemo) {
      try {
        await db.collection('companies').doc(newId).set(fullCompany);
      } catch (err) {
        console.error("Error creating company in firestore:", err);
      }
    }
  }, [isDemo]);

  // Backwards compatibility helper: Any calculation/driver without companyId belongs to current/default fleet
  const getCompanyId = useCallback((item?: { companyId?: string }) => {
    return item?.companyId || DEFAULT_COMPANY.id;
  }, []);

  return (
    <CompanyContext.Provider value={{
      currentCompany,
      companies,
      loading,
      setCompanyId,
      updateCurrentCompany,
      addCompany,
      getCompanyId
    }}>
      {children}
    </CompanyContext.Provider>
  );
};
