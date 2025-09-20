
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';

const Login: React.FC = () => {
  const [email, setEmail] = useState('meuscalculos@asfaltocativante.pt');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
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
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
            <div>
              <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                {isLoading ? 'A entrar...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;