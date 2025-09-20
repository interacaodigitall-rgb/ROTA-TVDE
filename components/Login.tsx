import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';
import Card from './ui/Card';

interface DemoUserCardProps {
  title: string;
  description: string;
  onLogin: () => void;
  isLoading: boolean;
  icon: JSX.Element;
}

const DemoUserCard: React.FC<DemoUserCardProps> = ({ title, description, onLogin, isLoading, icon }) => (
    <Card className="flex flex-col text-center items-center transform hover:scale-105 transition-transform duration-300">
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4 text-yellow-400">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6 flex-grow">{description}</p>
        <Button onClick={onLogin} disabled={isLoading} className="w-full">
            {isLoading ? 'A entrar...' : 'Entrar'}
        </Button>
    </Card>
);


const Login: React.FC = () => {
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const { login, error: authError } = useAuth();

  const handleLogin = async (userType: string, email: string, pass: string) => {
    setLoadingUser(userType);
    await login(email, pass);
    // The loading state will persist on failure, which is okay as the user
    // can try another profile. It will be cleared on success due to component unmount.
    // We will reset it here to allow retries on the same button.
    setLoadingUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4 space-y-8">
        <div>
            <h1 className="text-5xl font-bold text-center text-white">
              ROTA TVDE 5.0
            </h1>
            <p className="text-center text-yellow-400 font-semibold mt-2 text-lg">
                Versão de Demonstração
            </p>
        </div>
      
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
            <DemoUserCard
                title="Administrador"
                description="Aceda para gerir motoristas, criar cálculos e visualizar relatórios."
                isLoading={loadingUser === 'admin'}
                onLogin={() => handleLogin('admin', 'admin@rotarapida.pt', '1234')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            />
            <DemoUserCard
                title="Motorista (Frota)"
                description="Veja os seus resumos semanais, aceite ou peça revisões (modelo de frota)."
                isLoading={loadingUser === 'frota'}
                onLogin={() => handleLogin('frota', 'frota@rotatvde.pt', '123456')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}

            />
            <DemoUserCard
                title="Motorista (Slot)"
                description="Veja os seus resumos semanais, aceite ou peça revisões (modelo de slot)."
                isLoading={loadingUser === 'slot'}
                onLogin={() => handleLogin('slot', 'slot@rotatvde.pt', '123456')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
            />
        </div>
        
        {authError && 
            <div className="w-full max-w-4xl mt-6">
                <p className="text-red-400 text-sm text-center bg-red-900/50 p-3 rounded-md border border-red-700">{authError}</p>
            </div>
        }
      
    </div>
  );
};

export default Login;