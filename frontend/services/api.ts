import {
  Raffle,
  Order,
  Winner,
  Settings,
  OrderStatus,
  AdminUser,
} from '../types';

// --- IMPORTANTE ---
// Esta URL se configura automáticamente según el entorno
// En desarrollo: http://localhost:3000/api (con proxy de Vite)
// En producción: se toma de la variable de entorno VITE_API_URL
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

// Debug: Log the API URL being used
console.log('🔗 API URL being used:', API_URL);
console.log('🌍 Environment:', (import.meta as any).env?.MODE);
console.log('📋 VITE_API_URL from env:', (import.meta as any).env?.VITE_API_URL);
console.log('📋 All env vars:', (import.meta as any).env);

/**
 * A robust response handler for fetch requests.
 */
const handleResponse = async (response: Response) => {
    // For 204 No Content, which is common for DELETE, return success without parsing JSON.
    if (response.status === 204) {
        return;
    }

    if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
            // Attempt to get a more specific error from the response body
            const errorBody = await response.json();
            errorMessage = errorBody.message || JSON.stringify(errorBody);
        } catch (e) {
            // The body was not JSON or another error occurred.
            // The initial error message is the best we have.
        }
        throw new Error(errorMessage);
    }

    // If the response is OK, parse the JSON body.
    return response.json();
};

const parseDates = (data: any, fields: string[]): any => {
    if (!data) return data;
    const parsedData = { ...data };
    fields.forEach(field => {
        if (parsedData[field]) {
            parsedData[field] = new Date(parsedData[field]);
        }
    });
    return parsedData;
}

const parseOrderDates = (order: any) => parseDates(order, ['createdAt', 'expiresAt']);
const parseRaffleDates = (raffle: any) => parseDates(raffle, ['drawDate']);
const parseWinnerDates = (winner: any) => parseDates(winner, ['drawDate']);


// --- Public API Calls ---

