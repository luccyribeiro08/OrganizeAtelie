import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NovoPedidoView } from './components/NovoPedidoView';
import { PedidosView } from './components/PedidosView';
import { ClientesView } from './components/ClientesView';
import { CatalogoView } from './components/CatalogoView';
import { OrcamentoView } from './components/OrcamentoView';
import { AgendaView } from './components/AgendaView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { OrderReadyNotificationModal } from './components/OrderReadyNotificationModal';
import { OrderCompletedNotificationModal } from './components/OrderCompletedNotificationModal';
import { OrderInProductionNotificationModal } from './components/OrderInProductionNotificationModal';
import { AuthView } from './components/AuthView';
import { SubscriptionBanner } from './components/SubscriptionBanner';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AdminUsersView } from './components/AdminUsersView';
import { ActiveTab, AtelieProfile, CatalogItem, Client, Order, OrderStatus, Quotation, UserAccount } from './types';
import {
  DEFAULT_CATALOG_CATEGORIES,
  DEFAULT_ORDER_TYPES,
  INITIAL_ATELIE_PROFILE,
  INITIAL_CATALOG,
  INITIAL_CLIENTS,
  INITIAL_ORDERS,
  INITIAL_QUOTATIONS
} from './data/initialData';
import { getDaysRemaining, triggerConfetti } from './utils/helpers';
import { getSubscriptionInfo } from './utils/subscriptionUtils';
import { supabase } from './lib/supabaseClient';
import { supabaseService } from './services/supabaseService';

