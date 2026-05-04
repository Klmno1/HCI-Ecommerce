"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, ProductRecord } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  addItem: (product: ProductRecord) => void;
  increaseItem: (id: string) => void;
  decreaseItem: (id: string) => void;
  removeItem: (id: string) => void;
  totalQuantity: number;
  totalAmount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const storageKey = "youde-cart";

function safeParseCartItems(value: string | null): CartItem[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is CartItem => {
      return Boolean(
        item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.price === "number" &&
          typeof item.originalPrice === "number" &&
          typeof item.quantity === "number" &&
          typeof item.imageText === "string" &&
          typeof item.subcategory === "string"
      );
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(safeParseCartItems(window.localStorage.getItem(storageKey)));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (product: ProductRecord) => {
      setItems((current) => {
        const exists = current.find((item) => item.id === product.id);
        if (exists) {
          return current.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }

        return [
          ...current,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            quantity: 1,
            imageText: product.imageText,
            subcategory: product.subcategory
          }
        ];
      });
    };

    const increaseItem = (id: string) => {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
      );
    };

    const decreaseItem = (id: string) => {
      setItems((current) =>
        current
          .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
          .filter((item) => item.quantity > 0)
      );
    };

    const removeItem = (id: string) => {
      setItems((current) => current.filter((item) => item.id !== id));
    };

    return {
      items,
      addItem,
      increaseItem,
      decreaseItem,
      removeItem,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: items.reduce((sum, item) => sum + item.quantity * item.price, 0)
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
