import React from 'react';
import Button from './ui/Button';

interface UpdateNotificationProps {
  onUpdate: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdate }) => {
  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 w-full max-w-sm p-4 bg-gray-800 border-2 border-blue-500 rounded-lg shadow-2xl"
    >
      <div className="flex items-start gap-4">
         <span className="text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" />
            </svg>
         </span>
         <div className="flex-1">
            <strong className="block font-medium text-white">Nova versão disponível!</strong>
            <p className="mt-1 text-sm text-gray-300">
              Uma nova versão da aplicação foi descarregada. Atualize para ver as novidades.
            </p>
            <div className="mt-4 flex gap-2">
                <Button onClick={onUpdate} variant="primary" className="w-full">
                    Atualizar Agora
                </Button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
