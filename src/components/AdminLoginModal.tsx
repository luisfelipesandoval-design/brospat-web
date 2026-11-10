import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck, User, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface AdminLoginModalProps {
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onSuccess,
}) => {
  const { isAdminLoginOpen, closeAdminLogin, loginAdmin } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isAdminLoginOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const errMsg = await loginAdmin(username, password);
    setSubmitting(false);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setUsername('');
    setPassword('');
    onSuccess();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Acceso Administrador BROSPAT"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none"
    >
      <div className="bg-[#18181D] border border-white/15 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-white space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF6012]/15 border border-[#FF6012]/30 flex items-center justify-center text-[#FF6012]">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight leading-none">
                Modo Administrador
              </h2>
              <p className="text-[11px] text-zinc-400 mt-1">
                Control de pedidos, carta e ingresos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setError(null);
              closeAdminLogin();
            }}
            aria-label="Cerrar acceso administrador"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Usuario
            </label>
            <div className="relative">
              <User
                className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0F0F13] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6012]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock
                className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0F0F13] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6012]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label="Mostrar u ocultar contraseña"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/15 border border-red-400/40 text-red-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-[#FF6012] hover:bg-[#e55209] disabled:opacity-60 text-white font-extrabold text-sm uppercase transition-colors cursor-pointer shadow-md"
          >
            {submitting ? 'Verificando...' : 'Ingresar al Panel'}
          </button>
        </form>
      </div>
    </div>
  );
};
