"use client";

import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";
import { ProductsProvider } from "./ProductsContext";
import { UIProvider, useUI } from "./UIContext";
import type { Product } from "@/types";

function CartWithUI({ children }: { children: React.ReactNode }) {
  const { open } = useUI();
  // Opening the drawer after add-to-cart gives instant, visible feedback.
  return <CartProvider onAdd={() => open("cart")}>{children}</CartProvider>;
}

export default function Providers({ children, initialProducts }: { children: React.ReactNode; initialProducts: Product[] }) {
  return (
    <UIProvider>
      <AuthProvider>
        <ProductsProvider initial={initialProducts}>
          <CartWithUI>{children}</CartWithUI>
        </ProductsProvider>
      </AuthProvider>
    </UIProvider>
  );
}
