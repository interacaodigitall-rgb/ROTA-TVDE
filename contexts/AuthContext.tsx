
import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { User, UserRole, CalculationType } from '../types';
import { auth, db } from '../firebase';
import { MOCK_ADMIN_USER, MOCK_FROTA_DRIVER_1, MOCK_SLOT_DRIVER_USER } from '../demoData';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loginAsDemo: (role: UserRole, type?: CalculationType) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const logout = useCallback(async () => {
    if (isDemo) {
        setIsDemo(false);
        setUser(null);
        setError(null);
        return;
    }
    try {
      await auth.signOut();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to sign out.");
    }
  }, [isDemo]);

  const loginAsDemo = useCallback((role: UserRole, type?: CalculationType) => {
    setError(null);
    setLoading(true);
    let demoUser: User | null = null;
    if (role === UserRole.ADMIN) {
        demoUser = MOCK_ADMIN_USER;
    } else if (role === UserRole.DRIVER) {
        if (type === CalculationType.FROTA) {
            demoUser = MOCK_FROTA_DRIVER_1;
        } else {
            demoUser = MOCK_SLOT_DRIVER_USER;
        }
    }
    
    if (demoUser) {
        setUser(demoUser);
        setIsDemo(true);
    } else {
        setError("Tipo de demonstração inválido.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isDemo) {
        setLoading(false);
        return;
    }

    setLoading(true);
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setIsDemo(false); // Ensure demo mode is off on real auth change
      setError(null); // Clear errors on auth state change
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore using UID for a direct lookup
          const userDocRef = db.collection('users').doc(firebaseUser.uid);
          const userDoc = await userDocRef.get();

          if (userDoc.exists) {
            const docData = userDoc.data();
            const userData: any = { id: userDoc.id, ...docData };

            // Map Firestore fields ('papel', 'nome') to application fields ('role', 'name')
            // This ensures compatibility with different database schemas.
            const roleSource = userData.role || userData.papel;
            if (roleSource === 'ADMIN') {
                userData.role = UserRole.ADMIN;
            } else if (roleSource === 'PROPRIETÁRIO' || roleSource === 'OWNER') {
                userData.role = UserRole.OWNER;
            } else {
                userData.role = UserRole.DRIVER;
            }
            
            if (userData.nome) {
                userData.name = userData.nome;
            }

            const finalUser = userData as User;

            if (finalUser.status === 'ARCHIVED') {
              setError('A sua conta foi arquivada e não pode mais aceder ao sistema.');
              setUser(null);
              await auth.signOut();
            } else {
              setUser(finalUser);
            }
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
  }, [isDemo]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    
    const DEMO_ACCOUNTS = {
      'demoad@rotatvde.pt': { role: UserRole.ADMIN, type: undefined },
      'demofr@rotatvde.pt': { role: UserRole.DRIVER, type: CalculationType.FROTA },
      'demosl@rotatvde.pt': { role: UserRole.DRIVER, type: CalculationType.SLOT },
    };

    const lowerCaseEmail = email.toLowerCase();
    
    // Check if it's a demo account login attempt
    if (DEMO_ACCOUNTS[lowerCaseEmail] && password === '0123456') {
      const demoAccount = DEMO_ACCOUNTS[lowerCaseEmail];
      loginAsDemo(demoAccount.role, demoAccount.type);
      return true;
    }
    
    // If a demo email is used with the wrong password, show a specific error
    if (DEMO_ACCOUNTS[lowerCaseEmail] && password !== '0123456') {
        setError('Password inválida para a conta de demonstração.');
        return false;
    }

    // Proceed with real Firebase login
    setIsDemo(false);
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
  }, [loginAsDemo]);

  return (
    <AuthContext.Provider value={{ user, loading, error, isDemo, login, logout, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
};