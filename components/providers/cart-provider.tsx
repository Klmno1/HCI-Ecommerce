"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useExperiment } from "@/components/providers/experiment-provider";
import type { CartItem, ProductRecord } from "@/lib/types";

type CartActionSource = "product-card" | "product-detail" | "cart-drawer" | "unknown";

type CartContextValue = {
  items: CartItem[];
  addItem: (product: ProductRecord, source?: CartActionSource) => void;
  increaseItem: (id: string, source?: CartActionSource) => void;
  decreaseItem: (id: string, source?: CartActionSource) => void;
  removeItem: (id: string, source?: CartActionSource) => void;
  totalQuantity: number;
  totalAmount: number;
  canCheckout: boolean;
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
  const { logEvent } = useExperiment();

  useEffect(() => {
    setItems(safeParseCartItems(window.localStorage.getItem(storageKey)));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (product: ProductRecord, source: CartActionSource = "unknown") => {
      setItems((current) => {
        const exists = current.find((item) => item.id === product.id);
        const nextItems = exists
          ? current.map((item) => (item.id === product.id ? { ...item, quantity: 1 } : item))
          : [
              ...current,
              {
                id: product.id,
                name: product.shortName || product.name,
                price: product.price,
                originalPrice: product.originalPrice,
                quantity: 1,
                imageText: product.imageText,
                imageUrl: product.imageUrl,
                subcategory: product.subcategory
              }
            ];

        logEvent({
          action: "add_to_cart",
          target: source,
          label: product.shortName || product.name,
          value: {
            productId: product.id,
            quantity: 1,
            price: product.price
          }
        });

        return nextItems;
      });
    };

    const increaseItem = (id: string, source: CartActionSource = "unknown") => {
      setItems((current) => {
        const nextItem = current.find((item) => item.id === id);
        if (!nextItem || nextItem.quantity >= 1) {
          return current;
        }

        const nextItems = current.map((item) => (item.id === id ? { ...item, quantity: 1 } : item));
        logEvent({
          action: "cart_increase",
          target: source,
          label: nextItem.name,
          value: {
            productId: id,
            quantity: 1
          }
        });
        return nextItems;
      });
    };

    const decreaseItem = (id: string, source: CartActionSource = "unknown") => {
      setItems((current) => {
        const nextItems = current
          .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
          .filter((item) => item.quantity > 0);
        const nextItem = nextItems.find((item) => item.id === id);
        logEvent({
          action: "cart_decrease",
          target: source,
          label: nextItem?.name,
          value: {
            productId: id,
            quantity: nextItem?.quantity ?? 0
          }
        });
        return nextItems;
      });
    };

    const removeItem = (id: string, source: CartActionSource = "unknown") => {
      setItems((current) => {
        const removedItem = current.find((item) => item.id === id);
        const nextItems = current.filter((item) => item.id !== id);
        logEvent({
          action: "cart_remove",
          target: source,
          label: removedItem?.name,
          value: {
            productId: id
          }
        });
        return nextItems;
      });
    };

    return {
      items,
      addItem,
      increaseItem,
      decreaseItem,
      removeItem,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: items.reduce((sum, item) => sum + item.quantity * item.price, 0),
      canCheckout: items.length === 1 && items[0]?.quantity === 1
    };
  }, [items, logEvent]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
