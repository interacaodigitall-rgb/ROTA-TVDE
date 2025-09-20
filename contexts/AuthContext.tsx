
import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { User } from '../types';
import { auth, db } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async () => {
    try {
      await auth.signOut();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to sign out.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setError(null); // Clear errors on auth state change
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore using UID for a direct lookup
          const userDocRef = db.collection('users').doc(firebaseUser.uid);
          const userDoc = await userDocRef.get();

          if (userDoc.exists) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            setUser(userData);
          } else {
            const warningMessage = `No user profile found in Firestore for UID: ${firebaseUser.uid}`;
            console.warn(warningMessage);
            setError(`O seu perfil de utilizador não foi encontrado. Verifique se existe um documento na coleção 'users' com o ID '${firebaseUser.uid}'.`);
            setUser(null);
            // Log out the user if their profile doesn't exist to prevent a broken state
            await auth.signOut();
          }
        } catch (err) {
            console.error("Error fetching user profile:", err);
            setError("Não foi possível ligar à base de dados. Verifique a sua ligação e tente novamente.");
            // We don't set user to null here, to allow the app to work offline if a user was already logged in.
            // If they can't connect on first load, they will be presented with the login screen anyway.
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      await auth.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged will handle setting the user state and profile fetching.
      return true;
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/network-request-failed') {
          setError('Erro de rede. Por favor, verifique a sua ligação à internet.');
      } else if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(error.code)) {
          setError('Email ou password inválidos.');
      } else {
          setError('Ocorreu um erro inesperado durante o login.');
      }
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
