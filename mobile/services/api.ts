import { db } from '../firebaseConfig';
import { Restaurant, MenuItem, Cart, Order, Banner, Category, ProductFilter, Review, Wishlist } from '../types';

const response = <T>(data: T) => ({ data });

export const restaurantAPI = {
    getAll: async () => {
        return response([] as Restaurant[]);
    },
    getById: async (id: string) => {
        return response({ id } as Restaurant);
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
        return response({ id } as MenuItem);
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
        return response({ items: [], subtotal: 0, deliveryFee: 0, tax: 0, total: 0 } as Cart);
    },
    addItem: async (item: any) => {
        return response({} as Cart);
    },
    updateQuantity: async (itemId: string, quantity: number) => {
        return response({} as Cart);
    },
    clear: async () => {
        return response({} as Cart);
    },
};

export const orderAPI = {
    getAll: async () => {
        return response([] as Order[]);
    },
    getById: async (id: string) => {
        return response({ id } as Order);
    },
    create: async (orderData: any) => {
        return response({ id: 'ord-1', ...orderData } as Order);
    },
};

export const wishlistAPI = {
    get: async () => {
        return response([] as Wishlist[]);
    },
    toggle: async (restaurantId: string) => {
        return response({ restaurantId } as Wishlist);
    },
};

export const reviewAPI = {
    getByRestaurant: async (restaurantId: string) => {
        return response([] as Review[]);
    },
    add: async (reviewData: any) => {
        return response({ id: 'rev-1', ...reviewData } as Review);
    },
};
