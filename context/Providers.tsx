"use client";

import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";
import { UIProvider, useUI } from "./UIContext";

function CartWithUI({ children }: { children: React.ReactNode }) {
  const { open } = useUI();
  // Opening the drawer after add-to-cart gives instant, visible feedback.
  return <CartProvider onAdd={() => open("cart")}>{children}</CartProvider>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <AuthProvider>
        <CartWithUI>{children}</CartWithUI>
      </AuthProvider>
    </UIProvider>
  );
}
