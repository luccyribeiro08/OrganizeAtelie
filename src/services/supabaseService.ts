import { supabase } from '../lib/supabaseClient';
import { AtelieProfile, CatalogItem, Client, Order, Quotation } from '../types';

export const supabaseService = {
  // --- PROFILES ---
  async getProfile(userId: string): Promise<AtelieProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error || !data) return null;

      // Default trial to 7 days from creation if not set
      let trialEnds = data.trial_ends_at;
      if (!trialEnds) {
        const createdDate = data.created_at ? new Date(data.created_at) : new Date();
        trialEnds = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }

      return {
        id: data.id,
        name: data.atelie_name || data.name,
        ownerName: data.name,
        username: data.username || '',
        role: data.role || 'Artesã Responsável',
        slogan: data.slogan || 'Papelaria Personalizada & Afetiva',
        phone: data.phone || '',
        pixKey: data.pix_key || '',
        instagram: data.instagram || '',
        email: data.email || '',
        address: data.address || '',
        logoUrl: data.logo_url || data.avatar_url || '',
        avatarUrl: data.avatar_url || data.logo_url || '',
        trialEndsAt: trialEnds,
        subscriptionStatus: data.subscription_status || 'trial',
        subscriptionPlan: data.subscription_plan || 'free_trial',
        subscriptionExpiresAt: data.subscription_expires_at || undefined,
        isAdmin: (data.email && data.email.trim().toLowerCase() === 'sluccy45@gmail.com') || (Boolean(data.is_admin) && data.email && data.email.trim().toLowerCase() === 'sluccy45@gmail.com'),
        mercadoPagoLinks: data.mercado_pago_links || {
          mensal: '',
          trimestral: '',
          anual: '',
          pixKey: '',
          whatsappAdmin: ''
        },
        createdAt: data.created_at,
      };
    } catch (e) {
      console.error('Error fetching profile from Supabase', e);
      return null;
    }
  },

  async saveProfile(userId: string, profile: AtelieProfile): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        name: profile.ownerName,
        atelie_name: profile.name,
        username: profile.username || null,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        slogan: profile.slogan,
        pix_key: profile.pixKey,
        instagram: profile.instagram,
        address: profile.address,
        logo_url: profile.logoUrl,
        avatar_url: profile.avatarUrl,
        trial_ends_at: profile.trialEndsAt,
        subscription_status: profile.subscriptionStatus || 'trial',
        subscription_plan: profile.subscriptionPlan || 'free_trial',
        subscription_expires_at: profile.subscriptionExpiresAt,
        is_admin: profile.isAdmin,
        mercado_pago_links: profile.mercadoPagoLinks,
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch (e) {
      console.error('Error saving profile to Supabase', e);
      return false;
    }
  },

  // --- ORDERS ---
  async getOrders(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('order_date', { ascending: false });

      if (error || !data) return [];
      return data.map((d: any) => ({
        id: d.id,
        code: d.code,
        clientName: d.client_name,
        clientPhone: d.client_phone,
        clientInstagram: d.client_instagram || '',
        orderDate: d.order_date,
        deliveryDate: d.delivery_date,
        deliveryMethod: d.delivery_method,
        deliveryAddress: d.delivery_address || '',
        theme: d.theme,
        origin: d.origin,
        orderType: d.order_type,
        items: d.items || [],
        personalization: d.personalization || {},
        financial: d.financial || {},
        status: d.status,
        completedAt: d.completed_at || undefined,
        mockupImages: d.mockup_images || [],
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    } catch (e) {
      console.error('Error fetching orders from Supabase', e);
      return [];
    }
  },

  async saveOrder(userId: string, order: Order): Promise<boolean> {
    try {
      const { error } = await supabase.from('orders').upsert({
        id: order.id,
        user_id: userId,
        code: order.code,
        client_name: order.clientName,
        client_phone: order.clientPhone,
        client_instagram: order.clientInstagram,
        order_date: order.orderDate,
        delivery_date: order.deliveryDate,
        delivery_method: order.deliveryMethod,
        delivery_address: order.deliveryAddress,
        theme: order.theme,
        origin: order.origin,
        order_type: order.orderType,
        items: order.items,
        personalization: order.personalization,
        financial: order.financial,
        status: order.status,
        completed_at: order.completedAt || null,
        mockup_images: order.mockupImages,
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch (e) {
      console.error('Error saving order to Supabase', e);
      return false;
    }
  },

  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      return !error;
    } catch (e) {
      console.error('Error deleting order from Supabase', e);
      return false;
    }
  },

  // --- CATALOG ---
  async getCatalog(userId: string): Promise<CatalogItem[]> {
    try {
      const { data, error } = await supabase
        .from('catalog')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        description: c.description || '',
        basePrice: parseFloat(c.base_price) || 0,
        estimatedDays: c.estimated_days || 3,
        imageUrl: c.image_url || '',
        tags: c.tags || [],
      }));
    } catch (e) {
      console.error('Error fetching catalog from Supabase', e);
      return [];
    }
  },

  async saveCatalogItem(userId: string, item: CatalogItem): Promise<boolean> {
    try {
      const { error } = await supabase.from('catalog').upsert({
        id: item.id,
        user_id: userId,
        name: item.name,
        category: item.category,
        description: item.description,
        base_price: item.basePrice,
        estimated_days: item.estimatedDays,
        image_url: item.imageUrl,
        tags: item.tags,
      });
      return !error;
    } catch (e) {
      console.error('Error saving catalog item to Supabase', e);
      return false;
    }
  },

  async deleteCatalogItem(itemId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('catalog').delete().eq('id', itemId);
      return !error;
    } catch (e) {
      console.error('Error deleting catalog item from Supabase', e);
      return false;
    }
  },

  // --- CATALOG CATEGORIES ---
  async getCatalogCategories(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('catalog_categories')
        .select('name')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) return [];
      return data.map((d: any) => d.name);
    } catch (e) {
      console.error('Error fetching catalog categories from Supabase', e);
      return [];
    }
  },

  async saveCatalogCategories(userId: string, categories: string[]): Promise<boolean> {
    try {
      const rows = categories.map((cat, idx) => ({
        id: `cat-grp-${userId}-${idx}-${cat.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        user_id: userId,
        name: cat,
      }));
      await supabase.from('catalog_categories').delete().eq('user_id', userId);
      if (rows.length > 0) {
        const { error } = await supabase.from('catalog_categories').insert(rows);
        return !error;
      }
      return true;
    } catch (e) {
      console.error('Error saving catalog categories to Supabase', e);
      return false;
    }
  },

  // --- ORDER TYPES ---
  async getOrderTypes(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('order_types')
        .select('name')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) return [];
      return data.map((d: any) => d.name);
    } catch (e) {
      console.error('Error fetching order types from Supabase', e);
      return [];
    }
  },

  async saveOrderTypes(userId: string, orderTypes: string[]): Promise<boolean> {
    try {
      const rows = orderTypes.map((typ, idx) => ({
        id: `ord-typ-${userId}-${idx}-${typ.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        user_id: userId,
        name: typ,
      }));
      await supabase.from('order_types').delete().eq('user_id', userId);
      if (rows.length > 0) {
        const { error } = await supabase.from('order_types').insert(rows);
        return !error;
      }
      return true;
    } catch (e) {
      console.error('Error saving order types to Supabase', e);
      return false;
    }
  },

  // --- QUOTATIONS ---
  async getQuotations(userId: string): Promise<Quotation[]> {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map((q: any) => ({
        id: q.id,
        code: q.code,
        clientName: q.client_name,
        clientPhone: q.client_phone || '',
        theme: q.theme,
        materials: q.materials || [],
        laborCost: parseFloat(q.labor_cost) || 25,
        laborHours: parseFloat(q.labor_hours) || 0,
        hourlyRate: parseFloat(q.hourly_rate) || 0,
        additionalCosts: parseFloat(q.additional_costs) || 0,
        profitMargin: parseFloat(q.profit_margin) || 40,
        calculatedPrice: parseFloat(q.calculated_price) || 0,
        suggestedPrice: parseFloat(q.suggested_price) || 0,
        roundedPrice: parseFloat(q.rounded_price) || parseFloat(q.suggested_price) || 0,
        date: q.date,
        validDays: q.valid_days || 7,
        notes: q.notes || '',
        status: q.status || 'Pendente',
        createdAt: q.created_at,
        updatedAt: q.updated_at,
      }));
    } catch (e) {
      console.error('Error fetching quotations from Supabase', e);
      return [];
    }
  },

  async saveQuotation(userId: string, quote: Quotation): Promise<boolean> {
    try {
      const { error } = await supabase.from('quotations').upsert({
        id: quote.id,
        user_id: userId,
        code: quote.code,
        client_name: quote.clientName,
        client_phone: quote.clientPhone,
        theme: quote.theme,
        materials: quote.materials,
        labor_cost: quote.laborCost,
        labor_hours: quote.laborHours || 0,
        hourly_rate: quote.hourlyRate || 0,
        additional_costs: quote.additionalCosts,
        profit_margin: quote.profitMargin,
        calculated_price: quote.calculatedPrice,
        suggested_price: quote.suggestedPrice,
        rounded_price: quote.roundedPrice || quote.suggestedPrice,
        date: quote.date,
        valid_days: quote.validDays,
        notes: quote.notes,
        status: quote.status,
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch (e) {
      console.error('Error saving quotation to Supabase', e);
      return false;
    }
  },

  async deleteQuotation(quoteId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('quotations').delete().eq('id', quoteId);
      return !error;
    } catch (e) {
      console.error('Error deleting quotation from Supabase', e);
      return false;
    }
  },

  // --- CLIENTS ---
  async getClients(userId: string): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error || !data) return [];
      return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        instagram: c.instagram || '',
        email: c.email || '',
        cpf: c.cpf || '',
        address: c.address || '',
        city: c.city || '',
        state: c.state || '',
        zipCode: c.zip_code || '',
        birthDate: c.birth_date || '',
        childName: c.child_name || '',
        childBirthDate: c.child_birth_date || '',
        notes: c.notes || '',
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }));
    } catch (e) {
      console.error('Error fetching clients from Supabase', e);
      return [];
    }
  },

  async saveClient(userId: string, client: Client): Promise<boolean> {
    try {
      const { error } = await supabase.from('clients').upsert({
        id: client.id,
        user_id: userId,
        name: client.name,
        phone: client.phone,
        instagram: client.instagram,
        email: client.email,
        cpf: client.cpf,
        address: client.address,
        city: client.city,
        state: client.state,
        zip_code: client.zipCode,
        birth_date: client.birthDate || null,
        child_name: client.childName,
        child_birth_date: client.childBirthDate || null,
        notes: client.notes,
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch (e) {
      console.error('Error saving client to Supabase', e);
      return false;
    }
  },

  async deleteClient(clientId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      return !error;
    } catch (e) {
      console.error('Error deleting client from Supabase', e);
      return false;
    }
  },

  // --- ADMIN METHODS ---
  async getAllUsersForAdmin(): Promise<AtelieProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map((d: any) => ({
        id: d.id,
        name: d.atelie_name || d.name,
        ownerName: d.name,
        role: d.role || 'Artesã Responsável',
        slogan: d.slogan || '',
        phone: d.phone || '',
        pixKey: d.pix_key || '',
        instagram: d.instagram || '',
        username: d.username || '',
        email: d.email || '',
        address: d.address || '',
        logoUrl: d.logo_url || '',
        avatarUrl: d.avatar_url || '',
        trialEndsAt: d.trial_ends_at,
        subscriptionStatus: d.subscription_status || 'trial',
        subscriptionPlan: d.subscription_plan || 'free_trial',
        subscriptionExpiresAt: d.subscription_expires_at,
        isAdmin: d.is_admin || false,
        mercadoPagoLinks: d.mercado_pago_links || {},
        createdAt: d.created_at,
      }));
    } catch (e) {
      console.error('Error fetching all profiles for admin', e);
      return [];
    }
  },

  async updateUserSubscriptionAdmin(
    targetUserId: string,
    updates: {
      subscriptionStatus: 'trial' | 'active' | 'expired' | 'admin';
      subscriptionPlan: 'free_trial' | 'mensal' | 'trimestral' | 'anual' | 'vitalicio';
      subscriptionExpiresAt?: string | null;
      trialEndsAt?: string;
      isAdmin?: boolean;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: updates.subscriptionStatus,
          subscription_plan: updates.subscriptionPlan,
          subscription_expires_at: updates.subscriptionExpiresAt,
          trial_ends_at: updates.trialEndsAt,
          is_admin: updates.isAdmin !== undefined ? updates.isAdmin : false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);

      return !error;
    } catch (e) {
      console.error('Error updating user subscription in admin', e);
      return false;
    }
  },

  async saveAdminMercadoPagoLinks(adminUserId: string, links: any): Promise<boolean> {
    try {
      // 1. Atualiza por ID do admin
      await supabase
        .from('profiles')
        .update({
          mercado_pago_links: links,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adminUserId);

      // 2. Garante atualização por e-mail da conta Master sluccy45@gmail.com
      const { error } = await supabase
        .from('profiles')
        .update({
          mercado_pago_links: links,
          updated_at: new Date().toISOString(),
        })
        .eq('email', 'sluccy45@gmail.com');

      return !error;
    } catch (e) {
      console.error('Error saving Mercado Pago links', e);
      return false;
    }
  },

  async getGlobalAdminMercadoPagoLinks(): Promise<any | null> {
    try {
      // Busca os links configurados no perfil do administrador master
      const { data, error } = await supabase
        .from('profiles')
        .select('mercado_pago_links, phone, pix_key')
        .or('email.eq.sluccy45@gmail.com,is_admin.eq.true')
        .limit(1)
        .maybeSingle();

      if (!error && data && data.mercado_pago_links) {
        return {
          mensal: data.mercado_pago_links.mensal || '',
          trimestral: data.mercado_pago_links.trimestral || '',
          anual: data.mercado_pago_links.anual || '',
          pixKey: data.mercado_pago_links.pixKey || data.pix_key || '',
          whatsappAdmin: data.mercado_pago_links.whatsappAdmin || data.phone || '',
        };
      }
    } catch (e) {
      console.error('Error fetching global admin MP links', e);
    }
    return null;
  },
};
