import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Suspense, lazy } from "react";

// Lazy load components
const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Account = lazy(() => import("./pages/Account"));
const AreaCliente = lazy(() => import("./pages/AreaCliente"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLayout = lazy(() => import("./pages/admin/Layout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons"));
const AdminInventory = lazy(() => import("./pages/admin/Inventory"));

const AdminProductionQueue = lazy(() => import("./pages/admin/ProductionQueue"));

const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminDemo = lazy(() => import("./pages/AdminDemo"));

const TrackingPedidosDemo = lazy(() => import("./components/cliente/TrackingPedidosDemo"));


const ShippingDemo = lazy(() => import("./pages/ShippingDemo"));


const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

const NotificationDemo = lazy(() => import("./pages/NotificationDemo"));



const BlogList = lazy(() => import("./pages/blog/BlogList"));
const BlogPost = lazy(() => import("./pages/blog/BlogPost"));

// Eagerly import components that should be immediately available
import ProtectedRoute from "./components/ProtectedRoute";
import WhatsAppSupport from "./components/blog/WhatsAppSupport";

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/produtos" element={<Products />} />
                <Route path="/produto/:id" element={<ProductDetail />} />
                <Route path="/carrinho" element={<Cart />} />
                <Route path="/cart" element={<Cart />} />
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
                {/* Blog Routes */}
                <Route path="/blog" element={<BlogList />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />

                  <Route path="production-queue" element={<AdminProductionQueue />} />

                  <Route path="reports" element={<AdminReports />} />

                  <Route path="products" element={<AdminProducts />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="/admin-demo" element={<AdminDemo />} />

                <Route path="/area-cliente-demo" element={<TrackingPedidosDemo />} />


                <Route path="/shipping-demo" element={<ShippingDemo />} />

                <Route path="/notification-demo" element={<NotificationDemo />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          
          {/* Global WhatsApp Support */}
          <WhatsAppSupport 
            phoneNumber="5511999999999" 
            businessName="Jardim das Patinhas"
          />
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
