import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from 'react';

export interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  storage: string;
  color: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

interface CartContextValue {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

const CART_STORAGE_KEY = 'cart';

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'LOAD_CART':
      return { items: action.payload };

    case 'ADD_ITEM': {
      const { product, quantity } = action.payload;
      const existingIndex = state.items.findIndex(
        (item) => item.product.id === product.id
      );

      if (existingIndex >= 0) {
        const updatedItems = state.items.map((item, index) => {
          if (index === existingIndex) {
            const newQuantity = item.quantity + quantity;
            return {
              ...item,
              quantity: Math.min(newQuantity, item.product.stock),
            };
          }
          return item;
        });
        return { items: updatedItems };
      }

      return {
        items: [...state.items, { product, quantity: Math.min(quantity, product.stock) }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        items: state.items.filter(
          (item) => item.product.id !== action.payload
        ),
      };

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;

      if (quantity <= 0) {
        return {
          items: state.items.filter((item) => item.product.id !== productId),
        };
      }

      return {
        items: state.items.map((item) => {
          if (item.product.id === productId) {
            const maxQuantity = item.product.stock;
            return {
              ...item,
              quantity: quantity > maxQuantity ? maxQuantity : quantity,
            };
          }
          return item;
        }),
      };
    }

    case 'CLEAR_CART':
      return { items: [] };

    default:
      return state;
  }
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          dispatch({ type: 'LOAD_CART', payload: parsed });
        }
      }
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Storage quota exceeded or unavailable — silently ignore
    }
  }, [state.items]);

  const total = state.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback((product: Product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  }, []);

  const removeItem = useCallback((productId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  return (
    <CartContext.Provider
      value={{ items: state.items, total, itemCount, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
