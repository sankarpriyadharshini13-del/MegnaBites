import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import SearchDialog from "@/components/search/SearchDialog";
import AuthDialog from "@/components/auth/AuthDialog";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">{children}</main>
      <Footer />
      <CartDrawer />
      <SearchDialog />
      <AuthDialog />
    </>
  );
}
