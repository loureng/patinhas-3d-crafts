import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import AreaCliente from "./pages/AreaCliente";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./pages/admin/Layout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminCustomers from "./pages/admin/Customers";
import AdminCoupons from "./pages/admin/Coupons";
import AdminInventory from "./pages/admin/Inventory";
import AdminDemo from "./pages/AdminDemo";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/produto/:id" element={<ProductDetail />} />
              <Route path="/carrinho" element={<Cart />} />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/conta" element={
                <ProtectedRoute>
                  <AreaCliente />
                </ProtectedRoute>
              } />
              <Route path="/account" element={
                <ProtectedRoute>
                  <AreaCliente />
                </ProtectedRoute>
              } />
              <Route path="/account/orders" element={
                <ProtectedRoute>
                  <AreaCliente />
                </ProtectedRoute>
              } />
              <Route path="/account/wishlist" element={
                <ProtectedRoute>
                  <AreaCliente />
                </ProtectedRoute>
              } />
              <Route path="/account/addresses" element={
                <ProtectedRoute>
                  <AreaCliente />
                </ProtectedRoute>
              } />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pets" element={<Products />} />
              <Route path="/casa" element={<Products />} />
              <Route path="/jardim" element={<Products />} />
              <Route path="/personalizacao" element={<Products />} />
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="inventory" element={<AdminInventory />} />
              </Route>
              <Route path="/admin-demo" element={<AdminDemo />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
