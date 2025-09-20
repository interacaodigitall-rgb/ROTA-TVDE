
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';

interface UserContextType {
  users: User[];
  loading: boolean;
  findUserById: (id: string) => User | undefined;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
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
  }, [currentUser]);

  const findUserById = (id: string) => users.find(u => u.id === id);

  return (
    <UserContext.Provider value={{ users, loading, findUserById }}>
      {children}
    </UserContext.Provider>
  );
};
