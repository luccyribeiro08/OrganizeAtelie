import React, { useState } from 'react';
import {
  Calendar,
  Check,
  Edit2,
  ExternalLink,
  Gift,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { Client, Order } from '../types';
import { createWhatsAppLink, formatCurrency, formatDate, triggerConfetti } from '../utils/helpers';

interface ClientesViewProps {
  clients: Client[];
  orders: Order[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onSelectClientForOrder: (client: Client) => void;
}

export const ClientesView: React.FC<ClientesViewProps> = ({
  clients = [],
  orders = [],
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onSelectClientForOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [notes, setNotes] = useState('');

  // Helper: Get orders for a specific client (by matching phone or name)
  const getClientOrders = (client: Client): Order[] => {
    const cleanPhone = client.phone.replace(/\D/g, '');
    return orders.filter((o) => {
      const oCleanPhone = (o.clientPhone || '').replace(/\D/g, '');
      const matchPhone = cleanPhone && oCleanPhone && cleanPhone === oCleanPhone;
      const matchName =
        o.clientName.trim().toLowerCase() === client.name.trim().toLowerCase();
      return matchPhone || matchName;
    });
  };

  // Helper: Calculate total spent by client
  const getClientTotalSpent = (client: Client): number => {
    const clientOrders = getClientOrders(client);
    return clientOrders.reduce((sum, o) => sum + (o.financial?.total || 0), 0);
  };

  // Filtered Clients
  const filteredClients = clients.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.city && c.city.toLowerCase().includes(query)) ||
      (c.address && c.address.toLowerCase().includes(query))
    );
  });

  // Analytics
  const totalClientsCount = clients.length;
  const repeatClientsCount = clients.filter((c) => getClientOrders(c).length >= 2).length;
  
  // New clients this month
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const newClientsThisMonth = clients.filter((c) => c.createdAt && c.createdAt.startsWith(currentMonthPrefix)).length;

  // Modal Handlers
  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setPhone(client.phone);
    setEmail(client.email || '');
    setAddress(client.address || '');
    setCity(client.city || '');
    setState(client.state || '');
    setZipCode(client.zipCode || '');
    setNotes(client.notes || '');
    setShowModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Por favor, preencha pelo menos o Nome e o WhatsApp da cliente.');
      return;
    }

    const clientObj: Client = {
      id: editingClient ? editingClient.id : `cli-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
      notes: notes.trim() || undefined,
      // Retém valores legados caso já existam em edição
      instagram: editingClient?.instagram,
      cpf: editingClient?.cpf,
      birthDate: editingClient?.birthDate,
      childName: editingClient?.childName,
      childBirthDate: editingClient?.childBirthDate,
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingClient) {
      onUpdateClient(clientObj);
      setSaveSuccessMessage(`Cadastro de ${clientObj.name} atualizado com sucesso!`);
    } else {
      onAddClient(clientObj);
      triggerConfetti();
      setSaveSuccessMessage(`Cliente ${clientObj.name} cadastrada com sucesso!`);
    }

    setShowModal(false);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  return (
    <div className="max-w-[1440px] mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-pink-100/70 text-[#ac2471]">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
              Cadastro de Clientes
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie contatos, histórico de pedidos, aniversários e preferências para vender mais vezes para a mesma cliente.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#ac2471] to-[#831843] text-white text-sm font-bold shadow-md hover:shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Cliente</span>
        </button>
      </div>

      {/* Success Notification */}
      {saveSuccessMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold animate-in fade-in slide-in-from-top-2">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Clientes */}
        <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#ac2471] flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total de Clientes</span>
            <span className="text-2xl font-heading font-extrabold text-slate-900">
              {totalClientsCount}
            </span>
          </div>
        </div>

        {/* Card 2: Clientes Recorrentes */}
        <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Clientes Fiéis (2+ pedidos)</span>
            <span className="text-2xl font-heading font-extrabold text-slate-900">
              {repeatClientsCount}
            </span>
          </div>
        </div>

        {/* Card 3: Novos Clientes no Mês */}
        <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Novos este Mês</span>
            <span className="text-2xl font-heading font-extrabold text-slate-900">
              {newClientsThisMonth}
            </span>
          </div>
        </div>

        {/* Card 4: Faturamento Médio */}
        <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Pedidos Cadastrados</span>
            <span className="text-2xl font-heading font-extrabold text-slate-900">
              {orders.length}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-pink-100 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, WhatsApp, e-mail, endereço ou cidade..."
            className="w-full pl-10 pr-4 py-2.5 bg-pink-50/40 hover:bg-pink-50/70 focus:bg-white rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 border border-pink-100 focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20 transition-all"
          />
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Exibindo <strong>{filteredClients.length}</strong> de <strong>{clients.length}</strong> clientes
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-pink-100 space-y-4">
          <div className="w-16 h-16 rounded-full bg-pink-50 text-[#ac2471] flex items-center justify-center mx-auto">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-slate-800 text-lg">Nenhum cliente encontrado</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery
                ? 'Tente buscar com outros termos ou limpe o campo de busca.'
                : 'Cadastre suas clientes para reutilizar os dados nos próximos pedidos com apenas 1 clique!'}
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ac2471] text-white text-xs font-bold hover:bg-[#831843] transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Primeira Cliente</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const clientOrders = getClientOrders(client);
            const totalSpent = getClientTotalSpent(client);
            const isRepeat = clientOrders.length >= 2;
            const waLink = createWhatsAppLink(
              client.phone,
              `Olá, ${client.name}! Tudo bem? Aqui é do Ateliê! Passando para te desejar um ótimo dia!`
            );

            return (
              <div
                key={client.id}
                className="bg-white rounded-3xl p-6 border border-pink-100/80 hover:border-pink-300/80 shadow-xs hover:shadow-atelie transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Card Header: Avatar & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ac2471] to-pink-400 text-white font-heading font-black text-lg flex items-center justify-center shadow-xs">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-slate-900 text-sm leading-snug">
                          {client.name}
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">
                          Cliente cadastrada
                        </span>
                      </div>
                    </div>

                    {isRepeat && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100">
                        <Star className="w-3 h-3 fill-purple-700" />
                        <span>Fiel ({clientOrders.length})</span>
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-pink-50/40 p-3 rounded-2xl border border-pink-100/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#ac2471]" />
                        <span className="font-medium">{client.phone}</span>
                      </div>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>

                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#ac2471]" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}

                    {(client.address || client.city) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#ac2471] mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">
                          {client.address} {client.city ? `- ${client.city}/${client.state || 'SP'}` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes / Special Preferences */}
                  {client.notes && (
                    <div className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-xl border border-pink-100/60 line-clamp-2">
                      💭 "{client.notes}"
                    </div>
                  )}
                </div>

                {/* Financial Summary & Actions */}
                <div className="pt-3 border-t border-pink-100/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Histórico Total:</span>
                    <span className="font-heading font-extrabold text-slate-900">
                      {clientOrders.length} pedido{clientOrders.length !== 1 ? 's' : ''} ({formatCurrency(totalSpent)})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onSelectClientForOrder(client)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#ac2471] hover:bg-[#831843] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                      title="Abrir formulário de pedido com dados desta cliente"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo Pedido</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(client)}
                        className="flex-1 flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#ac2471] text-xs font-semibold transition-colors cursor-pointer"
                        title="Editar Dados do Cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir o cadastro de ${client.name}?`)) {
                            onDeleteClient(client.id);
                          }
                        }}
                        className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                        title="Excluir Cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Cadastro / Edição de Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-pink-100 p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-pink-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-50 text-[#ac2471]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-slate-900 text-lg">
                    {editingClient ? 'Editar Cliente' : 'Cadastrar Nova Cliente'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Preencha as informações essenciais para agilizar seus próximos pedidos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full hover:bg-pink-50 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
              {/* Row 1: Nome & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nome Completo da Cliente <span className="text-[#ac2471]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Maria Clara Silva"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/40 border border-pink-100 text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Telefone / WhatsApp <span className="text-[#ac2471]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: (11) 99123-4567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/40 border border-pink-100 text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20"
                  />
                </div>
              </div>

              {/* Row 2: E-mail */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">E-mail (Opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: maria.clara@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/40 border border-pink-100 text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20"
                />
              </div>

              {/* Row 3: Endereço Completo */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Endereço Completo de Entrega (Opcional)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Av. Paulista, 1000, Apto 42, Bela Vista"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/40 border border-pink-100 text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20"
                />
              </div>

              {/* Row 4: Cidade, Estado, CEP */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full px-3 py-2 rounded-xl bg-pink-50/40 border border-pink-100 text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Estado</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="SP"
                    className="w-full px-3 py-2 rounded-xl bg-pink-50/40 border border-pink-100 text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">CEP</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="01310-100"
                    className="w-full px-3 py-2 rounded-xl bg-pink-50/40 border border-pink-100 text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20"
                  />
                </div>
              </div>

              {/* Row 5: Observações & Preferências */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Preferências Especiais & Observações do Cliente
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Gosta de tons pastéis, prefere glitter dourado, pede acabamento com laço de cetim número 5..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/40 border border-pink-100 text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ac2471] to-[#831843] text-white text-xs font-bold hover:brightness-110 active:scale-95 shadow-md transition-all cursor-pointer"
                >
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
