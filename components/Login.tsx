
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, error: authError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password);
    // Error handling and navigation are now managed by the AuthContext and App component.
    setIsLoading(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          ROTA TVDE 5.0
        </h1>
        <Card>
          <h2 className="text-2xl font-semibold text-center text-gray-200 mb-6">Login do Sistema TVDE</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="block w-full pr-10 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-200"
                  aria-label={showPassword ? "Ocultar password" : "Mostrar password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.73 5.943 5.522 3 10 3s8.27 2.943 9.542 7c-1.272 4.057-5.022 7-9.542 7S1.73 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.57 12.394A4.001 4.001 0 0110 14a4 4 0 01-3.57-1.606A10.054 10.054 0 01.458 10c1.272-4.057 5.022-7 9.542-7 1.655 0 3.21.387 4.595 1.088l-1.739 1.739A8.073 8.073 0 0110 5a8.07 8.07 0 01-1.696.185L6.5 6.983A4.002 4.002 0 0110 6a4 4 0 013.57 1.606l2.121-2.121A9.985 9.985 0 0010 3C5.522 3 1.73 5.943.458 10a10.048 10.048 0 003.249 3.454l-1.414 1.414a1 1 0 001.414 1.414l11.293-11.293a1 1 0 00-1.414-1.414L13.57 12.394z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
            <div>
              <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                {isLoading ? 'A entrar...' : 'Entrar'}
              </Button>
            </div>
          </form>

          {/* Demo Section */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">Ou aceder à versão DEMO</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button type="button" onClick={() => { setEmail('demoad@rotatvde.pt'); setPassword(''); }} variant="secondary" className="w-full">
                Admin
              </Button>
              <Button type="button" onClick={() => { setEmail('demofr@rotatvde.pt'); setPassword(''); }} variant="secondary" className="w-full">
                Frota
              </Button>
              <Button type="button" onClick={() => { setEmail('demosl@rotatvde.pt'); setPassword(''); }} variant="secondary" className="w-full">
                Slot
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
