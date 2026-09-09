
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
    } else if (role === UserRole.MANAGER) {
        demoUser = {
          ...MOCK_ADMIN_USER,
          id: 'demo-gerente',
          name: 'Gerente da Frota (Demo)',
          email: 'gerente@rotatvde.pt',
          role: UserRole.MANAGER,
        };
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
          // 1. Fetch user profile from Firestore using UID
          let userDoc = await db.collection('users').doc(firebaseUser.uid).get();
          let userData: any = null;

          if (userDoc.exists) {
            userData = { id: userDoc.id, ...userDoc.data() };
          } else if (firebaseUser.email) {
            // 2. Fallback: Search by email if document ID was not the UID
            const emailQuery = await db.collection('users').where('email', '==', firebaseUser.email).limit(1).get();
            if (!emailQuery.empty) {
              const matched = emailQuery.docs[0];
              userData = { id: matched.id, ...matched.data() };
            }
          }

          // 3. Fallback: If user authenticated successfully in Firebase Auth but has no Firestore profile document,
          // auto-provision them with ADMIN or MANAGER role so they have immediate operational access.
          if (!userData) {
            const userEmailLower = (firebaseUser.email || '').toLowerCase();
            const isManager = userEmailLower.includes('gerente') || userEmailLower.includes('gestor') || userEmailLower.includes('manager');
            const initialRole = isManager ? UserRole.MANAGER : UserRole.ADMIN;
            const initialProfile = {
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Administrador'),
              role: initialRole,
              status: 'ACTIVE',
              type: CalculationType.SLOT,
              matricula: 'N/A',
              createdAt: new Date()
            };

            try {
              await db.collection('users').doc(firebaseUser.uid).set(initialProfile);
              userData = { id: firebaseUser.uid, ...initialProfile };
            } catch (createErr) {
              console.warn("Could not auto-create profile doc, using in-memory profile:", createErr);
              userData = { id: firebaseUser.uid, ...initialProfile };
            }
          }

          // Map Firestore fields ('papel', 'nome') to application fields ('role', 'name')
          const roleSource = String(userData.role || userData.papel || '').toUpperCase().trim();
          if (roleSource === 'ADMIN' || roleSource === 'ADMINISTRADOR' || roleSource === 'SUPERADMIN') {
              userData.role = UserRole.ADMIN;
          } else if (roleSource === 'GERENTE' || roleSource === 'MANAGER' || roleSource === 'GESTOR' || roleSource === 'GERÊNCIA' || roleSource === 'GERENCIA') {
              userData.role = UserRole.MANAGER;
          } else if (roleSource === 'PROPRIETÁRIO' || roleSource === 'PROPRIETARIO' || roleSource === 'OWNER') {
              userData.role = UserRole.OWNER;
          } else {
              // Smart check for admin/gerente email patterns
              const checkEmail = (userData.email || firebaseUser.email || '').toLowerCase();
              if (checkEmail.includes('admin') || checkEmail.includes('adm@') || checkEmail === 'eunawebse@gmail.com') {
                userData.role = UserRole.ADMIN;
              } else if (checkEmail.includes('gerente') || checkEmail.includes('gestor') || checkEmail.includes('manager')) {
                userData.role = UserRole.MANAGER;
              } else {
                userData.role = UserRole.DRIVER;
              }
          }
          
          if (userData.nome && !userData.name) {
              userData.name = userData.nome;
          }
          if (!userData.name) {
              userData.name = userData.email?.split('@')[0] || 'Utilizador';
          }

          const finalUser = userData as User;

          if (finalUser.status === 'ARCHIVED') {
            setError('A sua conta foi arquivada e não pode mais aceder ao sistema.');
            setUser(null);
            await auth.signOut();
          } else {
            setUser(finalUser);
          }
        } catch (err) {
            console.error("Error fetching user profile:", err);
            setError("Não foi possível ligar à base de dados. Verifique a sua ligação e tente novamente.");
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
    const lowerCaseEmail = email.toLowerCase().trim();

    // 1. Check if user is requesting STATIC DEMO MODE
    const STATIC_DEMO_ACCOUNTS: Record<string, { role: UserRole; type?: CalculationType; pass: string }> = {
      'demoad@rotatvde.pt': { role: UserRole.ADMIN, type: undefined, pass: 'Minharotatvde' },
      'demofr@rotatvde.pt': { role: UserRole.DRIVER, type: CalculationType.FROTA, pass: '0123456' },
      'demosl@rotatvde.pt': { role: UserRole.DRIVER, type: CalculationType.SLOT, pass: '0123456' },
    };

    if (STATIC_DEMO_ACCOUNTS[lowerCaseEmail]) {
      const demoAccount = STATIC_DEMO_ACCOUNTS[lowerCaseEmail];
      if (password === demoAccount.pass) {
        loginAsDemo(demoAccount.role, demoAccount.type);
        return true;
      } else {
        setError('Password inválida para a conta de demonstração.');
        return false;
      }
    }

    // 2. REAL MODE - ADMIN & GERENTE SYSTEM CREDENTIALS
    const isSystemAdminLogin = lowerCaseEmail === 'adm@tvdecheck.pt' && password === '0123456789';
    const isSystemManagerLogin = (lowerCaseEmail === 'gerente@tvdecheck.pt' || lowerCaseEmail === 'gerente@rotatvde.pt') && password === '0123456789';

    if (isSystemAdminLogin || isSystemManagerLogin) {
      setIsDemo(false);
      setLoading(true);
      const targetRole = isSystemAdminLogin ? UserRole.ADMIN : UserRole.MANAGER;
      const targetName = isSystemAdminLogin ? 'Administrador do Sistema' : 'Gerente Operacional da Frota';
      const targetUid = isSystemAdminLogin ? 'adm_tvdecheck_pt' : 'gerente_tvdecheck_pt';

      // Attempt to sign in or create user in Firebase Auth
      try {
        await auth.signInWithEmailAndPassword(lowerCaseEmail, password);
      } catch (authErr: any) {
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          try {
            await auth.createUserWithEmailAndPassword(lowerCaseEmail, password);
          } catch (createErr) {
            console.warn("Could not create Firebase Auth account, proceeding with Firestore profile:", createErr);
          }
        }
      }

      // Sync user document with real Firestore database
      try {
        const userDocRef = db.collection('users').doc(targetUid);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
          const profileData = {
            id: targetUid,
            email: lowerCaseEmail,
            name: targetName,
            role: targetRole,
            status: 'ACTIVE',
            type: CalculationType.SLOT,
            matricula: 'N/A',
            createdAt: new Date()
          };
          await userDocRef.set(profileData, { merge: true });
          setUser(profileData as User);
        } else {
          const docData = userDoc.data();
          const activeUser = {
            id: userDoc.id,
            ...docData,
            role: targetRole,
            name: docData.name || docData.nome || targetName,
            email: lowerCaseEmail,
          } as User;
          setUser(activeUser);
        }
      } catch (fsErr) {
        console.warn("Firestore profile sync warning, setting local session:", fsErr);
        setUser({
          id: targetUid,
          email: lowerCaseEmail,
          name: targetName,
          role: targetRole,
          status: 'ACTIVE',
          type: CalculationType.SLOT,
          matricula: 'N/A'
        } as User);
      }

      setLoading(false);
      return true;
    }

    // 3. REAL MODE - Standard Firebase Auth for any registered Driver / Manager / Owner / Admin
    setIsDemo(false);
    try {
      await auth.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged will handle setting the user state and profile fetching in real mode.
      return true;
    } catch (error: any) {
      console.error("Login failed:", error);

      // Fallback: check if user exists in Firestore collection 'users' with matching email
      try {
        const snap = await db.collection('users').where('email', '==', lowerCaseEmail).limit(1).get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          const data = doc.data();
          if (data.password === password) {
            setIsDemo(false);
            const roleSource = String(data.role || data.papel || '').toUpperCase().trim();
            let role = UserRole.DRIVER;
            if (roleSource === 'ADMIN' || roleSource === 'ADMINISTRADOR') role = UserRole.ADMIN;
            else if (roleSource === 'GERENTE' || roleSource === 'MANAGER' || roleSource === 'GESTOR') role = UserRole.MANAGER;
            else if (roleSource === 'PROPRIETÁRIO' || roleSource === 'OWNER') role = UserRole.OWNER;
            setUser({ id: doc.id, ...data, role } as User);
            return true;
          }
        }
      } catch (fsLookupErr) {
        console.warn("Firestore fallback lookup error:", fsLookupErr);
      }

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
