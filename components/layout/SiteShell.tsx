import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import AddedToCartToast from "@/components/cart/AddedToCartToast";
import SearchDialog from "@/components/search/SearchDialog";
import AuthDialog from "@/components/auth/AuthDialog";
import CheckoutDialog from "@/components/checkout/CheckoutDialog";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">{children}</main>
      <Footer />
      <CartDrawer />
      <AddedToCartToast />
      <SearchDialog />
      <CheckoutDialog />
      <AuthDialog />
    </>
  );
}
