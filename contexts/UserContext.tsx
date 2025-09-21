
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { MOCK_USERS } from '../demoData';

interface UserContextType {
  users: User[];
  loading: boolean;
  findUserById: (id: string) => User | undefined;
  updateUser: (id: string, updates: Partial<Omit<User, 'id'>>) => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, isDemo } = useAuth();

  useEffect(() => {
    if (isDemo) {
      setUsers(MOCK_USERS);
      setLoading(false);
      return;
    }
    
    if (!currentUser) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = db.collection('users').onSnapshot(
      (snapshot: any) => {
        const userList = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(userList);
        setLoading(false);
      },
      (error: any) => {
        console.error("Error fetching users:", error);
        setUsers([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isDemo]);

  const findUserById = (id: string) => users.find(u => u.id === id);

  const updateUser = useCallback(async (id: string, updates: Partial<Omit<User, 'id'>>) => {
    if (isDemo) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } as User : u));
        return;
    }
    try {
        await db.collection('users').doc(id).update(updates);
    } catch (error) {
        console.error("Error updating user: ", error);
    }
  }, [isDemo]);


  return (
    <UserContext.Provider value={{ users, loading, findUserById, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};