export default function App() {
  // Navigation with reload persistence
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const savedTab = localStorage.getItem('atelie_active_tab_v2');
      if (
        savedTab &&
        ['pedidos', 'criar-pedido', 'clientes', 'catalogo', 'orcamento', 'agenda', 'configuracoes'].includes(savedTab)
      ) {
        return savedTab as ActiveTab;
      }
    } catch {}
    return 'pedidos';
  });
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Persist activeTab on change
  useEffect(() => {
    try {
      localStorage.setItem('atelie_active_tab_v2', activeTab);
    } catch {}
  }, [activeTab]);

  // Registered Users State (Filtering out example account)
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('atelie_users_db_v2');
      if (saved) {
        const parsed: UserAccount[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (u) => u.email !== 'luccy@atelie.com' && u.id !== 'user-luccy-default'
          );
          return filtered;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Single Saved Account on Device (Defaults to master account for instant 1-click access)
  const [lastSavedUser, setLastSavedUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('atelie_saved_device_user_v2');
      if (saved) {
        const parsed: UserAccount = JSON.parse(saved);
        if (parsed && parsed.email !== 'luccy@atelie.com' && parsed.id !== 'user-luccy-default') {
          return parsed;
        }
      }
    } catch {
      return null;
    }
    return {
      id: 'user-luccy-master',
      name: 'Luccy Ribeiro',
      atelieName: 'Organize Ateliê - Luccy Ribeiro',
      username: 'luccyatelie',
      email: 'luccyribeiro08@gmail.com',
      password: '1234',
      phone: '(11) 98765-4321',
      role: 'Administrador Master',
      avatarUrl: '/logo.png',
      logoUrl: '/logo.png',
      createdAt: '2026-01-01T00:00:00Z',
      isAdmin: true,
      subscriptionStatus: 'active',
      subscriptionPlan: 'vitalicio',
    };
  });

  // Current Logged In User State - Robust Session Persistence on Page Reload (F5)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      // 1. Direct logged-in user object
      const directUserStr = localStorage.getItem('atelie_current_user_v3');
      if (directUserStr) {
        const parsed = JSON.parse(directUserStr);
        if (parsed && parsed.id && parsed.email !== 'luccy@atelie.com' && parsed.id !== 'user-luccy-default') {
          return parsed;
        }
      }

      // 2. Saved active session ID
      const activeSessionId = localStorage.getItem('atelie_active_session_id_v2');
      const savedUsersStr = localStorage.getItem('atelie_users_db_v2');
      const usersList: UserAccount[] = savedUsersStr ? JSON.parse(savedUsersStr) : [];

      if (activeSessionId) {
        const found = usersList.find(
          (u) => u.id === activeSessionId && u.email !== 'luccy@atelie.com' && u.id !== 'user-luccy-default'
        );
        if (found) return found;
      }

      // 3. Fallback to saved device user account
      const lastDeviceStr = localStorage.getItem('atelie_saved_device_user_v2');
      if (lastDeviceStr) {
        const parsed = JSON.parse(lastDeviceStr);
        if (parsed && parsed.id && parsed.email !== 'luccy@atelie.com' && parsed.id !== 'user-luccy-default') {
          return parsed;
        }
      }

      return null;
    } catch {
      return null;
    }
  });

  // Check and restore active Supabase Auth session on mount
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          const u = data.session.user;
          const userMeta = u.user_metadata || {};
          const supaUser: UserAccount = {
            id: u.id,
            name: userMeta.name || 'Artesã',
            atelieName: userMeta.atelie_name || 'Meu Ateliê',
            username: userMeta.username || '',
            email: u.email || '',
            password: '',
            phone: userMeta.phone || '',
            avatarUrl: userMeta.avatar_url || '',
            logoUrl: userMeta.logo_url || '',
            role: userMeta.role || 'Artesã Responsável',
            createdAt: u.created_at || new Date().toISOString(),
          };
          setCurrentUser(supaUser);
          try {
            localStorage.setItem('atelie_current_user_v3', JSON.stringify(supaUser));
            localStorage.setItem('atelie_active_session_id_v2', supaUser.id);
          } catch {}
        }
      } catch (err) {
        console.log('Supabase session restore check', err);
      }
    };
    checkSupabaseAuth();
  }, []);

  // Helper to check if user is the Master Admin account
  const isMasterUser = (u?: UserAccount | null) =>
    Boolean(
      u &&
        (u.email?.trim().toLowerCase() === 'luccyribeiro08@gmail.com' ||
          u.id === 'user-luccy-master' ||
          u.id === 'user-luccy-default' ||
          u.username === 'luccyatelie')
    );

  // Helper to load user profile
  const loadUserProfile = (user: UserAccount): AtelieProfile => {
    const isMaster = isMasterUser(user);
    try {
      const saved =
        localStorage.getItem(`atelie_profile_${user.id}`) ||
        (isMaster ? localStorage.getItem('atelie_profile_user-luccy-default') : null) ||
        (isMaster ? localStorage.getItem('atelie_profile_user-luccy-master') : null);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    if (isMaster) return INITIAL_ATELIE_PROFILE;
    return {
      name: user.atelieName || 'Meu Ateliê',
      ownerName: user.name || 'Artesã',
      username: user.username || '',
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
    const isMaster = isMasterUser(user);
    try {
      const saved =
        localStorage.getItem(`atelie_orders_${user.id}`) ||
        (isMaster ? localStorage.getItem('atelie_orders_user-luccy-default') : null) ||
        (isMaster ? localStorage.getItem('atelie_orders_user-luccy-master') : null);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    if (isMaster) return INITIAL_ORDERS;
    return [];
  };

  // Helper to load user catalog
  const loadUserCatalog = (user: UserAccount): CatalogItem[] => {
    const isMaster = isMasterUser(user);
    try {
      const saved =
        localStorage.getItem(`atelie_catalog_${user.id}`) ||
        (isMaster ? localStorage.getItem('atelie_catalog_user-luccy-default') : null) ||
        (isMaster ? localStorage.getItem('atelie_catalog_user-luccy-master') : null);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    if (isMaster) return INITIAL_CATALOG;
    return [];
  };

  // Helper to load user catalog categories
  const loadUserCategories = (user: UserAccount): string[] => {
    try {
      const saved = localStorage.getItem(`atelie_categories_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CATALOG_CATEGORIES;
  };

  // Helper to load user order types
  const loadUserOrderTypes = (user: UserAccount): string[] => {
    try {
      const saved = localStorage.getItem(`atelie_order_types_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ORDER_TYPES;
  };

  // Helper to load user quotations
  const loadUserQuotations = (user: UserAccount): Quotation[] => {
    const isMaster = isMasterUser(user);
    try {
      const saved =
        localStorage.getItem(`atelie_quotations_${user.id}`) ||
        (isMaster ? localStorage.getItem('atelie_quotations_user-luccy-default') : null) ||
        (isMaster ? localStorage.getItem('atelie_quotations_user-luccy-master') : null);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    if (isMaster) return INITIAL_QUOTATIONS;
    return [];
  };

  // Helper to load user clients
  const loadUserClients = (user: UserAccount): Client[] => {
    const isMaster = isMasterUser(user);
    try {
      const saved =
        localStorage.getItem(`atelie_clients_${user.id}`) ||
        (isMaster ? localStorage.getItem('atelie_clients_user-luccy-default') : null) ||
        (isMaster ? localStorage.getItem('atelie_clients_user-luccy-master') : null);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    if (isMaster) return INITIAL_CLIENTS;
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

  const [catalogCategories, setCatalogCategories] = useState<string[]>(() =>
    currentUser ? loadUserCategories(currentUser) : DEFAULT_CATALOG_CATEGORIES
  );

  const [orderTypes, setOrderTypes] = useState<string[]>(() =>
    currentUser ? loadUserOrderTypes(currentUser) : DEFAULT_ORDER_TYPES
  );

  const [quotations, setQuotations] = useState<Quotation[]>(() =>
    currentUser ? loadUserQuotations(currentUser) : []
  );

  const [clients, setClients] = useState<Client[]>(() =>
    currentUser ? loadUserClients(currentUser) : []
  );

  // Draft data when approving a quote or selecting a client to create order
  const [orderDraftToCreate, setOrderDraftToCreate] = useState<Partial<Order> | null>(null);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [orderInProductionForNotification, setOrderInProductionForNotification] = useState<Order | null>(null);
  const [orderReadyForNotification, setOrderReadyForNotification] = useState<Order | null>(null);
  const [orderCompletedForNotification, setOrderCompletedForNotification] = useState<Order | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Persist registered users
  useEffect(() => {
    try {
      localStorage.setItem('atelie_users_db_v2', JSON.stringify(registeredUsers));
    } catch (e) {
      console.error('Error saving users to localStorage', e);
    }
  }, [registeredUsers]);

  // When currentUser changes, reload their profile, orders, catalog, quotations, clients
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('atelie_current_user_v3', JSON.stringify(currentUser));
        localStorage.setItem('atelie_active_session_id_v2', currentUser.id);
        localStorage.setItem('atelie_saved_device_user_v2', JSON.stringify(currentUser));
      } catch (e) {
        console.error(e);
      }
      
      // Initial load from local
      setProfile(loadUserProfile(currentUser));
      setOrders(loadUserOrders(currentUser));
      setCatalog(loadUserCatalog(currentUser));
      setCatalogCategories(loadUserCategories(currentUser));
      setOrderTypes(loadUserOrderTypes(currentUser));
      setQuotations(loadUserQuotations(currentUser));
      setClients(loadUserClients(currentUser));

      // Asynchronously fetch and sync with Supabase for real accounts
      if (currentUser.id !== 'user-luccy-default') {
        supabaseService.getProfile(currentUser.id).then((remoteProfile) => {
          if (remoteProfile) setProfile(remoteProfile);
        });
        supabaseService.getOrders(currentUser.id).then((remoteOrders) => {
          if (remoteOrders && remoteOrders.length > 0) {
            setOrders(remoteOrders);
            try {
              localStorage.setItem(`atelie_orders_${currentUser.id}`, JSON.stringify(remoteOrders));
            } catch (e) {}
          }
        });
        supabaseService.getCatalog(currentUser.id).then((remoteCatalog) => {
          if (remoteCatalog && remoteCatalog.length > 0) {
            setCatalog(remoteCatalog);
            try {
              localStorage.setItem(`atelie_catalog_${currentUser.id}`, JSON.stringify(remoteCatalog));
            } catch (e) {}
          }
        });
        supabaseService.getCatalogCategories(currentUser.id).then((remoteCats) => {
          if (remoteCats && remoteCats.length > 0) {
            setCatalogCategories(remoteCats);
            try {
              localStorage.setItem(`atelie_categories_${currentUser.id}`, JSON.stringify(remoteCats));
            } catch (e) {}
          }
        });
        supabaseService.getOrderTypes(currentUser.id).then((remoteTypes) => {
          if (remoteTypes && remoteTypes.length > 0) {
            setOrderTypes(remoteTypes);
            try {
              localStorage.setItem(`atelie_order_types_${currentUser.id}`, JSON.stringify(remoteTypes));
            } catch (e) {}
          }
        });
        supabaseService.getQuotations(currentUser.id).then((remoteQuotes) => {
          if (remoteQuotes && remoteQuotes.length > 0) {
            setQuotations(remoteQuotes);
            try {
              localStorage.setItem(`atelie_quotations_${currentUser.id}`, JSON.stringify(remoteQuotes));
            } catch (e) {}
          }
        });
        supabaseService.getClients(currentUser.id).then((remoteClients) => {
          if (remoteClients && remoteClients.length > 0) {
            setClients(remoteClients);
            try {
              localStorage.setItem(`atelie_clients_${currentUser.id}`, JSON.stringify(remoteClients));
            } catch (e) {}
          }
        });
      }
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

  // Save Categories for current user
  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem(`atelie_categories_${currentUser.id}`, JSON.stringify(catalogCategories));
    } catch (e) {
      console.error('Error saving user categories', e);
    }
  }, [catalogCategories, currentUser?.id]);

  // Save Order Types for current user
  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem(`atelie_order_types_${currentUser.id}`, JSON.stringify(orderTypes));
    } catch (e) {
      console.error('Error saving user order types', e);
    }
  }, [orderTypes, currentUser?.id]);

  // Save Quotations for current user
  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem(`atelie_quotations_${currentUser.id}`, JSON.stringify(quotations));
    } catch (e) {
      console.error('Error saving user quotations', e);
    }
  }, [quotations, currentUser?.id]);

  // Save Clients for current user
  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem(`atelie_clients_${currentUser.id}`, JSON.stringify(clients));
    } catch (e) {
      console.error('Error saving user clients', e);
    }
  }, [clients, currentUser?.id]);

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
    setLastSavedUser(newUser);
    setCurrentUser(newUser);
    try {
      localStorage.setItem('atelie_current_user_v3', JSON.stringify(newUser));
      localStorage.setItem('atelie_active_session_id_v2', newUser.id);
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
      localStorage.setItem('atelie_current_user_v3', JSON.stringify(user));
      localStorage.setItem('atelie_active_session_id_v2', user.id);
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

  // Handle Logout (Explicit user action to sign out)
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.log('Supabase signOut', e);
    }
    try {
      localStorage.removeItem('atelie_current_user_v3');
      localStorage.removeItem('atelie_active_session_id_v2');
    } catch (e) {
      console.error(e);
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
        username: updatedProfile.username || currentUser.username,
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
      supabaseService.saveProfile(currentUser.id, updatedProfile);
    }
  };

  // Subscription Info
  const subInfo = getSubscriptionInfo(profile);

  // Handler: Save New or Edited Order
  const handleSaveOrder = (savedOrder: Order) => {
    if (!subInfo.canPerformAction) {
      setIsSubscriptionModalOpen(true);
      return;
    }

    setOrders((prev) => {
      const exists = prev.some((o) => o.id === savedOrder.id);
      const updated = exists
        ? prev.map((o) => (o.id === savedOrder.id ? savedOrder : o))
        : [savedOrder, ...prev];
      if (currentUser) {
        try {
          localStorage.setItem(`atelie_orders_${currentUser.id}`, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });

    setOrderDraftToCreate(null);
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.saveOrder(currentUser.id, savedOrder);
    }
    setActiveTab('pedidos');
  };

  // Handler: Start Editing an Order (only for non-finalized orders)
  const handleEditOrder = (orderToEdit: Order) => {
    if (!subInfo.canPerformAction) {
      setIsSubscriptionModalOpen(true);
      return;
    }

    if (orderToEdit.status === 'Finalizado') {
      alert('Pedidos já finalizados não podem ser alterados.');
      return;
    }
    setSelectedOrder(null);
    setOrderDraftToCreate(orderToEdit);
    setActiveTab('criar-pedido');
  };

  // Handler: Update Order Status (Immediate persistence to local & cloud)
  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    if (!subInfo.canPerformAction) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    setOrders((prev) => {
      const target = prev.find((o) => o.id === orderId);
      if (!target) return prev;

      // If order is already Finalizado, lock it from further status changes
      if (target.status === 'Finalizado' && status !== 'Finalizado') {
        return prev;
      }

      const isNowFinalized = status === 'Finalizado';
      const updated: Order = {
        ...target,
        status,
        completedAt: isNowFinalized
          ? target.completedAt || new Date().toISOString()
          : target.completedAt,
        financial: isNowFinalized
          ? {
              ...target.financial,
              remaining: 0,
            }
          : target.financial,
        updatedAt: new Date().toISOString(),
      };

      if (isNowFinalized && target.status !== 'Finalizado') {
        triggerConfetti();
      }

      const updatedList = prev.map((o) => (o.id === orderId ? updated : o));

      // Persist to localStorage immediately
      if (currentUser) {
        try {
          localStorage.setItem(`atelie_orders_${currentUser.id}`, JSON.stringify(updatedList));
        } catch (e) {
          console.error('Error saving updated orders to localStorage', e);
        }
      }

      // Persist to Supabase immediately for cloud accounts
      if (currentUser && currentUser.id !== 'user-luccy-default') {
        supabaseService.saveOrder(currentUser.id, updated);
      }

      // If status changed to "Em Produção", trigger WhatsApp in-production notification modal
      if (status === 'Em Produção') {
        setOrderInProductionForNotification(updated);
      }

      // If status changed to "Pronto p/ Envio", trigger WhatsApp notification modal
      if (status === 'Pronto p/ Envio') {
        setOrderReadyForNotification(updated);
      }

      // If status changed to "Finalizado", trigger WhatsApp completion thank you & review modal
      if (isNowFinalized && target.status !== 'Finalizado') {
        setOrderCompletedForNotification(updated);
      }

      return updatedList;
    });

    if (selectedOrder && selectedOrder.id === orderId) {
      if (selectedOrder.status !== 'Finalizado' || status === 'Finalizado') {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status,
                completedAt:
                  status === 'Finalizado'
                    ? prev.completedAt || new Date().toISOString()
                    : prev.completedAt,
                financial:
                  status === 'Finalizado'
                    ? {
                        ...prev.financial,
                        remaining: 0,
                      }
                    : prev.financial,
                updatedAt: new Date().toISOString(),
              }
            : null
        );
      }
    }
  };

  // Handler: Delete Order
  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => {
      const updatedList = prev.filter((o) => o.id !== orderId);
      if (currentUser) {
        try {
          localStorage.setItem(`atelie_orders_${currentUser.id}`, JSON.stringify(updatedList));
        } catch (e) {
          console.error(e);
        }
      }
      return updatedList;
    });
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(null);
    }
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.deleteOrder(orderId);
    }
  };

  // --- CLIENT HANDLERS ---
  const handleAddClient = (newClient: Client) => {
    if (!subInfo.canPerformAction) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    setClients((prev) => {
      const updated = [newClient, ...prev];
      if (currentUser) {
        try {
          localStorage.setItem(`atelie_clients_${currentUser.id}`, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.saveClient(currentUser.id, newClient);
    }
  };

  const handleUpdateClient = (client: Client) => {
    if (!subInfo.canPerformAction) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    setClients((prev) => {
      const updated = prev.map((c) => (c.id === client.id ? client : c));
      if (currentUser) {
        try {
          localStorage.setItem(`atelie_clients_${currentUser.id}`, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.saveClient(currentUser.id, client);
    }
  };

  const handleDeleteClient = (clientId: string) => {
    if (!subInfo.canPerformAction) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    setClients((prev) => {
      const updated = prev.filter((c) => c.id !== clientId);
      if (currentUser) {
        try {
          localStorage.setItem(`atelie_clients_${currentUser.id}`, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.deleteClient(clientId);
    }
  };

  const handleSelectClientForOrder = (client: Client) => {
    if (!subInfo.canPerformAction) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    const fullAddress = [
      client.address,
      client.city ? `${client.city}/${client.state || 'SP'}` : '',
      client.zipCode ? `CEP: ${client.zipCode}` : '',
    ]
      .filter(Boolean)
      .join(' - ');

    const partialOrder: Partial<Order> = {
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      clientInstagram: client.instagram,
      deliveryAddress: fullAddress || undefined,
      personalization: client.childName
        ? {
            honoreeName: client.childName,
            specialNotes: client.notes ? `Preferências da cliente: ${client.notes}` : undefined,
          }
        : client.notes
        ? { specialNotes: `Preferências da cliente: ${client.notes}` }
        : undefined,
    };
    setOrderDraftToCreate(partialOrder);
    setActiveTab('criar-pedido');
  };

  // Handler: Add Catalog Item
  const handleAddCatalogItem = (item: CatalogItem) => {
    if (!subInfo.canPerformAction) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    setCatalog((prev) => {
      const updated = [item, ...prev];
      if (currentUser) {
        try {
          localStorage.setItem(`atelie_catalog_${currentUser.id}`, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.saveCatalogItem(currentUser.id, item);
    }
  };

  // Handler: Update Catalog Item
  const handleUpdateCatalogItem = (item: CatalogItem) => {
    if (!subInfo.canPerformAction) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    setCatalog((prev) => {
      const updated = prev.map((c) => (c.id === item.id ? item : c));
      if (currentUser) {
        try {
          localStorage.setItem(`atelie_catalog_${currentUser.id}`, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.saveCatalogItem(currentUser.id, item);
    }
  };

  // Handler: Delete Catalog Item
  const handleDeleteCatalogItem = (itemId: string) => {
    if (!subInfo.canPerformAction) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    setCatalog((prev) => {
      const updated = prev.filter((c) => c.id !== itemId);
      if (currentUser) {
        try {
          localStorage.setItem(`atelie_catalog_${currentUser.id}`, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.deleteCatalogItem(itemId);
    }
  };

  // Handler: Update Catalog Categories (Add, Rename, Delete)
  const handleUpdateCategories = (
    newCategories: string[],
    renamedMap?: { oldName: string; newName: string },
    deletedCategory?: string
  ) => {
    setCatalogCategories(newCategories);

    if (currentUser) {
      try {
        localStorage.setItem(`atelie_categories_${currentUser.id}`, JSON.stringify(newCategories));
      } catch (e) {
        console.error(e);
      }
      if (currentUser.id !== 'user-luccy-default') {
        supabaseService.saveCatalogCategories(currentUser.id, newCategories);
      }
    }

    if (renamedMap) {
      setCatalog((prev) => {
        const updated = prev.map((item) =>
          item.category === renamedMap.oldName ? { ...item, category: renamedMap.newName } : item
        );
        if (currentUser) {
          try {
            localStorage.setItem(`atelie_catalog_${currentUser.id}`, JSON.stringify(updated));
          } catch (e) {}
          if (currentUser.id !== 'user-luccy-default') {
            updated.forEach((item) => {
              if (item.category === renamedMap.newName) {
                supabaseService.saveCatalogItem(currentUser.id, item);
              }
            });
          }
        }
        return updated;
      });
    }

    if (deletedCategory) {
      const fallbackCat = newCategories.length > 0 ? newCategories[0] : 'Geral';
      setCatalog((prev) => {
        const updated = prev.map((item) =>
          item.category === deletedCategory ? { ...item, category: fallbackCat } : item
        );
        if (currentUser) {
          try {
            localStorage.setItem(`atelie_catalog_${currentUser.id}`, JSON.stringify(updated));
          } catch (e) {}
          if (currentUser.id !== 'user-luccy-default') {
            updated.forEach((item) => {
              if (item.category === fallbackCat) {
                supabaseService.saveCatalogItem(currentUser.id, item);
              }
            });
          }
        }
        return updated;
      });
    }
  };

  // Handler: Update Order Types (Add, Rename, Delete)
  const handleUpdateOrderTypes = (
    newTypes: string[],
    renamedMap?: { oldName: string; newName: string },
    deletedType?: string
  ) => {
    setOrderTypes(newTypes);
    if (currentUser) {
      try {
        localStorage.setItem(`atelie_order_types_${currentUser.id}`, JSON.stringify(newTypes));
      } catch (e) {
        console.error(e);
      }
      if (currentUser.id !== 'user-luccy-default') {
        supabaseService.saveOrderTypes(currentUser.id, newTypes);
      }
    }
  };

  // Handler: Select product to create order
  const handleSelectProductForOrder = (item: CatalogItem) => {
    setActiveTab('criar-pedido');
  };

  // Handler: Save Quotation (Pendente/Aprovado/Recusado)
  const handleSaveQuotation = (quote: Quotation) => {
    if (!subInfo.canPerformAction) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    setQuotations((prev) => {
      const exists = prev.some((q) => q.id === quote.id);
      const updated = exists ? prev.map((q) => (q.id === quote.id ? quote : q)) : [quote, ...prev];
      if (currentUser) {
        try {
          localStorage.setItem(`atelie_quotations_${currentUser.id}`, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.saveQuotation(currentUser.id, quote);
    }
  };

  // Handler: Delete Quotation
  const handleDeleteQuotation = (quoteId: string) => {
    if (!subInfo.canPerformAction) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    setQuotations((prev) => {
      const updated = prev.filter((q) => q.id !== quoteId);
      if (currentUser) {
        try {
          localStorage.setItem(`atelie_quotations_${currentUser.id}`, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    if (currentUser && currentUser.id !== 'user-luccy-default') {
      supabaseService.deleteQuotation(quoteId);
    }
  };

  // Handler: Approve and Create Order from Quote
  const handleApproveAndCreateOrder = (partialOrder: Partial<Order>, quoteId?: string) => {
    if (!subInfo.canPerformAction) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    if (quoteId) {
      setQuotations((prev) => {
        const updated = prev.map((q) =>
          q.id === quoteId
            ? { ...q, status: 'Aprovado' as const, updatedAt: new Date().toISOString() }
            : q
        );
        if (currentUser) {
          try {
            localStorage.setItem(`atelie_quotations_${currentUser.id}`, JSON.stringify(updated));
          } catch (e) {}
          if (currentUser.id !== 'user-luccy-default') {
            const found = updated.find((q) => q.id === quoteId);
            if (found) supabaseService.saveQuotation(currentUser.id, found);
          }
        }
        return updated;
      });
    }
    setOrderDraftToCreate(partialOrder);
    setActiveTab('criar-pedido');
  };

  // Backup handlers
  const handleExportData = () => {
    const backupData = {
      version: '2.3',
      user: currentUser?.email,
      exportedAt: new Date().toISOString(),
      profile,
      catalog,
      categories: catalogCategories,
      orderTypes,
      orders,
      quotations,
      clients,
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
          if (currentUser) {
            try {
              localStorage.setItem(`atelie_orders_${currentUser.id}`, JSON.stringify(parsed.orders));
            } catch (e) {}
            if (currentUser.id !== 'user-luccy-default') {
              parsed.orders.forEach((o: Order) => supabaseService.saveOrder(currentUser.id, o));
            }
          }
        }
        if (parsed.catalog && Array.isArray(parsed.catalog)) {
          setCatalog(parsed.catalog);
          if (currentUser) {
            try {
              localStorage.setItem(`atelie_catalog_${currentUser.id}`, JSON.stringify(parsed.catalog));
            } catch (e) {}
            if (currentUser.id !== 'user-luccy-default') {
              parsed.catalog.forEach((c: CatalogItem) => supabaseService.saveCatalogItem(currentUser.id, c));
            }
          }
        }
        if (parsed.categories && Array.isArray(parsed.categories)) {
          setCatalogCategories(parsed.categories);
          if (currentUser) {
            try {
              localStorage.setItem(`atelie_categories_${currentUser.id}`, JSON.stringify(parsed.categories));
            } catch (e) {}
          }
        }
        if (parsed.orderTypes && Array.isArray(parsed.orderTypes)) {
          setOrderTypes(parsed.orderTypes);
          if (currentUser) {
            try {
              localStorage.setItem(`atelie_order_types_${currentUser.id}`, JSON.stringify(parsed.orderTypes));
            } catch (e) {}
          }
        }
        if (parsed.quotations && Array.isArray(parsed.quotations)) {
          setQuotations(parsed.quotations);
          if (currentUser) {
            try {
              localStorage.setItem(`atelie_quotations_${currentUser.id}`, JSON.stringify(parsed.quotations));
            } catch (e) {}
            if (currentUser.id !== 'user-luccy-default') {
              parsed.quotations.forEach((q: Quotation) => supabaseService.saveQuotation(currentUser.id, q));
            }
          }
        }
        if (parsed.clients && Array.isArray(parsed.clients)) {
          setClients(parsed.clients);
          if (currentUser) {
            try {
              localStorage.setItem(`atelie_clients_${currentUser.id}`, JSON.stringify(parsed.clients));
            } catch (e) {}
            if (currentUser.id !== 'user-luccy-default') {
              parsed.clients.forEach((c: Client) => supabaseService.saveClient(currentUser.id, c));
            }
          }
        }
        if (parsed.profile) {
          setProfile(parsed.profile);
          if (currentUser) {
            try {
              localStorage.setItem(`atelie_profile_${currentUser.id}`, JSON.stringify(parsed.profile));
            } catch (e) {}
            if (currentUser.id !== 'user-luccy-default') {
              supabaseService.saveProfile(currentUser.id, parsed.profile);
            }
          }
        }
        alert('Dados restaurados com sucesso!');
      } catch (err) {
        console.error('Erro ao importar backup', err);
        alert('Arquivo de backup inválido ou corrompido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
    <div className="min-h-screen bg-[#faf7f8] text-slate-900 flex font-sans antialiased selection:bg-[#ffd1dc] selection:text-[#ac2471]">
      {/* Desktop & Mobile Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ordersCount={activeOrdersCount}
        urgentCount={urgentOrdersCount}
        clientsCount={clients.length}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        logoUrl={profile.logoUrl}
        atelierName={profile.name}
        onLogout={handleLogout}
        isAdmin={subInfo.isAdmin}
        onOpenPlans={() => setIsSubscriptionModalOpen(true)}
        statusBadgeText={subInfo.statusBadgeText}
        statusBadgeClass={subInfo.statusBadgeClass}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 pb-16 md:pb-0 overflow-x-auto">
        {/* Subscription & Trial Alert Banner */}
        <SubscriptionBanner
          profile={profile}
          onOpenPlans={() => setIsSubscriptionModalOpen(true)}
          onOpenAdmin={() => setActiveTab('admin-usuarios')}
        />

        {/* Top Header */}
        <Header
          profile={profile}
          currentUser={currentUser}
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
              clients={clients}
              orderTypes={orderTypes}
              initialData={orderDraftToCreate}
              onClearInitialData={() => setOrderDraftToCreate(null)}
              onSaveOrder={handleSaveOrder}
              onNavigateToCatalog={() => setActiveTab('catalogo')}
              onUpdateOrderTypes={handleUpdateOrderTypes}
            />
          )}

          {activeTab === 'pedidos' && (
            <PedidosView
              orders={orders}
              profile={profile}
              onSelectOrder={(ord) => setSelectedOrder(ord)}
              onEditOrder={handleEditOrder}
              onPrintOrder={(ord) => setOrderToPrint(ord)}
              onUpdateStatus={handleUpdateStatus}
              onDeleteOrder={handleDeleteOrder}
              onNavigateToNewOrder={() => {
                if (!subInfo.canPerformAction) {
                  setIsSubscriptionModalOpen(true);
                  return;
                }
                setActiveTab('criar-pedido');
              }}
              onNotifyInProduction={(ord) => setOrderInProductionForNotification(ord)}
              onNotifyReady={(ord) => setOrderReadyForNotification(ord)}
              onNotifyCompleted={(ord) => setOrderCompletedForNotification(ord)}
            />
          )}

          {activeTab === 'clientes' && (
            <ClientesView
              clients={clients}
              orders={orders}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onSelectClientForOrder={handleSelectClientForOrder}
            />
          )}

          {activeTab === 'catalogo' && (
            <CatalogoView
              catalog={catalog}
              categories={catalogCategories}
              onAddCatalogItem={handleAddCatalogItem}
              onUpdateCatalogItem={handleUpdateCatalogItem}
              onDeleteCatalogItem={handleDeleteCatalogItem}
              onSelectProductForOrder={handleSelectProductForOrder}
              onUpdateCategories={handleUpdateCategories}
            />
          )}

          {activeTab === 'orcamento' && (
            <OrcamentoView
              quotations={quotations}
              onSaveQuotation={handleSaveQuotation}
              onDeleteQuotation={handleDeleteQuotation}
              onApproveAndCreateOrder={handleApproveAndCreateOrder}
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

          {activeTab === 'admin-usuarios' && subInfo.isAdmin && (
            <div className="p-4 sm:p-8">
              <AdminUsersView
                currentAdminProfile={profile}
                onProfileUpdated={handleUpdateProfile}
              />
            </div>
          )}
        </main>
      </div>

      {/* ================= MODALS ================= */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          profile={profile}
          onClose={() => setSelectedOrder(null)}
          onEditOrder={handleEditOrder}
          onUpdateStatus={handleUpdateStatus}
          onPrintOrder={(ord) => {
            setSelectedOrder(null);
            setOrderToPrint(ord);
          }}
          onNotifyInProduction={(ord) => setOrderInProductionForNotification(ord)}
          onNotifyReady={(ord) => setOrderReadyForNotification(ord)}
          onNotifyCompleted={(ord) => setOrderCompletedForNotification(ord)}
        />
      )}

      {orderToPrint && (
        <OrderReceiptModal
          order={orderToPrint}
          profile={profile}
          onClose={() => setOrderToPrint(null)}
        />
      )}

      {orderInProductionForNotification && (
        <OrderInProductionNotificationModal
          order={orderInProductionForNotification}
          profile={profile}
          clients={clients}
          onClose={() => setOrderInProductionForNotification(null)}
        />
      )}

      {orderReadyForNotification && (
        <OrderReadyNotificationModal
          order={orderReadyForNotification}
          profile={profile}
          clients={clients}
          onClose={() => setOrderReadyForNotification(null)}
        />
      )}

      {orderCompletedForNotification && (
        <OrderCompletedNotificationModal
          order={orderCompletedForNotification}
          profile={profile}
          clients={clients}
          onClose={() => setOrderCompletedForNotification(null)}
        />
      )}

      {/* Subscription Paywall & Plans Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        profile={profile}
        adminContactPhone={profile.phone}
        adminPixKey={profile.pixKey}
      />
    </div>
  );
}
