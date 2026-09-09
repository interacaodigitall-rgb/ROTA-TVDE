import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { AdCampaign, AdDevice } from '../types';
import { MOCK_AD_CAMPAIGNS, MOCK_AD_DEVICES } from '../data/adTechDemoData';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';

interface AdTechContextType {
  campaigns: AdCampaign[];
  devices: AdDevice[];
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
  recordImpression: (campaignId: string, deviceId?: string) => Promise<void>;
  recordScan: (campaignId: string, deviceId?: string) => Promise<void>;
  getDriverAdMetrics: (driverId: string) => { impressions: number; scans: number; earnedBonus: number; device?: AdDevice };
}

export const AdTechContext = createContext<AdTechContextType | undefined>(undefined);

export const AdTechProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isDemo } = useAuth();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(MOCK_AD_CAMPAIGNS);
  const [devices, setDevices] = useState<AdDevice[]>(MOCK_AD_DEVICES);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync with Firestore or fallback to mock
  useEffect(() => {
    if (isDemo) {
      setCampaigns(MOCK_AD_CAMPAIGNS);
      setDevices(MOCK_AD_DEVICES);
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
            MOCK_AD_DEVICES.forEach(d => {
              db.collection('ad_devices').doc(d.id).set(d).catch(() => {});
            });
          }
        },
        (err: any) => {
          console.warn("Using fallback devices:", err);
          setDevices(MOCK_AD_DEVICES);
        }
      );

      return () => {
        unsubCampaigns();
        unsubDevices();
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
  const recordImpression = useCallback(async (campaignId: string, deviceId?: string) => {
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

    if (deviceId) {
      setDevices(prev => prev.map(d => {
        if (d.id === deviceId || d.matricula === deviceId) {
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
    }
  }, [campaigns]);

  // Record QR Scan from passenger interacting with the in-car ad
  const recordScan = useCallback(async (campaignId: string, deviceId?: string) => {
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

    if (deviceId) {
      setDevices(prev => prev.map(d => {
        if (d.id === deviceId || d.matricula === deviceId) {
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
    }
  }, [campaigns]);

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
      getDriverAdMetrics
    }}>
      {children}
    </AdTechContext.Provider>
  );
};
