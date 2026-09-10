import { useState, useEffect, useCallback, useRef } from 'react';
import { db, firestore } from '../firebase';
import { TabletDevice, TabletPendingPairing, User, UserRole, Company } from '../types';
import { DEFAULT_COMPANY, MOCK_COMPANIES } from '../data/adTechDemoData';

const TABLET_SESSION_KEY = 'rota_tvde_tablet_session';

export interface TabletSession {
  tabletId: string;
  matricula: string;
  companyId: string;
  viaturaId?: string;
  driverId?: string;
  driverName?: string;
  tabletModel?: string;
  activatedAt: string;
}

export function useTabletPairing() {
  const [session, setSession] = useState<TabletSession | null>(() => {
    try {
      const saved = localStorage.getItem(TABLET_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [tabletDoc, setTabletDoc] = useState<TabletDevice | null>(null);
  const [activeDriver, setActiveDriver] = useState<{ id: string; name: string; photo?: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPin, setPendingPin] = useState<string>('');
  const [pinTimeLeft, setPinTimeLeft] = useState<number>(600); // 10 minutes
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Online status listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save session changes to localStorage
  const saveSession = useCallback((newSession: TabletSession | null) => {
    setSession(newSession);
    if (newSession) {
      localStorage.setItem(TABLET_SESSION_KEY, JSON.stringify(newSession));
    } else {
      localStorage.removeItem(TABLET_SESSION_KEY);
    }
  }, []);

  // Method 1: Direct Fast Activation by Master Key + Matricula
  const activateByMasterKey = useCallback(async ({
    masterKey,
    matricula,
    tabletModel
  }: {
    masterKey: string;
    matricula: string;
    tabletModel?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const cleanKey = masterKey.trim().toUpperCase();
      const cleanMatricula = matricula.trim().toUpperCase();

      if (!cleanKey || !cleanMatricula) {
        const msg = 'Introduza o Código Mestre da Frota e a Matrícula do veículo.';
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }

      // 1. Validate Master Key against companies in Firestore or Fallback
      let matchedCompany: Company | undefined;
      try {
        const companySnap = await db.collection('companies').get();
        if (!companySnap.empty) {
          const companiesList = companySnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Company));
          matchedCompany = companiesList.find(c => 
            (c.masterTabletCode && c.masterTabletCode.toUpperCase() === cleanKey) ||
            (!c.masterTabletCode && cleanKey === 'ASFALTO2026')
          );
        }
      } catch (e) {
        console.warn('Could not read companies from firestore:', e);
      }

      if (!matchedCompany) {
        // Check local demo companies
        matchedCompany = MOCK_COMPANIES.find(c => 
          (c.masterTabletCode && c.masterTabletCode.toUpperCase() === cleanKey) ||
          cleanKey === 'ASFALTO2026'
        );
      }

      if (!matchedCompany && cleanKey !== 'ASFALTO2026') {
        const msg = 'Código Mestre da Frota inválido. Confirme com a administração.';
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }

      const targetCompany = matchedCompany || DEFAULT_COMPANY;
      const tabletId = `tablet_${cleanMatricula.replace(/[^A-Z0-9]/g, '_')}`;

      // 2. Identify driver currently assigned to this matricula
      let driverId = '';
      let driverName = 'Motorista Parceiro';

      try {
        const usersSnap = await db.collection('users')
          .where('matricula', '==', cleanMatricula)
          .where('role', '==', UserRole.DRIVER)
          .limit(1)
          .get();

        if (!usersSnap.empty) {
          const driverData = usersSnap.docs[0].data();
          driverId = usersSnap.docs[0].id;
          driverName = driverData.name || driverData.nome || cleanMatricula;
        }
      } catch (e) {
        console.warn('Could not query users by matricula:', e);
      }

      const resolvedTabletModel = tabletModel || (
        /Android/i.test(navigator.userAgent) 
          ? 'Samsung Galaxy Tab A9+ 11" 5G' 
          : /iPad/i.test(navigator.userAgent) 
            ? 'Apple iPad 10.9" Encosto' 
            : 'Tablet TVDE Kiosk AdTech'
      );

      // 3. Upsert tablet document in Firestore
      const newTabletData: TabletDevice = {
        id: tabletId,
        companyId: targetCompany.id,
        matricula: cleanMatricula,
        viaturaId: cleanMatricula,
        motoristaAtualId: driverId,
        motoristaAtualNome: driverName,
        status: 'online',
        impressoesTotais: 0,
        scansQR: 0,
        lastPing: new Date(),
        tabletModel: resolvedTabletModel,
        batteryLevel: 96,
        appVersion: 'ROTA-AD-5.0',
        remoteCommand: null
      };

      try {
        await db.collection('tablets').doc(tabletId).set(newTabletData, { merge: true });
        // Also sync with ad_devices for backwards compatibility
        await db.collection('ad_devices').doc(tabletId).set({
          id: tabletId,
          companyId: targetCompany.id,
          matricula: cleanMatricula,
          driverId,
          driverName,
          tabletModel: resolvedTabletModel,
          status: 'ONLINE',
          batteryLevel: 96,
          lastPing: new Date(),
          totalImpressions: 0,
          totalScans: 0,
          earnedBonus: 0,
          appVersion: 'ROTA-AD-5.0'
        }, { merge: true });
      } catch (err) {
        console.warn('Saved tablet locally, firestore sync note:', err);
      }

      // 4. Create persistent session
      const newSession: TabletSession = {
        tabletId,
        matricula: cleanMatricula,
        companyId: targetCompany.id,
        viaturaId: cleanMatricula,
        driverId,
        driverName,
        tabletModel: resolvedTabletModel,
        activatedAt: new Date().toISOString()
      };

      saveSession(newSession);
      setActiveDriver({ id: driverId, name: driverName });
      setTabletDoc(newTabletData);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Erro ao ativar tablet com Código Mestre.';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  }, [saveSession]);

  // Method 2: Generate 6-Digit PIN & listen for Desktop Confirmation
  const generateNewPin = useCallback(async () => {
    // Generate 6 random digits: e.g. "482910" -> "482-910"
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const pinStr = String(randomNum);
    const formatted = `${pinStr.slice(0, 3)}-${pinStr.slice(3)}`;
    setPendingPin(formatted);
    setPinTimeLeft(600); // 10 mins

    const resolvedTabletModel = /Android/i.test(navigator.userAgent) 
      ? 'Samsung Galaxy Tab A9+ 11" 5G' 
      : /iPad/i.test(navigator.userAgent) 
        ? 'Apple iPad 10.9" Encosto' 
        : 'Tablet TVDE Kiosk AdTech';

    const pendingData: TabletPendingPairing = {
      pin: pinStr,
      status: 'WAITING_APPROVAL',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      tabletModel: resolvedTabletModel
    };

    try {
      await db.collection('tablets_pendentes').doc(pinStr).set(pendingData);
    } catch (e) {
      console.warn('Could not register pending tablet in firestore:', e);
    }
  }, []);

  // Listen to pending PIN in Firestore for admin confirmation
  useEffect(() => {
    if (session || !pendingPin) return;

    const cleanPin = pendingPin.replace(/[^0-9]/g, '');
    if (cleanPin.length !== 6) return;

    try {
      const unsubscribe = db.collection('tablets_pendentes').doc(cleanPin).onSnapshot(
        (docSnap: any) => {
          if (!docSnap.exists) return;
          const data = docSnap.data() as TabletPendingPairing;
          if (data.status === 'APPROVED' && data.matricula) {
            // Admin approved tablet from Desktop Panel!
            const tabletId = data.tabletId || `tablet_${data.matricula.replace(/[^A-Z0-9]/g, '_')}`;
            const newSession: TabletSession = {
              tabletId,
              matricula: data.matricula,
              companyId: data.companyId || DEFAULT_COMPANY.id,
              viaturaId: data.viaturaId || data.matricula,
              driverId: data.driverId || '',
              driverName: data.driverName || 'Motorista Parceiro',
              tabletModel: data.tabletModel || 'Tablet TVDE Kiosk',
              activatedAt: new Date().toISOString()
            };

            saveSession(newSession);
            setActiveDriver({ id: newSession.driverId || '', name: newSession.driverName || 'Motorista Parceiro' });

            // Clean up approved pending document
            db.collection('tablets_pendentes').doc(cleanPin).delete().catch(() => {});
          }
        },
        (err: any) => {
          console.warn('Listener error on tablets_pendentes:', err);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Error setting up tablets_pendentes listener:', e);
    }
  }, [session, pendingPin, saveSession]);

  // Countdown timer for pending PIN
  useEffect(() => {
    if (session || !pendingPin) return;

    const timer = setInterval(() => {
      setPinTimeLeft(prev => {
        if (prev <= 1) {
          generateNewPin(); // Automatically refresh expired PIN
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, pendingPin, generateNewPin]);

  // Dynamic Driver & Remote Command Synchronization for Paired Tablet
  useEffect(() => {
    if (!session?.tabletId) return;

    // 1. Listen to tablet document for remote commands (RELOAD / RESET)
    const unsubTablet = db.collection('tablets').doc(session.tabletId).onSnapshot(
      (docSnap: any) => {
        if (!docSnap.exists) return;
        const data = docSnap.data() as TabletDevice;
        setTabletDoc(data);

        // Check for Remote Commands from Desktop
        if (data.remoteCommand === 'RESET') {
          // Clear session and return to pairing screen
          db.collection('tablets').doc(session.tabletId).update({
            remoteCommand: null,
            status: 'standby'
          }).catch(() => {});
          saveSession(null);
          setActiveDriver(null);
        } else if (data.remoteCommand === 'RELOAD') {
          // Trigger media reload
          db.collection('tablets').doc(session.tabletId).update({
            remoteCommand: null
          }).catch(() => {});
          setReloadTrigger(prev => prev + 1);
        }
      },
      (err: any) => {
        console.warn('Tablet realtime listener error:', err);
      }
    );

    // 2. Listen to users collection to dynamically update driver assigned to this matricula
    const unsubUsers = db.collection('users')
      .where('matricula', '==', session.matricula)
      .where('role', '==', UserRole.DRIVER)
      .onSnapshot(
        (snapshot: any) => {
          if (!snapshot.empty) {
            const activeDriverDoc = snapshot.docs.find((d: any) => d.data().status !== 'ARCHIVED') || snapshot.docs[0];
            const driverData = activeDriverDoc.data();
            const driverName = driverData.name || driverData.nome || session.matricula;
            const driverId = activeDriverDoc.id;

            setActiveDriver({
              id: driverId,
              name: driverName,
              photo: driverData.photoUrl || driverData.photo || undefined
            });

            // Update session and tabletDoc if driver changed
            if (session.driverId !== driverId || session.driverName !== driverName) {
              const updatedSession = { ...session, driverId, driverName };
              saveSession(updatedSession);
              db.collection('tablets').doc(session.tabletId).update({
                motoristaAtualId: driverId,
                motoristaAtualNome: driverName
              }).catch(() => {});
            }
          }
        },
        (err: any) => {
          console.warn('Driver dynamic sync error:', err);
        }
      );

    // 3. Send Heartbeat ping to Firestore every 30 seconds
    const pingTimer = setInterval(async () => {
      if (!navigator.onLine) return;
      try {
        let batteryLevel = 94;
        if ('getBattery' in navigator) {
          const battery: any = await (navigator as any).getBattery();
          batteryLevel = Math.round(battery.level * 100);
        }

        db.collection('tablets').doc(session.tabletId).set({
          lastPing: new Date(),
          batteryLevel,
          status: 'online'
        }, { merge: true }).catch(() => {});
      } catch (e) {
        // Non-critical
      }
    }, 30000);

    return () => {
      unsubTablet();
      unsubUsers();
      clearInterval(pingTimer);
    };
  }, [session, saveSession]);

  // Disconnect / Reset Tablet locally
  const unpairTablet = useCallback(async () => {
    if (session?.tabletId) {
      try {
        await db.collection('tablets').doc(session.tabletId).update({
          status: 'standby',
          remoteCommand: null
        });
      } catch (e) {
        console.warn('Could not update tablet status to standby:', e);
      }
    }
    saveSession(null);
    setActiveDriver(null);
    setTabletDoc(null);
  }, [session, saveSession]);

  return {
    session,
    isPaired: !!session,
    tabletDoc,
    activeDriver,
    loading,
    error,
    pendingPin,
    pinTimeLeft,
    isOnline,
    reloadTrigger,
    activateByMasterKey,
    generateNewPin,
    unpairTablet
  };
}
