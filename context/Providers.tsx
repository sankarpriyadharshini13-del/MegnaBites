"use client";

import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";
import { ProductsProvider } from "./ProductsContext";
import { UIProvider } from "./UIContext";
import type { Product } from "@/types";


export default function Providers({ children, initialProducts }: { children: React.ReactNode; initialProducts: Product[] }) {
  return (
    <UIProvider>
      <AuthProvider>
        <ProductsProvider initial={initialProducts}>
          <CartProvider>{children}</CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </UIProvider>
  );
}
