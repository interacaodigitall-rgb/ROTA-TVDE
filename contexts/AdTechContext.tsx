import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { AdCampaign, AdDevice, TabletDevice, UserRole } from '../types';
import { MOCK_AD_CAMPAIGNS, MOCK_AD_DEVICES, DEFAULT_COMPANY } from '../data/adTechDemoData';
import { db, firestore } from '../firebase';
import { useAuth } from '../hooks/useAuth';

interface AdTechContextType {
  campaigns: AdCampaign[];
  devices: AdDevice[];
  tablets: TabletDevice[];
  activeCampaigns: AdCampaign[];
  totalAdRevenue: number;
  totalImpressions: number;
  totalScans: number;
  totalDriverBonusDistributed: number;
  loading: boolean;
  addCampaign: (campaign: Omit<AdCampaign, 'id' | 'impressions' | 'scans' | 'revenue'>) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<AdCampaign>) => Promise<void>;
  toggleCampaignStatus: (id: string) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  addDevice: (device: Omit<AdDevice, 'id' | 'totalImpressions' | 'totalScans' | 'earnedBonus'>) => Promise<void>;
  updateDevice: (id: string, updates: Partial<AdDevice>) => Promise<void>;
  recordImpression: (campaignId: string, deviceId?: string, matricula?: string, driverId?: string) => Promise<void>;
  recordScan: (campaignId: string, deviceId?: string, matricula?: string, driverId?: string) => Promise<void>;
  getDriverAdMetrics: (driverId: string) => { impressions: number; scans: number; earnedBonus: number; device?: AdDevice };
  approveTabletByPin: (pin: string, matricula: string, driverId?: string, driverName?: string, companyId?: string) => Promise<{ success: boolean; error?: string }>;
  sendRemoteTabletCommand: (tabletId: string, command: 'RELOAD' | 'RESET') => Promise<void>;
  deleteTabletDevice: (tabletId: string) => Promise<void>;
}

export const AdTechContext = createContext<AdTechContextType | undefined>(undefined);

