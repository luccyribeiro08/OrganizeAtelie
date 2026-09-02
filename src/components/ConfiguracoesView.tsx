import React, { useState } from 'react';
import {
  AlertCircle,
  Camera,
  Check,
  Database,
  Download,
  Eye,
  EyeOff,
  HelpCircle,
  Image as ImageIcon,
  Key,
  Loader2,
  Lock,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  User
} from 'lucide-react';
import { AtelieProfile } from '../types';
import { readFileAsDataUrl, triggerConfetti } from '../utils/helpers';
import { BrandLogo } from './BrandLogo';
import { supabase } from '../lib/supabaseClient';

interface ConfiguracoesViewProps {
  profile: AtelieProfile;
  onUpdateProfile: (newProfile: AtelieProfile) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({
  profile,
  onUpdateProfile,
  onExportData,
  onImportData
}) => {
  const [formData, setFormData] = useState<AtelieProfile>({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleProfilePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      // Sets both profile photo and fixed site logo
      setFormData((prev) => ({
        ...prev,
        avatarUrl: dataUrl,
        logoUrl: dataUrl,
      }));
    } catch (err) {
      console.error('Erro ao ler imagem da galeria', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSavedSuccess(true);
    triggerConfetti();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setPwdError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('A confirmação de senha não confere com a nova senha.');
      return;
    }

    setPwdLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPwdError(error.message || 'Erro ao alterar a senha.');
      } else {
        setPwdSuccess('Senha atualizada com sucesso no Supabase!');
        setNewPassword('');
        setConfirmPassword('');
        triggerConfetti();
        setTimeout(() => setPwdSuccess(''), 4000);
      }
    } catch (err: any) {
      setPwdError(err?.message || 'Erro ao comunicar com o servidor.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Configurações do Ateliê
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personalize a foto de perfil/logo fixa, dados de cobrança PIX e realize backups.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Dados salvos com sucesso!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile & Brand Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identity Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-atelie border border-pink-100/70 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-pink-100/70 flex items-center justify-center text-[#ac2471]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-bold text-slate-800 tracking-tight">
                    Foto do Perfil & Logo Fixa do Site
                  </h2>
                  <p className="text-xs text-slate-500">
                    A foto escolhida aqui será utilizada como foto de perfil e logo oficial em todo o sistema.
                  </p>
                </div>
              </div>

              {/* Single Profile Photo Picker from Gallery */}
              <div className="p-4 rounded-2xl bg-[#fff7fa] border border-pink-100/80 flex flex-col sm:flex-row items-center gap-5">
                <div className="relative flex-shrink-0">
                  <img
                    src={formData.avatarUrl || formData.logoUrl}
                    alt="Foto de Perfil e Logo"
                    className="w-20 h-20 rounded-3xl object-cover ring-4 ring-pink-200/80 shadow-md bg-white"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#ac2471] rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                      Foto da Artesã & Logo Oficial
                    </h3>
                    <p className="text-xs text-slate-500">
                      Escolha uma foto da galeria do seu celular ou computador.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ac2471] hover:bg-[#831843] text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-xs">
                    <Camera className="w-4 h-4" />
                    <span>Escolher Foto da Galeria</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    NOME DO ATELIÊ
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    NOME DA RESPONSÁVEL (ARTESÃ)
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    NOME DE USUÁRIO (@USUÁRIO)
                  </label>
                  <input
                    type="text"
                    value={formData.username || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''),
                      })
                    }
                    placeholder="ex: meuatelie"
                    className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    CARGO / PERFIL
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    SLOGAN / FRASE DO ATELIÊ
                  </label>
                  <input
                    type="text"
                    value={formData.slogan}
                    onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>
              </div>
            </div>

            {/* Financial & Social */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-atelie border border-pink-100/70 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Contatos & Chave PIX
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    CHAVE PIX PRINCIPAL
                  </label>
                  <input
                    type="text"
                    value={formData.pixKey}
                    onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    WHATSAPP DE ATENDIMENTO
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    INSTAGRAM DO ATELIÊ
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#9d174d] to-[#be185d] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Dados do Perfil</span>
                </button>
              </div>
            </div>
          </form>

          {/* ================= ALTERAR SENHA DE ACESSO ================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-atelie border border-pink-100/70 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-[#ac2471] text-white flex items-center justify-center shadow-xs">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold text-slate-800 tracking-tight">
                  Alterar Senha de Acesso
                </h2>
                <p className="text-xs text-slate-500">
                  Atualize sua senha de login no Organize Ateliê com segurança.
                </p>
              </div>
            </div>

            {pwdSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            {pwdError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Nova Senha (mínimo 6 dígitos)
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {pwdLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>{pwdLoading ? 'Atualizando senha...' : 'Atualizar Nova Senha'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Backup / Export Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-atelie border border-pink-100/70 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-pink-100/70 flex items-center justify-center text-[#ac2471]">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold text-slate-800 tracking-tight">
                  Backup & Segurança dos Dados
                </h2>
                <p className="text-xs text-slate-500">
                  Exporte ou restaure todos os seus pedidos, catálogo e clientes em arquivo JSON.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onExportData}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#ac2471] font-semibold text-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Backup (JSON)</span>
              </button>

              <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Restaurar Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Brand Preview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-atelie border border-pink-100/70 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-pink-100/70 flex items-center justify-center text-[#ac2471]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-heading font-bold text-slate-800 tracking-tight">
                Identidade Visual Ativa
              </h2>
            </div>

            <div className="p-4 rounded-2xl bg-[#fff7fa] border border-pink-100 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">
                Visualização do Topo & Menu
              </span>
              <div className="p-3 bg-white rounded-2xl border border-pink-100 shadow-xs flex items-center justify-center">
                <BrandLogo
                  size="lg"
                  customLogoUrl={formData.logoUrl || formData.avatarUrl}
                  atelierName={formData.name}
                  showSubtitle={true}
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed text-center">
                A foto selecionada da galeria é salva como logo fixa no menu lateral, topo de páginas e recibos de impressão.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 space-y-1.5">
              <p className="font-semibold text-slate-800">
                ✨ Dica de Artesã
              </p>
              <p className="leading-relaxed">
                Você pode usar uma foto sua trabalhando, ou a imagem da sua marca com fundo transparente ou rosado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
