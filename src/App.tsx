import React, { useEffect, useState } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { NovoPedidoView } from './components/NovoPedidoView';
import { PedidosView } from './components/PedidosView';
import { CatalogoView } from './components/CatalogoView';
import { OrcamentoView } from './components/OrcamentoView';
import { AgendaView } from './components/AgendaView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { AuthView } from './components/AuthView';
import { AtelieProfile, CatalogItem, Order, OrderStatus, UserAccount } from './types';
import {
  INITIAL_ATELIE_PROFILE,
  INITIAL_CATALOG,
  INITIAL_ORDERS
} from './data/initialData';
import { getDaysRemaining } from './utils/helpers';
import { supabase } from './lib/supabaseClient';
import { supabaseService } from './services/supabaseService';

const DEFAULT_INITIAL_USER: UserAccount = {
  id: 'user-luccy-default',
  name: 'Luccy Ribeiro',
  atelieName: 'Luccy Ribeiro Papelaria Personalizada',
  email: 'luccy@atelie.com',
  password: '1234',
  phone: '(11) 98765-4321',
  avatarUrl: INITIAL_ATELIE_PROFILE.avatarUrl,
  logoUrl: INITIAL_ATELIE_PROFILE.logoUrl,
  role: 'Artesã Responsável',
  createdAt: new Date().toISOString(),
};

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('pedidos');
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Registered Users State
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('atelie_users_db_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return [DEFAULT_INITIAL_USER];
    } catch {
      return [DEFAULT_INITIAL_USER];
    }
  });

  // Single Saved Account on Device (Always the last user that logged in)
  const [lastSavedUser, setLastSavedUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('atelie_saved_device_user_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      return null;
    }
    return null;
  });

  // Current Logged In User State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const activeSessionId = localStorage.getItem('atelie_active_session_id_v2');
      const savedUsersStr = localStorage.getItem('atelie_users_db_v2');
      const usersList: UserAccount[] = savedUsersStr
        ? JSON.parse(savedUsersStr)
        : [DEFAULT_INITIAL_USER];

      if (activeSessionId) {
        const found = usersList.find((u) => u.id === activeSessionId);
        if (found) return found;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Helper to load user profile
  const loadUserProfile = (user: UserAccount): AtelieProfile => {
    try {
      const saved = localStorage.getItem(`atelie_profile_${user.id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      name: user.atelieName || 'Meu Ateliê',
      ownerName: user.name || 'Artesã',
      role: user.role || 'Artesã Responsável',
      slogan: 'Papelaria Personalizada & Afetiva',
      phone: user.phone || '',
      pixKey: user.email || '',
      instagram: `@${(user.atelieName || 'atelie').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}`,
      email: user.email,
      address: '',
      logoUrl: user.logoUrl || user.avatarUrl || '',
      avatarUrl: user.avatarUrl || user.logoUrl || '',
    };
  };

  // Helper to load user orders
  const loadUserOrders = (user: UserAccount): Order[] => {
    try {
      const saved = localStorage.getItem(`atelie_orders_${user.id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // If it's the demo account, return INITIAL_ORDERS, otherwise clean empty list for new users
    if (user.id === 'user-luccy-default') return INITIAL_ORDERS;
    return [];
  };

  // Helper to load user catalog
  const loadUserCatalog = (user: UserAccount): CatalogItem[] => {
    try {
      const saved = localStorage.getItem(`atelie_catalog_${user.id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // If it's the demo account, return INITIAL_CATALOG, otherwise clean empty list for new users
    if (user.id === 'user-luccy-default') return INITIAL_CATALOG;
    return [];
  };

  // User-isolated persistent states
  const [profile, setProfile] = useState<AtelieProfile>(() =>
    currentUser ? loadUserProfile(currentUser) : INITIAL_ATELIE_PROFILE
  );

  const [orders, setOrders] = useState<Order[]>(() =>
    currentUser ? loadUserOrders(currentUser) : []
  );

  const [catalog, setCatalog] = useState<CatalogItem[]>(() =>
    currentUser ? loadUserCatalog(currentUser) : []
  );

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

  // Persist registered users
  useEffect(() => {
    try {
      localStorage.setItem('atelie_users_db_v2', JSON.stringify(registeredUsers));
    } catch (e) {
      console.error('Error saving users to localStorage', e);
    }
  }, [registeredUsers]);

  // When currentUser changes, reload their profile, orders, and catalog
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('atelie_active_session_id_v2', currentUser.id);
      
      // Initial load from local
      setProfile(loadUserProfile(currentUser));
      setOrders(loadUserOrders(currentUser));
      setCatalog(loadUserCatalog(currentUser));

      // Asynchronously fetch and sync with Supabase for real accounts
      if (currentUser.id !== 'user-luccy-default') {
        supabaseService.getProfile(currentUser.id).then((remoteProfile) => {
          if (remoteProfile) setProfile(remoteProfile);
        });
        supabaseService.getOrders(currentUser.id).then((remoteOrders) => {
          if (remoteOrders && remoteOrders.length > 0) setOrders(remoteOrders);
        });
        supabaseService.getCatalog(currentUser.id).then((remoteCatalog) => {
          if (remoteCatalog && remoteCatalog.length > 0) setCatalog(remoteCatalog);
        });
      }
    } else {
      localStorage.removeItem('atelie_active_session_id_v2');
    }
  }, [currentUser?.id]);

  // Save Orders for current user
  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem(`atelie_orders_${currentUser.id}`, JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving user orders', e);
    }
  }, [orders, currentUser?.id]);

  // Save Catalog for current user
  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem(`atelie_catalog_${currentUser.id}`, JSON.stringify(catalog));
    } catch (e) {
      console.error('Error saving user catalog', e);
    }
  }, [catalog, currentUser?.id]);

  // Save Profile for current user & sync with user account
  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem(`atelie_profile_${currentUser.id}`, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving user profile', e);
    }
  }, [profile, currentUser?.id]);

  // Handle User Registration
  const handleRegisterUser = (newUser: UserAccount) => {
    // Explicitly initialize clean and isolated storage for this new user
    localStorage.setItem(`atelie_orders_${newUser.id}`, JSON.stringify([]));
    localStorage.setItem(`atelie_catalog_${newUser.id}`, JSON.stringify([]));

    const initialProfile: AtelieProfile = {
      name: newUser.atelieName || 'Meu Ateliê',
      ownerName: newUser.name || 'Artesã',
      role: newUser.role || 'Artesã Responsável',
      slogan: 'Papelaria Personalizada & Afetiva',
      phone: newUser.phone || '',
      pixKey: newUser.email || '',
      instagram: `@${(newUser.atelieName || 'atelie').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}`,
      email: newUser.email,
      address: '',
      logoUrl: newUser.logoUrl || newUser.avatarUrl || '',
      avatarUrl: newUser.avatarUrl || newUser.logoUrl || '',
    };
    localStorage.setItem(`atelie_profile_${newUser.id}`, JSON.stringify(initialProfile));

    setRegisteredUsers((prev) => [...prev, newUser]);
    // Save only 1 account on the device (the newly registered and logged-in account)
    setLastSavedUser(newUser);
    try {
      localStorage.setItem('atelie_saved_device_user_v2', JSON.stringify(newUser));
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Login Success - Save ONLY this 1 account as the active saved device account
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setLastSavedUser(user);
    try {
      localStorage.setItem('atelie_saved_device_user_v2', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    setActiveTab('pedidos');
  };

  // Remove single saved account from device
  const handleRemoveSavedAccount = () => {
    setLastSavedUser(null);
    try {
      localStorage.removeItem('atelie_saved_device_user_v2');
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.log('Supabase signOut', e);
    }
    setCurrentUser(null);
    setSelectedOrder(null);
    setOrderToPrint(null);
  };

  // Handler: Update Profile & Sync User State
  const handleUpdateProfile = (updatedProfile: AtelieProfile) => {
    setProfile(updatedProfile);
    if (currentUser) {
      const updatedUser: UserAccount = {
        ...currentUser,
        name: updatedProfile.ownerName,
        atelieName: updatedProfile.name,
        avatarUrl: updatedProfile.avatarUrl,
        logoUrl: updatedProfile.logoUrl,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
      };
      setCurrentUser(updatedUser);
      setRegisteredUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
      if (lastSavedUser && lastSavedUser.id === updatedUser.id) {
        setLastSavedUser(updatedUser);
        try {
          localStorage.setItem('atelie_saved_device_user_v2', JSON.stringify(updatedUser));
        } catch (e) {
          console.error(e);
        }
      }
      // Async sync with Supabase
      if (currentUser.id !== 'user-luccy-default') {
        supabaseService.saveProfile(currentUser.id, updatedProfile);
      }
    }
  };

  // Handler: Save New Order
  const handleSaveOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.saveOrder(currentUser.id, newOrder);
    }
    setActiveTab('pedidos');
  };

  // Handler: Update Order Status
  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    let updatedOrderObj: Order | null = null;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated: Order = {
            ...o,
            status,
            financial:
              status === 'Finalizado'
                ? {
                    ...o.financial,
                    deposit: o.financial.total,
                    remaining: 0,
                    paymentProgress: 100,
                  }
                : o.financial,
            updatedAt: new Date().toISOString(),
          };
          updatedOrderObj = updated;
          return updated;
        }
        return o;
      })
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
    }
    if (currentUser && currentUser.id !== 'user-luccy-default' && updatedOrderObj) {
      supabaseService.saveOrder(currentUser.id, updatedOrderObj);
    }
  };

  // Handler: Delete Order
  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(null);
    }
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.deleteOrder(orderId);
    }
  };

  // Handler: Add Catalog Item
  const handleAddCatalogItem = (item: CatalogItem) => {
    setCatalog((prev) => [item, ...prev]);
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.saveCatalogItem(currentUser.id, item);
    }
  };

  // Handler: Update Catalog Item
  const handleUpdateCatalogItem = (item: CatalogItem) => {
    setCatalog((prev) => prev.map((c) => (c.id === item.id ? item : c)));
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.saveCatalogItem(currentUser.id, item);
    }
  };

  // Handler: Delete Catalog Item
  const handleDeleteCatalogItem = (itemId: string) => {
    setCatalog((prev) => prev.filter((c) => c.id !== itemId));
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.deleteCatalogItem(itemId);
    }
  };

  // Handler: Select product to create order
  const handleSelectProductForOrder = (item: CatalogItem) => {
    setActiveTab('criar-pedido');
  };

  // Handler: Convert Quote to Order
  const handleConvertQuoteToOrder = (partialOrder: Partial<Order>) => {
    const newOrder: Order = {
      id: `ped-${Date.now()}`,
      code: `#PED-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: partialOrder.clientName || 'Cliente Orçamento',
      clientPhone: partialOrder.clientPhone || '(11) 90000-0000',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryMethod: 'Retirada no Ateliê',
      theme: partialOrder.theme || 'Personalizado',
      origin: 'WhatsApp',
      orderType: 'Orçamento Aprovado',
      items: partialOrder.items || [],
      personalization: {},
      financial: partialOrder.financial || {
        paymentMethod: 'PIX',
        total: 100,
        deposit: 50,
        remaining: 50,
        paymentProgress: 50,
      },
      status: 'Pendente',
      mockupImages: [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80'
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveTab('pedidos');
  };

  // Backup handlers
  const handleExportData = () => {
    const backupData = {
      version: '2.0',
      user: currentUser?.email,
      exportedAt: new Date().toISOString(),
      profile,
      catalog,
      orders,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organize-atelie-${currentUser?.name || 'backup'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.orders && Array.isArray(parsed.orders)) {
          setOrders(parsed.orders);
        }
        if (parsed.catalog && Array.isArray(parsed.catalog)) {
          setCatalog(parsed.catalog);
        }
        if (parsed.profile) {
          handleUpdateProfile(parsed.profile);
        }
        alert('Backup restaurado com sucesso!');
      } catch (err) {
        alert('Erro ao importar arquivo JSON. Certifique-se de que é um backup válido.');
      }
    };
    reader.readAsText(file);
  };

  // If user is not logged in, block dashboard access and show AuthView
  if (!currentUser) {
    return (
      <AuthView
        onLoginSuccess={handleLoginSuccess}
        registeredUsers={registeredUsers}
        onRegisterUser={handleRegisterUser}
        savedAccount={lastSavedUser}
        onRemoveSavedAccount={handleRemoveSavedAccount}
      />
    );
  }

  // Count active and urgent orders
  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'Finalizado' && o.status !== 'Rascunho'
  ).length;

  const urgentOrdersCount = orders.filter((o) => {
    if (o.status === 'Finalizado' || o.status === 'Rascunho') return false;
    const rem = getDaysRemaining(o.deliveryDate);
    return rem.days <= 0;
  }).length;

  return (
    <div className="min-h-screen bg-[#fbf9f8] flex text-[#1b1c1c]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ordersCount={activeOrdersCount}
        urgentCount={urgentOrdersCount}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        logoUrl={profile.logoUrl}
        atelierName={profile.name}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Bar */}
        <Header
          profile={profile}
          orders={orders}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
          onSelectOrder={(ord) => setSelectedOrder(ord)}
          onLogout={handleLogout}
          onNavigateSettings={() => setActiveTab('configuracoes')}
        />

        {/* View Routing */}
        <main className="flex-1">
          {activeTab === 'criar-pedido' && (
            <NovoPedidoView
              catalog={catalog}
              onSaveOrder={handleSaveOrder}
              onNavigateToCatalog={() => setActiveTab('catalogo')}
            />
          )}

          {activeTab === 'pedidos' && (
            <PedidosView
              orders={orders}
              onSelectOrder={(ord) => setSelectedOrder(ord)}
              onPrintOrder={(ord) => setOrderToPrint(ord)}
              onUpdateStatus={handleUpdateStatus}
              onDeleteOrder={handleDeleteOrder}
              onNavigateToNewOrder={() => setActiveTab('criar-pedido')}
            />
          )}

          {activeTab === 'catalogo' && (
            <CatalogoView
              catalog={catalog}
              onAddCatalogItem={handleAddCatalogItem}
              onUpdateCatalogItem={handleUpdateCatalogItem}
              onDeleteCatalogItem={handleDeleteCatalogItem}
              onSelectProductForOrder={handleSelectProductForOrder}
            />
          )}

          {activeTab === 'orcamento' && (
            <OrcamentoView
              onConvertToOrder={handleConvertQuoteToOrder}
              profile={profile}
            />
          )}

          {activeTab === 'agenda' && (
            <AgendaView
              orders={orders}
              onSelectOrder={(ord) => setSelectedOrder(ord)}
            />
          )}

          {activeTab === 'configuracoes' && (
            <ConfiguracoesView
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onExportData={handleExportData}
              onImportData={handleImportData}
            />
          )}
        </main>
      </div>

      {/* ================= MODALS ================= */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          profile={profile}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
          onPrintOrder={(ord) => {
            setSelectedOrder(null);
            setOrderToPrint(ord);
          }}
        />
      )}

      {orderToPrint && (
        <OrderReceiptModal
          order={orderToPrint}
          profile={profile}
          onClose={() => setOrderToPrint(null)}
        />
      )}
    </div>
  );
}