export const AdTechProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isDemo } = useAuth();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(MOCK_AD_CAMPAIGNS);
  const [devices, setDevices] = useState<AdDevice[]>(MOCK_AD_DEVICES);
  const [tablets, setTablets] = useState<TabletDevice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync with Firestore or fallback to mock
  useEffect(() => {
    if (isDemo) {
      setCampaigns(MOCK_AD_CAMPAIGNS);
      setDevices(MOCK_AD_DEVICES);
      setTablets(MOCK_AD_DEVICES.map(d => ({
        id: `tablet_${d.matricula.replace(/[^A-Z0-9]/g, '_')}`,
        companyId: d.companyId || DEFAULT_COMPANY.id,
        matricula: d.matricula,
        viaturaId: d.matricula,
        motoristaAtualId: d.driverId || '',
        motoristaAtualNome: d.driverName || 'Motorista Parceiro',
        status: d.status.toLowerCase() as 'online' | 'offline' | 'standby',
        impressoesTotais: d.totalImpressions,
        scansQR: d.totalScans,
        lastPing: d.lastPing,
        tabletModel: d.tabletModel,
        batteryLevel: d.batteryLevel,
        appVersion: d.appVersion,
        earnedBonus: d.earnedBonus
      })));
      return;
    }

    try {
      // 1. Listen to ad_campaigns
      const unsubCampaigns = db.collection('ad_campaigns').onSnapshot(
        (snapshot: any) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data()
            } as AdCampaign));
            setCampaigns(list);
          } else {
            setCampaigns(MOCK_AD_CAMPAIGNS);
            MOCK_AD_CAMPAIGNS.forEach(c => {
              db.collection('ad_campaigns').doc(c.id).set(c).catch(() => {});
            });
          }
        },
        (err: any) => {
          console.warn("Using fallback campaigns:", err);
          setCampaigns(MOCK_AD_CAMPAIGNS);
        }
      );

      // 2. Listen to ad_devices
      const unsubDevices = db.collection('ad_devices').onSnapshot(
        (snapshot: any) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data()
            } as AdDevice));
            setDevices(list);
          } else {
            setDevices(MOCK_AD_DEVICES);
          }
        },
        (err: any) => {
          console.warn("Using fallback devices:", err);
          setDevices(MOCK_AD_DEVICES);
        }
      );

      // 3. Listen to tablets collection (Dedicated Tablet AdTech collection)
      const unsubTablets = db.collection('tablets').onSnapshot(
        (snapshot: any) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data()
            } as TabletDevice));
            setTablets(list);

            // Also keep devices state in sync for unified views
            setDevices(prevDevices => {
              const merged = [...prevDevices];
              list.forEach(tab => {
                const idx = merged.findIndex(d => d.matricula === tab.matricula || d.id === tab.id);
                const devItem: AdDevice = {
                  id: tab.id,
                  companyId: tab.companyId,
                  matricula: tab.matricula,
                  driverId: tab.motoristaAtualId,
                  driverName: tab.motoristaAtualNome,
                  tabletModel: tab.tabletModel || 'Tablet TVDE Encosto',
                  status: (tab.status?.toUpperCase() as any) || 'ONLINE',
                  batteryLevel: tab.batteryLevel || 95,
                  lastPing: tab.lastPing || new Date(),
                  totalImpressions: tab.impressoesTotais || 0,
                  totalScans: tab.scansQR || 0,
                  earnedBonus: tab.earnedBonus || 0,
                  appVersion: tab.appVersion || 'ROTA-AD-5.0'
                };
                if (idx >= 0) {
                  merged[idx] = { ...merged[idx], ...devItem };
                } else {
                  merged.push(devItem);
                }
              });
              return merged;
            });
          } else {
            // Seed initial mock tablets for demo if none
            const initialTabs: TabletDevice[] = MOCK_AD_DEVICES.map(d => ({
              id: `tablet_${d.matricula.replace(/[^A-Z0-9]/g, '_')}`,
              companyId: d.companyId || DEFAULT_COMPANY.id,
              matricula: d.matricula,
              viaturaId: d.matricula,
              motoristaAtualId: d.driverId || '',
              motoristaAtualNome: d.driverName || 'Motorista Parceiro',
              status: 'online',
              impressoesTotais: d.totalImpressions,
              scansQR: d.totalScans,
              lastPing: new Date(),
              tabletModel: d.tabletModel,
              batteryLevel: d.batteryLevel,
              appVersion: 'ROTA-AD-5.0',
              earnedBonus: d.earnedBonus
            }));
            setTablets(initialTabs);
            initialTabs.forEach(t => {
              db.collection('tablets').doc(t.id).set(t).catch(() => {});
            });
          }
        },
        (err: any) => {
          console.warn("Using fallback tablets:", err);
        }
      );

      return () => {
        unsubCampaigns();
        unsubDevices();
        unsubTablets();
      };
    } catch (e) {
      setCampaigns(MOCK_AD_CAMPAIGNS);
      setDevices(MOCK_AD_DEVICES);
    }
  }, [isDemo]);

  const activeCampaigns = useMemo(() => {
    return campaigns.filter(c => c.status === 'ACTIVE');
  }, [campaigns]);

  const totalAdRevenue = useMemo(() => {
    return campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
  }, [campaigns]);

  const totalImpressions = useMemo(() => {
    return campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
  }, [campaigns]);

  const totalScans = useMemo(() => {
    return campaigns.reduce((sum, c) => sum + (c.scans || 0), 0);
  }, [campaigns]);

  const totalDriverBonusDistributed = useMemo(() => {
    return devices.reduce((sum, d) => sum + (d.earnedBonus || 0), 0);
  }, [devices]);

  const addCampaign = useCallback(async (campaignData: Omit<AdCampaign, 'id' | 'impressions' | 'scans' | 'revenue'>) => {
    const id = `camp-${Date.now()}`;
    const newCamp: AdCampaign = {
      ...campaignData,
      id,
      impressions: 0,
      scans: 0,
      revenue: 0,
      driverBonusRate: campaignData.driverBonusRate || 30
    };

    setCampaigns(prev => [newCamp, ...prev]);

    if (!isDemo) {
      try {
        await db.collection('ad_campaigns').doc(id).set(newCamp);
      } catch (err) {
        console.error("Error saving campaign in firestore:", err);
      }
    }
  }, [isDemo]);

  const updateCampaign = useCallback(async (id: string, updates: Partial<AdCampaign>) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

    if (!isDemo) {
      try {
        await db.collection('ad_campaigns').doc(id).update(updates);
      } catch (err) {
        console.error("Error updating campaign in firestore:", err);
      }
    }
  }, [isDemo]);

  const toggleCampaignStatus = useCallback(async (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;
    const nextStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await updateCampaign(id, { status: nextStatus });
  }, [campaigns, updateCampaign]);

  const deleteCampaign = useCallback(async (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));

    if (!isDemo) {
      try {
        await db.collection('ad_campaigns').doc(id).delete();
      } catch (err) {
        console.error("Error deleting campaign:", err);
      }
    }
  }, [isDemo]);

  const addDevice = useCallback(async (deviceData: Omit<AdDevice, 'id' | 'totalImpressions' | 'totalScans' | 'earnedBonus'>) => {
    const id = `dev-${Date.now()}`;
    const newDev: AdDevice = {
      ...deviceData,
      id,
      totalImpressions: 0,
      totalScans: 0,
      earnedBonus: 0,
      lastPing: new Date(),
      status: 'ONLINE'
    };

    setDevices(prev => [newDev, ...prev]);

    if (!isDemo) {
      try {
        await db.collection('ad_devices').doc(id).set(newDev);
      } catch (err) {
        console.error("Error adding device in firestore:", err);
      }
    }
  }, [isDemo]);

  const updateDevice = useCallback(async (id: string, updates: Partial<AdDevice>) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));

    if (!isDemo) {
      try {
        await db.collection('ad_devices').doc(id).update(updates);
      } catch (err) {
        console.error("Error updating device in firestore:", err);
      }
    }
  }, [isDemo]);

  // Record impression from in-car tablet player
  const recordImpression = useCallback(async (
    campaignId: string, 
    deviceId?: string, 
    matricula?: string, 
    driverId?: string
  ) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    // CPM revenue: (cpm / 1000) per view
    const viewRevenue = (campaign.cpm || 15) / 1000;
    const driverBonus = viewRevenue * ((campaign.driverBonusRate || 30) / 100);

    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        return {
          ...c,
          impressions: c.impressions + 1,
          revenue: Number((c.revenue + viewRevenue).toFixed(3))
        };
      }
      return c;
    }));

    if (!isDemo) {
      try {
        db.collection('ad_campaigns').doc(campaignId).update({
          impressions: (campaign.impressions || 0) + 1,
          revenue: Number(((campaign.revenue || 0) + viewRevenue).toFixed(3))
        }).catch(() => {});
      } catch (e) {}
    }

    // Update tablet device
    const targetTabletId = deviceId || (matricula ? `tablet_${matricula.replace(/[^A-Z0-9]/g, '_')}` : undefined);
    if (targetTabletId) {
      setTablets(prev => prev.map(t => {
        if (t.id === targetTabletId || t.matricula === matricula) {
          return {
            ...t,
            impressoesTotais: (t.impressoesTotais || 0) + 1,
            earnedBonus: Number(((t.earnedBonus || 0) + driverBonus).toFixed(3)),
            lastPing: new Date(),
            status: 'online'
          };
        }
        return t;
      }));

      setDevices(prev => prev.map(d => {
        if (d.id === targetTabletId || d.matricula === matricula) {
          return {
            ...d,
            totalImpressions: d.totalImpressions + 1,
            earnedBonus: Number((d.earnedBonus + driverBonus).toFixed(3)),
            lastPing: new Date(),
            status: 'ONLINE'
          };
        }
        return d;
      }));

      if (!isDemo) {
        try {
          db.collection('tablets').doc(targetTabletId).set({
            impressoesTotais: firestore.FieldValue.increment(1),
            earnedBonus: firestore.FieldValue.increment(driverBonus),
            lastPing: new Date(),
            status: 'online'
          }, { merge: true }).catch(() => {});
        } catch (e) {}
      }
    }

    // Credit bonus to active driver account in Firestore
    if (driverId && !isDemo) {
      try {
        db.collection('users').doc(driverId).set({
          adTechAccumulatedBonus: firestore.FieldValue.increment(driverBonus)
        }, { merge: true }).catch(() => {});
      } catch (e) {}
    }
  }, [campaigns, isDemo]);

  // Record QR Scan from passenger interacting with the in-car ad
  const recordScan = useCallback(async (
    campaignId: string, 
    deviceId?: string, 
    matricula?: string, 
    driverId?: string
  ) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const scanReward = campaign.scanReward || 0.50;
    const driverBonus = scanReward * ((campaign.driverBonusRate || 30) / 100);

    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        return {
          ...c,
          scans: c.scans + 1,
          revenue: Number((c.revenue + scanReward).toFixed(2))
        };
      }
      return c;
    }));

    if (!isDemo) {
      try {
        db.collection('ad_campaigns').doc(campaignId).update({
          scans: (campaign.scans || 0) + 1,
          revenue: Number(((campaign.revenue || 0) + scanReward).toFixed(2))
        }).catch(() => {});
      } catch (e) {}
    }

    const targetTabletId = deviceId || (matricula ? `tablet_${matricula.replace(/[^A-Z0-9]/g, '_')}` : undefined);
    if (targetTabletId) {
      setTablets(prev => prev.map(t => {
        if (t.id === targetTabletId || t.matricula === matricula) {
          return {
            ...t,
            scansQR: (t.scansQR || 0) + 1,
            earnedBonus: Number(((t.earnedBonus || 0) + driverBonus).toFixed(2)),
            lastPing: new Date(),
            status: 'online'
          };
        }
        return t;
      }));

      setDevices(prev => prev.map(d => {
        if (d.id === targetTabletId || d.matricula === matricula) {
          return {
            ...d,
            totalScans: d.totalScans + 1,
            earnedBonus: Number((d.earnedBonus + driverBonus).toFixed(2)),
            lastPing: new Date(),
            status: 'ONLINE'
          };
        }
        return d;
      }));

      if (!isDemo) {
        try {
          db.collection('tablets').doc(targetTabletId).set({
            scansQR: firestore.FieldValue.increment(1),
            earnedBonus: firestore.FieldValue.increment(driverBonus),
            lastPing: new Date(),
            status: 'online'
          }, { merge: true }).catch(() => {});
        } catch (e) {}
      }
    }

    // Credit bonus to active driver in Firestore
    if (driverId && !isDemo) {
      try {
        db.collection('users').doc(driverId).set({
          adTechAccumulatedBonus: firestore.FieldValue.increment(driverBonus)
        }, { merge: true }).catch(() => {});
      } catch (e) {}
    }
  }, [campaigns, isDemo]);

  // Method 2 Desktop Action: Approve tablet pairing by 6-digit PIN
  const approveTabletByPin = useCallback(async (
    pin: string, 
    matricula: string, 
    driverId?: string, 
    driverName?: string, 
    companyId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanPin = pin.replace(/[^0-9]/g, '');
    const cleanMatricula = matricula.trim().toUpperCase();

    if (cleanPin.length !== 6) {
      return { success: false, error: 'O código PIN deve conter exatamente 6 dígitos.' };
    }
    if (!cleanMatricula) {
      return { success: false, error: 'Selecione ou insira a matrícula da viatura.' };
    }

    const tabletId = `tablet_${cleanMatricula.replace(/[^A-Z0-9]/g, '_')}`;
    const resolvedCompanyId = companyId || DEFAULT_COMPANY.id;

    const tabletData: TabletDevice = {
      id: tabletId,
      companyId: resolvedCompanyId,
      matricula: cleanMatricula,
      viaturaId: cleanMatricula,
      motoristaAtualId: driverId || '',
      motoristaAtualNome: driverName || 'Motorista Parceiro',
      status: 'online',
      impressoesTotais: 0,
      scansQR: 0,
      lastPing: new Date(),
      tabletModel: 'Samsung Galaxy Tab A9+ 11" 5G',
      batteryLevel: 98,
      appVersion: 'ROTA-AD-5.0',
      remoteCommand: null
    };

    setTablets(prev => {
      const filtered = prev.filter(t => t.id !== tabletId && t.matricula !== cleanMatricula);
      return [tabletData, ...filtered];
    });

    if (!isDemo) {
      try {
        // Update tablets_pendentes to notify tablet in real time
        await db.collection('tablets_pendentes').doc(cleanPin).set({
          status: 'APPROVED',
          matricula: cleanMatricula,
          companyId: resolvedCompanyId,
          tabletId,
          driverId: driverId || '',
          driverName: driverName || 'Motorista Parceiro'
        }, { merge: true });

        // Upsert tablet in collection
        await db.collection('tablets').doc(tabletId).set(tabletData, { merge: true });

        // Upsert ad_devices
        await db.collection('ad_devices').doc(tabletId).set({
          id: tabletId,
          companyId: resolvedCompanyId,
          matricula: cleanMatricula,
          driverId,
          driverName,
          tabletModel: tabletData.tabletModel,
          status: 'ONLINE',
          batteryLevel: 98,
          lastPing: new Date(),
          totalImpressions: 0,
          totalScans: 0,
          earnedBonus: 0,
          appVersion: 'ROTA-AD-5.0'
        }, { merge: true });
      } catch (err: any) {
        console.error('Error approving tablet by PIN:', err);
        return { success: false, error: err?.message || 'Falha ao comunicar com o servidor.' };
      }
    }

    return { success: true };
  }, [isDemo]);

  // Send remote command from Desktop to in-car tablet
  const sendRemoteTabletCommand = useCallback(async (tabletId: string, command: 'RELOAD' | 'RESET') => {
    setTablets(prev => prev.map(t => t.id === tabletId ? { ...t, remoteCommand: command } : t));

    if (!isDemo) {
      try {
        await db.collection('tablets').doc(tabletId).update({
          remoteCommand: command,
          remoteCommandTimestamp: new Date()
        });
      } catch (e) {
        console.error('Error sending remote command:', e);
      }
    }
  }, [isDemo]);

  // Delete/unpair tablet from management panel
  const deleteTabletDevice = useCallback(async (tabletId: string) => {
    setTablets(prev => prev.filter(t => t.id !== tabletId));
    setDevices(prev => prev.filter(d => d.id !== tabletId));

    if (!isDemo) {
      try {
        // Send reset command first to unpair in-car tablet if online
        await db.collection('tablets').doc(tabletId).update({
          remoteCommand: 'RESET',
          status: 'standby'
        });
        setTimeout(async () => {
          await db.collection('tablets').doc(tabletId).delete().catch(() => {});
          await db.collection('ad_devices').doc(tabletId).delete().catch(() => {});
        }, 3000);
      } catch (e) {
        console.error('Error deleting tablet:', e);
      }
    }
  }, [isDemo]);

  const getDriverAdMetrics = useCallback((driverId: string) => {
    const device = devices.find(d => d.driverId === driverId);
    if (!device) {
      return {
        impressions: 0,
        scans: 0,
        earnedBonus: 0
      };
    }
    return {
      impressions: device.totalImpressions,
      scans: device.totalScans,
      earnedBonus: device.earnedBonus,
      device
    };
  }, [devices]);

  return (
    <AdTechContext.Provider value={{
      campaigns,
      devices,
      tablets,
      activeCampaigns,
      totalAdRevenue,
      totalImpressions,
      totalScans,
      totalDriverBonusDistributed,
      loading,
      addCampaign,
      updateCampaign,
      toggleCampaignStatus,
      deleteCampaign,
      addDevice,
      updateDevice,
      recordImpression,
      recordScan,
      getDriverAdMetrics,
      approveTabletByPin,
      sendRemoteTabletCommand,
      deleteTabletDevice
    }}>
      {children}
    </AdTechContext.Provider>
  );
};
