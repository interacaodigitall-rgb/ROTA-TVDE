
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole, CalculationType } from '../types';
import { db, auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { MOCK_USERS } from '../demoData';

interface UserContextType {
  users: User[];
  loading: boolean;
  findUserById: (id: string) => User | undefined;
  updateUser: (id: string, updates: Partial<Omit<User, 'id'>>) => Promise<void>;
  addUser: (userData: Omit<User, 'id'>) => Promise<{ success: boolean; error?: string }>;
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
        const userList = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          
          const roleSource = data.role || data.papel;
          let role: UserRole;
          if (roleSource === 'ADMIN') {
              role = UserRole.ADMIN;
          } else if (roleSource === 'PROPRIETÁRIO' || roleSource === 'OWNER') {
              role = UserRole.OWNER;
          } else {
              role = UserRole.DRIVER; // Default to DRIVER
          }

          const user: User = {
            id: doc.id,
            email: data.email || '',
            // FIX: Ensure name is always a string by explicitly casting it.
            // This prevents runtime errors if the underlying Firestore data for a name is a number or another non-string type,
            // which would crash components that sort or perform string operations on user names (like .localeCompare).
            name: String(data.name || data.nome || data.email || `Utilizador ${doc.id}`),
            matricula: data.matricula || 'N/A',
            type: data.type || CalculationType.SLOT,
            ...data, // Spread the rest of the data
            role, // Overwrite role with the mapped value
          };
          return user;
        }) as User[];
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
        // Ensure numeric fields are stored as numbers, not strings
        const safeUpdates: any = { ...updates };
        if (safeUpdates.outstandingDebt) {
            safeUpdates.outstandingDebt = parseFloat(safeUpdates.outstandingDebt);
        }
        await db.collection('users').doc(id).update(safeUpdates);
    } catch (error) {
        console.error("Error updating user: ", error);
    }
  }, [isDemo]);

  const addUser = useCallback(async (userData: Omit<User, 'id'>) => {
    if (isDemo) {
        const newUser: User = {
            id: `demo-user-${Date.now()}`,
            ...userData,
        };
        setUsers(prev => [...prev, newUser]);
        return { success: true };
    }
    
    const { password, email, ...profileData } = userData;

    if (!password || !email) {
        return { success: false, error: 'Email e password são obrigatórios.' };
    }

    let createdFirebaseUser: any = null;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        createdFirebaseUser = userCredential.user;

        if (createdFirebaseUser) {
            // Do not store the password in the database
            const userProfile: Omit<User, 'id' | 'password'> = {
                ...profileData,
                email,
            };
            await db.collection('users').doc(createdFirebaseUser.uid).set(userProfile);
            return { success: true };
        } else {
            return { success: false, error: 'Não foi possível obter os dados do utilizador após a criação.' };
        }
    } catch (error: any) {
        console.error("Error adding user:", error);

        // If auth user was created but firestore failed, try to delete the auth user to prevent orphans.
        if (createdFirebaseUser) {
            await createdFirebaseUser.delete().catch((deleteError: any) => {
                console.error("Failed to clean up orphaned auth user:", deleteError);
            });
        }

        let friendlyError = 'Ocorreu um erro desconhecido.';
        if (error.code === 'auth/email-already-in-use') {
            friendlyError = 'Este email já está a ser utilizado por outra conta.';
        } else if (error.code === 'auth/weak-password') {
            friendlyError = 'A password é demasiado fraca. Deve ter pelo menos 6 caracteres.';
        } else if (error.code === 'auth/invalid-email') {
            friendlyError = 'O formato do email fornecido é inválido.';
        }
        return { success: false, error: friendlyError };
    }
  }, [isDemo]);


  return (
    <UserContext.Provider value={{ users, loading, findUserById, updateUser, addUser }}>
      {children}
    </UserContext.Provider>
  );
};
