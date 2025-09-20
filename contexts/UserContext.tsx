import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';
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
    // In the demo, we only load users if someone is logged in, to mimic real behavior.
    if (!currentUser) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Simulate fetching users from a local source
    setTimeout(() => {
      setUsers(MOCK_USERS);
      setLoading(false);
    }, 200); // Simulate network delay
  }, [currentUser]);

  const findUserById = (id: string) => users.find(u => u.id === id);

  return (
    <UserContext.Provider value={{ users, loading, findUserById }}>
      {children}
    </UserContext.Provider>
  );
};
