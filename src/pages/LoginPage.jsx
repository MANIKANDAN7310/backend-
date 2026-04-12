import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import { Lock, User } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Minor delay to simulate network request
    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        navigate('/');
      } else {
        setError('Invalid ID or Password');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="dark min-h-screen bg-[var(--bg-dark)] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--bg-sidebar),_transparent)]">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-[var(--bg-card)] rounded-2xl flex items-center justify-center border border-[var(--border)] shadow-2xl mb-4 transition-transform hover:scale-105 duration-300">
            <img src={logo} alt="Company Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent tracking-tight">OCTOINK STUDIOS</h1>
          <p className="text-[var(--text-dim)] mt-2">Sign in to manage your marketplace</p>
        </div>

        <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)] shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-dim)] mb-2 ml-1">Admin ID / Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-dim)] group-focus-within:text-[var(--primary)] transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[var(--bg-dark)] border border-[var(--border)] rounded-xl py-3.5 pl-11 pr-4 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all placeholder:text-[var(--text-dim)]/50"
                  placeholder="Enter your ID"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-dim)] mb-2 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-dim)] group-focus-within:text-[var(--primary)] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-dark)] border border-[var(--border)] rounded-xl py-3.5 pl-11 pr-4 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all placeholder:text-[var(--text-dim)]/50"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm flex items-center animate-shake">
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Login to Dashboard'
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-10 text-[var(--text-dim)] text-sm">
          &copy; {new Date().getFullYear()} OCTOINK STUDIOS. Secure Access Only.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

