import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { myMiniFactoryAPI } from "@/services/myMiniFactoryAPI";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  rating: number;
  customizable: boolean;
  stock: number;
  review_count: number;
}

interface MyMiniFactoryProduct {
  id: string;
  name: string;
  description: string;
  image_url: string;
  download_count: number;
  like_count: number;
  category: string;
  price: number;
  is_free: boolean;
  creator: {
    name: string;
  };
}

const FeaturedProducts = () => {
  const [filter, setFilter] = useState("todos");
  const [products, setProducts] = useState<Product[]>([]);
  const [mmfProducts, setMmfProducts] = useState<MyMiniFactoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [mmfLoading, setMmfLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchMyMiniFactoryProducts();

    // Set up real-time subscription for products
    const subscription = supabase
      .channel('products-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'products' 
        }, 
        (payload) => {
          console.log('Produto atualizado em tempo real:', payload);
          // Refetch products when any change occurs
          fetchProducts();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(8)
        .order('rating', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyMiniFactoryProducts = async () => {
    try {
      const categoryMap: Record<string, 'pets' | 'home' | 'garden' | 'decorative'> = {
        'pets': 'pets',
        'casa': 'home',
        'jardim': 'garden',
        'todos': 'pets' // default to pets for "todos"
      };
      
      const mmfCategory = filter === 'todos' ? undefined : categoryMap[filter];
      const response = await myMiniFactoryAPI.getPopularProducts({
        category: mmfCategory,
        limit: 4
      });
      
      setMmfProducts(response.products);
    } catch (error) {
      console.error('Error fetching MyMiniFactory products:', error);
    } finally {
      setMmfLoading(false);
    }
  };

  // Refetch MyMiniFactory products when filter changes
  useEffect(() => {
    setMmfLoading(true);
    fetchMyMiniFactoryProducts();
  }, [filter]);

  // Transform MyMiniFactory products to match ProductCard props
  const transformedMmfProducts = mmfProducts.map(product => ({
    id: `mmf-${product.id}`,
    name: product.name,
    price: product.is_free ? 0 : product.price,
    image: product.image_url,
    rating: Math.min(5, (product.like_count / Math.max(product.download_count, 1)) * 5), // Convert likes to rating
    reviewCount: product.download_count,
    isCustomizable: true, // MMF products are typically customizable
    inStock: true, // Digital products are always in stock
    category: product.category,
    originalPrice: product.is_free ? undefined : product.price + 5, // Show discount
  }));

  // Transform products to match ProductCard props
  const transformedProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image_url,
    rating: product.rating,
    reviewCount: product.review_count,
    isCustomizable: product.customizable,
    inStock: product.stock > 0,
    category: product.category,
  }));
  const filteredProducts = filter === "todos" 
    ? transformedProducts 
    : transformedProducts.filter(product => product.category === filter);

  const handleAddToCart = (id: string) => {
    console.log("Added to cart:", id);
    // In a real app, this would dispatch to a cart store
  };

  const handleToggleWishlist = (id: string) => {
    console.log("Toggle wishlist:", id);
    // In a real app, this would dispatch to a wishlist store
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Produtos em Destaque
            </h2>
            <p className="text-muted-foreground">
              Descubra nossos produtos mais populares e da comunidade global
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os produtos</SelectItem>
                <SelectItem value="pets">🐕 Pets</SelectItem>
                <SelectItem value="casa">🏠 Casa</SelectItem>
                <SelectItem value="jardim">🌿 Jardim</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Tabs */}
        <Tabs defaultValue="loja" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="loja" className="flex items-center gap-2">
              <span>🏪</span> Nossa Loja
            </TabsTrigger>
            <TabsTrigger value="comunidade" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Comunidade MyMiniFactory
            </TabsTrigger>
          </TabsList>

          {/* Our Store Products */}
          <TabsContent value="loja" className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                // Skeleton loading
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                ))
              ) : (
                filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    {...product}
                    onAddToCart={() => handleAddToCart(product.id)}
                    onToggleWishlist={() => handleToggleWishlist(product.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* Community Products */}
          <TabsContent value="comunidade" className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold">Produtos Populares da Comunidade</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Descubra designs incríveis criados pela comunidade global de makers. 
                Estes produtos são populares e podem ser personalizados para suas necessidades.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mmfLoading ? (
                // Skeleton loading
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                ))
              ) : (
                transformedMmfProducts.map((product) => (
                  <div key={product.id} className="relative">
                    <ProductCard
                      {...product}
                      onAddToCart={() => handleAddToCart(product.id)}
                      onToggleWishlist={() => handleToggleWishlist(product.id)}
                    />
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      Comunidade
                    </Badge>
                  </div>
                ))
              )}
            </div>

            {!mmfLoading && transformedMmfProducts.length === 0 && (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-sm text-muted-foreground">
                  Não encontramos produtos da comunidade para esta categoria.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Show more button */}
        <div className="text-center mt-12">
          <Link to="/produtos">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Ver Todos os Produtos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 p-6 bg-muted/30 rounded-2xl">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-1">500+</div>
            <div className="text-sm text-muted-foreground">Produtos únicos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-1">2.000+</div>
            <div className="text-sm text-muted-foreground">Clientes felizes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-1">4.9★</div>
            <div className="text-sm text-muted-foreground">Avaliação média</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-1">48h</div>
            <div className="text-sm text-muted-foreground">Produção 3D</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;