import { Restaurant, MenuItem, Cart, Order, Banner, Category, Review, Wishlist } from '../types';

export const db: any = {};

const response = <T>(data: T) => ({ data });

export const restaurantAPI = {
    getAll: async () => {
        return response([] as Restaurant[]);
    },
    getById: async (id: string) => {
        return response({ id } as unknown as Restaurant);
    },
    getByCuisine: async (cuisineType: string) => {
        return response([] as Restaurant[]);
    },
};

export const menuItemAPI = {
    getByRestaurant: async (restaurantId: string) => {
        return response([] as MenuItem[]);
    },
    getById: async (id: string) => {
        return response({ id } as unknown as MenuItem);
    },
};

export const bannerAPI = {
    getAll: async () => {
        return response([] as Banner[]);
    },
};

export const cuisineCategoryAPI = {
    getAll: async () => {
        return response([] as Category[]);
    },
};

export const cartAPI = {
    get: async () => {
        return response({ id: 'cart-1', userId: 'u-1', restaurantId: 'r-1', items: [], totalAmount: 0 } as unknown as Cart);
    },
    addItem: async (item: any) => {
        return response({} as unknown as Cart);
    },
    updateQuantity: async (itemId: string, quantity: number) => {
        return response({} as unknown as Cart);
    },
    clear: async () => {
        return response({} as unknown as Cart);
    },
};

export const orderAPI = {
    getAll: async () => {
        return response([] as Order[]);
    },
    getById: async (id: string) => {
        return response({ id } as unknown as Order);
    },
    create: async (orderData: any) => {
        return response({ id: 'ord-1', ...orderData } as unknown as Order);
    },
};

export const wishlistAPI = {
    get: async () => {
        return response([] as Wishlist[]);
    },
    toggle: async (restaurantId: string) => {
        return response({ id: 'w-1', userId: 'u-1', restaurantIds: [restaurantId] } as unknown as Wishlist);
    },
};

export const reviewAPI = {
    getByRestaurant: async (restaurantId: string) => {
        return response([] as Review[]);
    },
    add: async (reviewData: any) => {
        return response({ id: 'rev-1', ...reviewData } as unknown as Review);
    },
};
