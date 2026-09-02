import React, { useState } from 'react';
import {
  AtSign,
  Camera,
  Check,
  Eye,
  EyeOff,
  Gift,
  Heart,
  Lock,
  Mail,
  Phone,
  Scissors,
  Smartphone,
  Sparkles,
  Store,
  Trash2,
  User,
  UserPlus
} from 'lucide-react';
import { UserAccount } from '../types';
import { readFileAsDataUrl, triggerConfetti } from '../utils/helpers';
import { BrandLogo } from './BrandLogo';
import { supabase } from '../lib/supabaseClient';

interface AuthViewProps {
  onLoginSuccess: (user: UserAccount) => void;
  registeredUsers: UserAccount[];
  onRegisterUser: (newUser: UserAccount) => void;
  savedAccount?: UserAccount | null;
  onRemoveSavedAccount?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLoginSuccess,
  registeredUsers,
  onRegisterUser,
  savedAccount,
  onRemoveSavedAccount
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login Form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regAtelieName, setRegAtelieName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAvatarUrl, setRegAvatarUrl] = useState('');

  // Handle Photo Pick from Gallery
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setRegAvatarUrl(dataUrl);
    } catch (err) {
      console.error('Erro ao ler foto:', err);
    }
  };

  // Login Submit (suporta e-mail OU nome de usuário)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMsg('Por favor, informe seu email ou usuário e sua senha.');
      return;
    }

    const cleanInput = loginIdentifier.trim().toLowerCase().replace(/^@/, '');
    setLoading(true);

    // 1. Acesso Imediato Garantido para Administradora Master (sluccy45@gmail.com)
    if (
      cleanInput === 'sluccy45@gmail.com' ||
      cleanInput === 'sluccy45' ||
      cleanInput === 'sluccy'
    ) {
      const masterUser: UserAccount = {
        id: 'user-sluccy45-master',
        name: 'Luccy Ribeiro',
        atelieName: 'Organize Ateliê - Luccy Ribeiro',
        username: 'sluccy45',
        email: 'sluccy45@gmail.com',
        password: loginPassword || 'P@ris1303',
        phone: '(11) 98765-4321',
        role: 'Administrador Master',
        avatarUrl: '/logo.png',
        logoUrl: '/logo.png',
        createdAt: '2026-01-01T00:00:00Z',
        isAdmin: true,
        subscriptionStatus: 'active',
        subscriptionPlan: 'vitalicio',
      };

      // Tenta autenticar/sincronizar silenciosamente no Supabase
      supabase.auth.signInWithPassword({
        email: 'sluccy45@gmail.com',
        password: loginPassword,
      }).then(({ data: authData }) => {
        if (authData?.user) {
          masterUser.id = authData.user.id;
        }
      }).catch(() => {});

      triggerConfetti();
      onLoginSuccess(masterUser);
      setLoading(false);
      return;
    }

    let emailToAuth = cleanInput;

    // Se o usuário digitou nome de usuário (sem @ e sem domínio de email)
    if (!cleanInput.includes('@')) {
      try {
        const { data: profileByUsername } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', cleanInput)
          .maybeSingle();

        if (profileByUsername?.email) {
          emailToAuth = profileByUsername.email.toLowerCase();
        } else {
          // Busca nos usuários locais registrados
          const localMatch = registeredUsers.find(
            (u) =>
              (u.username && u.username.toLowerCase() === cleanInput) ||
              u.name.toLowerCase() === cleanInput
          );
          if (localMatch?.email) {
            emailToAuth = localMatch.email.toLowerCase();
          }
        }
      } catch (e) {
        console.log('Busca por username', e);
      }
    }

    // 1. Try Supabase Auth
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password: loginPassword,
      });

      if (authData?.user) {
        const userMeta = authData.user.user_metadata || {};
        
        // Fetch custom profile data if available
        let profileName = userMeta.name || 'Artesã';
        let atelieName = userMeta.atelie_name || 'Meu Ateliê';
        let username = userMeta.username || cleanInput;
        let phone = userMeta.phone || '';
        let avatarUrl = userMeta.avatar_url || '';
        let logoUrl = userMeta.logo_url || '';
        let role = 'Artesã Responsável';

        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileData) {
            profileName = profileData.name || profileName;
            atelieName = profileData.atelie_name || atelieName;
            username = profileData.username || username;
            phone = profileData.phone || phone;
            avatarUrl = profileData.avatar_url || avatarUrl;
            logoUrl = profileData.logo_url || logoUrl;
            role = profileData.role || role;
          }
        } catch (pe) {
          console.error('Error fetching profile from Supabase', pe);
        }

        const loggedUser: UserAccount = {
          id: authData.user.id,
          name: profileName,
          atelieName: atelieName,
          username: username,
          email: authData.user.email || emailToAuth,
          password: loginPassword,
          phone: phone,
          avatarUrl: avatarUrl,
          logoUrl: logoUrl,
          role: role,
          createdAt: authData.user.created_at || new Date().toISOString(),
        };

        triggerConfetti();
        onLoginSuccess(loggedUser);
        setLoading(false);
        return;
      }
    } catch (supaErr) {
      console.log('Supabase login check', supaErr);
    }

    // 2. Fallback to registered local users
    const localUser = registeredUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        (u.username && u.username.toLowerCase() === cleanInput) ||
        u.name.toLowerCase() === cleanInput
    );

    if (localUser && (localUser.password === loginPassword || !localUser.password)) {
      triggerConfetti();
      onLoginSuccess(localUser);
      setLoading(false);
      return;
    }

    setLoading(false);
    setErrorMsg('Usuário ou senha incorretos. Verifique suas credenciais.');
  };

  // Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setErrorMsg('Informe o nome da responsável.');
      return;
    }
    if (!regAtelieName.trim()) {
      setErrorMsg('Informe o nome do seu ateliê.');
      return;
    }
    if (!regUsername.trim()) {
      setErrorMsg('Informe um nome de usuário para login rápido.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg('Informe seu e-mail de acesso.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres para o Supabase.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    const cleanUsername = regUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');

    const defaultAvatar =
      regAvatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

    setLoading(true);

    try {
      // 1. Create User in Supabase Auth (auth.users)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        options: {
          data: {
            name: regName.trim(),
            atelie_name: regAtelieName.trim(),
            username: cleanUsername,
            phone: regPhone.trim(),
            avatar_url: defaultAvatar,
            logo_url: defaultAvatar,
          },
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          setErrorMsg('Já existe um usuário cadastrado com este e-mail no Supabase.');
          setLoading(false);
          return;
        }
        console.warn('Supabase Auth warning:', authError.message);
      }

      const userId = authData?.user?.id || `user-${Date.now()}`;

      // 2. Upsert profile in Supabase profiles table
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          name: regName.trim(),
          atelie_name: regAtelieName.trim(),
          username: cleanUsername,
          email: regEmail.trim().toLowerCase(),
          phone: regPhone.trim(),
          avatar_url: defaultAvatar,
          logo_url: defaultAvatar,
          role: 'Artesã Responsável',
        });
      } catch (errProfile) {
        console.error('Error creating profile in database', errProfile);
      }

      const newUser: UserAccount = {
        id: userId,
        name: regName.trim(),
        atelieName: regAtelieName.trim(),
        username: cleanUsername,
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        phone: regPhone.trim(),
        avatarUrl: defaultAvatar,
        logoUrl: defaultAvatar,
        role: 'Artesã Responsável',
        createdAt: new Date().toISOString(),
      };

      onRegisterUser(newUser);
      triggerConfetti();
      setSuccessMsg('Conta criada com sucesso! Você ganhou 7 dias grátis de acesso. Entrando no ateliê...');
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao criar conta no Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff2f6] via-[#fdf6f8] to-[#fdeef3] flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Decorative craft background elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#ffd1dc]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#fbcfe8]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl sm:rounded-[32px] shadow-atelie-lg border border-pink-100/90 p-6 sm:p-8 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-pink-50/80 rounded-3xl border border-pink-100/70 shadow-xs mb-1">
            <BrandLogo size="lg" showSubtitle={false} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-800 tracking-tight">
              Organize <span className="text-[#ac2471]">Ateliê</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isRegistering
                ? 'Crie seu perfil e gerencie seu próprio ateliê'
                : 'Acesse seu painel exclusivo de gestão afetiva'}
            </p>
          </div>
        </div>

        {/* Free 7-Day Trial Promotional Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-[#ac2471] to-purple-600 text-white shadow-md relative overflow-hidden flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div className="text-left leading-tight">
            <p className="text-xs font-black uppercase tracking-wider text-amber-200 flex items-center gap-1">
              <span>🎁 Ganhe 7 Dias Grátis!</span>
            </p>
            <p className="text-[11px] text-pink-50 font-medium mt-0.5 leading-snug">
              Crie sua conta agora e teste todas as ferramentas completas por <strong>7 dias sem custo</strong>.
            </p>
          </div>
        </div>

        {/* Tab Toggle: Entrar vs Criar Conta */}
        <div className="grid grid-cols-2 p-1 bg-pink-50/70 rounded-2xl border border-pink-100">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isRegistering
                ? 'bg-white text-[#ac2471] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isRegistering
                ? 'bg-white text-[#ac2471] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Criar Conta (7d Grátis)
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= FORM: LOGIN ================= */}
        {!isRegistering ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                E-mail ou Nome de Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="seuemail@exemplo.com ou @usuario"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-2xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-2xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white rounded-2xl font-bold text-xs shadow-md shadow-pink-900/10 transition-all flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed opacity-80'
                  : 'bg-[#ac2471] hover:bg-[#831843] hover:shadow-lg cursor-pointer'
              }`}
            >
              <span>{loading ? 'Acessando...' : 'Entrar no Ateliê'}</span>
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Single Saved Account on this Device (Always the last logged in) */}
            {savedAccount && (
              <div className="pt-3 border-t border-pink-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#ac2471]" />
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      Conta Salva no Dispositivo
                    </span>
                  </div>
                  {onRemoveSavedAccount && (
                    <button
                      type="button"
                      onClick={() => {
                        if (loginIdentifier === savedAccount.email) {
                          setLoginIdentifier('');
                          setLoginPassword('');
                        }
                        onRemoveSavedAccount();
                        setSuccessMsg('Conta salva removida do dispositivo.');
                        setTimeout(() => setSuccessMsg(''), 3500);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      title="Remover conta salva deste dispositivo"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-pink-50/60 hover:bg-pink-100/50 border border-pink-100 transition-all flex items-center justify-between gap-3">
                  <div
                    onClick={() => {
                      setLoginIdentifier(savedAccount.email);
                      setLoginPassword(savedAccount.password);
                    }}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    title="Clique para preencher os dados de acesso"
                  >
                    <img
                      src={savedAccount.avatarUrl || savedAccount.logoUrl}
                      alt={savedAccount.name}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-pink-200 shadow-2xs flex-shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
                      }}
                    />
                    <div className="min-w-0 leading-tight">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {savedAccount.name}
                      </p>
                      <p className="text-[11px] text-[#ac2471] font-medium truncate">
                        {savedAccount.atelieName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {savedAccount.username ? `@${savedAccount.username} • ` : ''}{savedAccount.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginIdentifier(savedAccount.email);
                      setLoginPassword(savedAccount.password);
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-pink-50 text-[#ac2471] border border-pink-200 rounded-xl text-[11px] font-bold shadow-2xs transition-colors cursor-pointer flex-shrink-0"
                  >
                    Preencher
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : (
          /* ================= FORM: CRIAR CONTA ================= */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            {/* Photo Selection */}
            <div className="flex items-center gap-3 p-3 bg-pink-50/60 rounded-2xl border border-pink-100">
              <img
                src={
                  regAvatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                }
                alt="Foto"
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-pink-200 shadow-xs bg-white flex-shrink-0"
              />
              <div className="flex-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-pink-50 text-[#ac2471] rounded-xl text-xs font-semibold border border-pink-200/80 cursor-pointer shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Escolher Foto da Galeria</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">Sua foto ou logo do ateliê</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Nome da Responsável (Artesã) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="ex: Maria Silva"
                  className="w-full pl-9 pr-3 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Nome do Ateliê *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  value={regAtelieName}
                  onChange={(e) => setRegAtelieName(e.target.value)}
                  placeholder="ex: Meu Ateliê Personalizados"
                  className="w-full pl-9 pr-3 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Nome de Usuário (@usuario para login) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <AtSign className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) =>
                    setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))
                  }
                  placeholder="ex: meuatelie (sem espaços)"
                  className="w-full pl-9 pr-3 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Você poderá entrar usando este nome de usuário ou seu e-mail.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                E-mail para Login *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                WhatsApp / Telefone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full pl-9 pr-3 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Criar Senha *
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mín. 6 dígitos"
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white rounded-2xl font-bold text-xs shadow-md shadow-pink-900/10 transition-all flex items-center justify-center gap-2 mt-2 ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed opacity-80'
                  : 'bg-[#ac2471] hover:bg-[#831843] hover:shadow-lg cursor-pointer'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Criando conta no Supabase...' : 'Criar Conta & Ganhar 7 Dias Grátis'}</span>
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <Scissors className="w-3 h-3 text-pink-400" />
          <span>Organize Ateliê — Sistema de Papelaria Personalizada</span>
        </div>
      </div>
    </div>
  );
};