export const getActiveRaffles = async (): Promise<Raffle[]> => {
    try {
        console.log('Trying backend for active raffles...');
        const response = await fetch(`${API_URL}/public/raffles/active`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend raffles loaded successfully');
            return data;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for active raffles');
    const { localApi } = await import('./localApi');
    return localApi.getRaffles();
};

export const getRaffleBySlug = async (slug: string): Promise<Raffle | undefined> => {
    try {
        console.log('🔍 Trying backend for raffle by slug:', slug);
        const response = await fetch(`${API_URL}/public/raffles/slug/${slug}`);
        const raffle = await handleResponse(response);
        console.log('✅ Backend raffle by slug loaded successfully:', { id: raffle?.id, title: raffle?.title });
        return parseDates(raffle, ['drawDate', 'createdAt', 'updatedAt']);
    } catch (error) {
        console.error('❌ Backend error for raffle by slug:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for raffle by slug');
    const { localApi } = await import('./localApi');
    const raffles = await localApi.getRaffles();
    return raffles.find(r => r.slug === slug);
};

export const getRaffleById = async (id: string): Promise<Raffle | undefined> => {
    try {
        console.log('🔍 Trying backend for raffle by ID:', id);
        const response = await fetch(`${API_URL}/public/raffles/${id}`);
        const raffle = await handleResponse(response);
        console.log('✅ Backend raffle by ID loaded successfully:', { id: raffle?.id, title: raffle?.title });
        return parseDates(raffle, ['drawDate', 'createdAt', 'updatedAt']);
    } catch (error) {
        console.error('❌ Backend error for raffle by ID:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for raffle by ID');
    const { localApi } = await import('./localApi');
    const raffles = await localApi.getRaffles();
    return raffles.find(r => r.id === id);
};

export const getOccupiedTickets = async (raffleId: string): Promise<number[]> => {
    try {
        console.log('🔍 Trying backend for occupied tickets:', raffleId);
        const response = await fetch(`${API_URL}/public/raffles/${raffleId}/occupied-tickets`);
        const tickets = await handleResponse(response);
        console.log('✅ Backend occupied tickets loaded successfully:', tickets?.length || 0);
        return tickets || [];
    } catch (error) {
        console.error('❌ Backend error for occupied tickets:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for occupied tickets');
    return [];
};

export const getPastWinners = async (): Promise<Winner[]> => {
    console.log('Using local data for winners (backend disabled)');
    const { localApi } = await import('./localApi');
    return localApi.getWinners();
};

export const getSettings = async (): Promise<Settings> => {
    try {
        console.log('Trying backend for settings...');
        const response = await fetch(`${API_URL}/public/settings`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend settings loaded successfully');
            return data;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for settings');
    const { localApi } = await import('./localApi');
    return localApi.getSettings();
};

export const updateSettings = async (settings: Partial<Settings>): Promise<Settings> => {
    try {
        console.log('Trying backend for update settings...');
        const response = await fetch(`${API_URL}/admin/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend settings updated successfully');
            return data;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for update settings');
    const { localApi } = await import('./localApi');
    return localApi.updateSettings(settings);
};

// --- Admin API Calls ---

export const createRaffle = async (raffle: Omit<Raffle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Raffle> => {
    try {
        console.log('Trying backend for create raffle...');
        console.log('Payload size:', JSON.stringify(raffle).length, 'bytes');
        console.log('Payload preview:', {
            title: raffle.title,
            gallery: raffle.gallery?.length || 0,
            packs: raffle.packs?.length || 0,
            heroImage: raffle.heroImage ? (raffle.heroImage.startsWith('data:') ? 'BASE64' : 'URL') : 'NONE'
        });
        
        // Verificar si hay imágenes base64
        const hasBase64Images = raffle.heroImage?.startsWith('data:') || 
                               raffle.gallery?.some(img => img.startsWith('data:'));
        if (hasBase64Images) {
            console.log('⚠️ ADVERTENCIA: Se detectaron imágenes base64 que pueden causar error 413');
        }
        
        const response = await fetch(`${API_URL}/admin/raffles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(raffle),
        });
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend raffle created successfully');
            return data;
        } else {
            console.log('❌ Backend returned error status:', response.status);
            const errorText = await response.text();
            console.log('❌ Error details:', errorText);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for create raffle');
    const { localApi } = await import('./localApi');
    return localApi.createRaffle(raffle);
};

export const updateRaffle = async (id: string, raffle: Partial<Raffle>): Promise<Raffle> => {
    try {
        console.log('Trying backend for update raffle...');
        const response = await fetch(`${API_URL}/admin/raffles/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(raffle),
        });
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend raffle updated successfully');
            return data;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for update raffle');
    const { localApi } = await import('./localApi');
    return localApi.updateRaffle(id, raffle);
};

export const deleteRaffle = async (id: string): Promise<void> => {
    try {
        console.log('Trying backend for delete raffle...');
        const response = await fetch(`${API_URL}/admin/raffles/${id}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            console.log('✅ Backend raffle deleted successfully');
            return;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for delete raffle');
    const { localApi } = await import('./localApi');
    return localApi.deleteRaffle(id);
};

export const getRaffles = async (): Promise<Raffle[]> => {
    try {
        console.log('Trying backend for get raffles...');
        const response = await fetch(`${API_URL}/admin/raffles`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend raffles loaded successfully');
            return data;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for get raffles');
    const { localApi } = await import('./localApi');
    return localApi.getRaffles();
};

export const getUsers = async (): Promise<AdminUser[]> => {
    try {
        console.log('Trying backend for get users...');
        const response = await fetch(`${API_URL}/admin/users`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend users loaded successfully');
            return data;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for get users');
    const { localApi } = await import('./localApi');
    return localApi.getUsers();
};

export const createUser = async (user: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminUser> => {
    try {
        console.log('Trying backend for create user...');
        const response = await fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend user created successfully');
            return data;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for create user');
    const { localApi } = await import('./localApi');
    return localApi.createUser(user);
};

export const updateUser = async (id: string, user: Partial<AdminUser>): Promise<AdminUser> => {
    try {
        console.log('Trying backend for update user...');
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend user updated successfully');
            return data;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for update user');
    const { localApi } = await import('./localApi');
    return localApi.updateUser(id, user);
};

export const deleteUser = async (id: string): Promise<void> => {
    try {
        console.log('Trying backend for delete user...');
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            console.log('✅ Backend user deleted successfully');
            return;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for delete user');
    const { localApi } = await import('./localApi');
    return localApi.deleteUser(id);
};

export const createOrder = async (orderData: Omit<Order, 'folio' | 'status' | 'createdAt' | 'expiresAt' | 'id'>): Promise<Order> => {
    console.log('Using local data for create order (backend disabled)');
    const { localApi } = await import('./localApi');
    return localApi.createOrder(orderData);
};

export const getOrderbyFolio = async (folio: string): Promise<Order | undefined> => {
     try {
        const data = await handleResponse(await fetch(`${API_URL}/public/orders/folio/${folio}`));
        return data ? parseOrderDates(data) : undefined;
    } catch (e) {
        // If the order is not found (404), handleResponse will throw. We return undefined.
        return undefined;
    }
};

// --- Admin API Calls ---

export const getDashboardStats = async () => {
    return handleResponse(await fetch(`${API_URL}/admin/stats`));
};

export const adminGetAllOrders = async (): Promise<Order[]> => {
    const data = await handleResponse(await fetch(`${API_URL}/admin/orders`));
    return data.map(parseOrderDates);
};

export const adminGetRaffles = async (): Promise<Raffle[]> => {
    const data = await handleResponse(await fetch(`${API_URL}/admin/raffles`));
    return data.map(parseRaffleDates);
};

export const adminCreateRaffle = async (data: Omit<Raffle, 'id' | 'sold'>): Promise<Raffle> => {
    const response = await fetch(`${API_URL}/admin/raffles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return parseRaffleDates(result);
};

export const adminUpdateRaffle = async (data: Raffle): Promise<Raffle> => {
    const response = await fetch(`${API_URL}/admin/raffles/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return parseRaffleDates(result);
};

export const adminDeleteRaffle = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/raffles/${id}`, { method: 'DELETE' });
    await handleResponse(response);
};

export const adminUpdateOrderStatus = async (folio: string, status: OrderStatus): Promise<Order> => {
     const response = await fetch(`${API_URL}/admin/orders/${folio}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    const data = await handleResponse(response);
    return parseOrderDates(data);
};

export const getFinishedRaffles = async (): Promise<Raffle[]> => {
    const data = await handleResponse(await fetch(`${API_URL}/admin/raffles/finished`));
    return data.map(parseRaffleDates);
}

export const drawWinner = async (raffleId: string): Promise<{ ticket: number; order: Order }> => {
    const response = await fetch(`${API_URL}/admin/winners/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raffleId }),
    });
    const data = await handleResponse(response);
    return { ...data, order: parseOrderDates(data.order) };
};

export const saveWinner = async (winnerData: Omit<Winner, 'id'>): Promise<Winner> => {
    const response = await fetch(`${API_URL}/admin/winners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(winnerData),
    });
    const data = await handleResponse(response);
    return parseWinnerDates(data);
};

export const adminGetAllWinners = async (): Promise<Winner[]> => {
    const data = await handleResponse(await fetch(`${API_URL}/admin/winners`));
    return data.map(parseWinnerDates);
}

export const adminDeleteWinner = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/winners/${id}`, { method: 'DELETE' });
    await handleResponse(response);
}

export const adminGetUsers = async (): Promise<AdminUser[]> => {
    return handleResponse(await fetch(`${API_URL}/admin/users`));
};

// Funciones de órdenes mejoradas
export const createOrder = async (order: Omit<Order, 'id' | 'folio' | 'createdAt' | 'updatedAt' | 'expiresAt'>): Promise<Order> => {
    try {
        console.log('Trying backend for create order...');
        const response = await fetch(`${API_URL}/public/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        });
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend order created successfully');
            return parseOrderDates(data);
        } else {
            console.log('❌ Backend returned error status:', response.status);
            const errorText = await response.text();
            console.log('❌ Error details:', errorText);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for create order');
    const { localApi } = await import('./localApi');
    return localApi.createOrder(order);
};

export const getOrderByFolio = async (folio: string): Promise<Order | undefined> => {
    try {
        console.log('🔍 Trying backend for order by folio:', folio);
        const response = await fetch(`${API_URL}/public/orders/folio/${folio}`);
        const order = await handleResponse(response);
        console.log('✅ Backend order by folio loaded successfully:', { folio: order?.folio });
        return parseOrderDates(order);
    } catch (error) {
        console.error('❌ Backend error for order by folio:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for order by folio');
    const { localApi } = await import('./localApi');
    return localApi.getOrderByFolio(folio);
};

export const getOrders = async (): Promise<Order[]> => {
    try {
        console.log('🔍 Trying backend for orders...');
        const response = await fetch(`${API_URL}/admin/orders`);
        const orders = await handleResponse(response);
        console.log('✅ Backend orders loaded successfully:', orders?.length || 0);
        return orders?.map(parseOrderDates) || [];
    } catch (error) {
        console.error('❌ Backend error for orders:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for orders');
    const { localApi } = await import('./localApi');
    return localApi.getOrders();
};

export const updateOrder = async (id: string, order: Partial<Order>): Promise<Order> => {
    try {
        console.log('Trying backend for update order...');
        const response = await fetch(`${API_URL}/admin/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        });
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend order updated successfully');
            return parseOrderDates(data);
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for update order');
    const { localApi } = await import('./localApi');
    return localApi.updateOrder(id, order);
};

export const deleteOrder = async (id: string): Promise<void> => {
    try {
        console.log('Trying backend for delete order...');
        const response = await fetch(`${API_URL}/admin/orders/${id}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            console.log('✅ Backend order deleted successfully');
            return;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for delete order');
    const { localApi } = await import('./localApi');
    return localApi.deleteOrder(id);
};

// Funciones de clientes
export const getCustomers = async (): Promise<any[]> => {
    try {
        console.log('🔍 Trying backend for customers...');
        const response = await fetch(`${API_URL}/admin/customers`);
        const customers = await handleResponse(response);
        console.log('✅ Backend customers loaded successfully:', customers?.length || 0);
        return customers || [];
    } catch (error) {
        console.error('❌ Backend error for customers:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for customers');
    const { localApi } = await import('./localApi');
    return localApi.getCustomers();
};

export const getCustomerById = async (id: string): Promise<any | undefined> => {
    try {
        console.log('🔍 Trying backend for customer by ID:', id);
        const response = await fetch(`${API_URL}/admin/customers/${id}`);
        const customer = await handleResponse(response);
        console.log('✅ Backend customer by ID loaded successfully:', { id: customer?.id });
        return customer;
    } catch (error) {
        console.error('❌ Backend error for customer by ID:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for customer by ID');
    const { localApi } = await import('./localApi');
    return localApi.getCustomerById(id);
};

export const adminCreateUser = async (data: Omit<AdminUser, 'id'>): Promise<AdminUser> => {
    const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const adminUpdateUser = async (data: AdminUser): Promise<AdminUser> => {
     const response = await fetch(`${API_URL}/admin/users/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const adminDeleteUser = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/users/${id}`, { method: 'DELETE' });
    await handleResponse(response);
};

export const adminUpdateSettings = async (settings: Settings): Promise<Settings> => {
    const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'POST', // Using POST for upsert
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    });
    return handleResponse(response);
}