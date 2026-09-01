import { supabase } from '../lib/supabaseClient';
import { AtelieProfile, CatalogItem, Order, UserAccount } from '../types';

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
      return {
        name: data.atelie_name || data.name,
        ownerName: data.name,
        role: data.role || 'Artesã Responsável',
        slogan: data.slogan || 'Papelaria Personalizada & Afetiva',
        phone: data.phone || '',
        pixKey: data.pix_key || '',
        instagram: data.instagram || '',
        email: data.email || '',
        address: data.address || '',
        logoUrl: data.logo_url || data.avatar_url || '',
        avatarUrl: data.avatar_url || data.logo_url || '',
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
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        slogan: profile.slogan,
        pix_key: profile.pixKey,
        instagram: profile.instagram,
        address: profile.address,
        logo_url: profile.logoUrl,
        avatar_url: profile.avatarUrl,
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
};
