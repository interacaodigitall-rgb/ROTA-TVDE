import React from 'react';
import { useTabletPairing } from '../../hooks/useTabletPairing';
import { TabletActivation } from './TabletActivation';
import { PassengerTabletPlayer } from './PassengerTabletPlayer';
import { useCompany } from '../../hooks/useCompany';

interface TabletDisplayRouteProps {
  onClose?: () => void;
  isStandaloneKiosk?: boolean;
}

export const TabletDisplayRoute: React.FC<TabletDisplayRouteProps> = ({
  onClose,
  isStandaloneKiosk = true
}) => {
  const {
    session,
    isPaired,
    tabletDoc,
    activeDriver,
    loading,
    error,
    pendingPin,
    pinTimeLeft,
    isOnline,
    activateByMasterKey,
    generateNewPin,
    unpairTablet
  } = useTabletPairing();

  const { company } = useCompany();

  // If not paired yet, render the Dual-Method Hybrid Activation Screen
  if (!isPaired || !session) {
    return (
      <TabletActivation
        pendingPin={pendingPin}
        pinTimeLeft={pinTimeLeft}
        loading={loading}
        error={error}
        isOnline={isOnline}
        onActivateByMasterKey={activateByMasterKey}
        onGenerateNewPin={generateNewPin}
        defaultMasterKey={company?.masterTabletCode || 'ASFALTO2026'}
        fleetMatriculas={['45-TX-90', '82-QA-14', '19-ZZ-03', '61-MR-77', '34-AB-12']}
        onExitPreview={onClose}
      />
    );
  }

  // If paired, render the full-screen passenger tablet media player
  return (
    <PassengerTabletPlayer
      matricula={session.matricula}
      driverName={activeDriver?.name || session.driverName || 'Motorista Parceiro'}
      driverPhoto={activeDriver?.photo}
      driverId={activeDriver?.id || session.driverId}
      tabletId={session.tabletId}
      companyName={company?.name || 'Asfalto Cativante'}
      onClose={onClose}
      onUnpairTablet={unpairTablet}
      isStandaloneKiosk={isStandaloneKiosk}
    />
  );
};

export default TabletDisplayRoute;
