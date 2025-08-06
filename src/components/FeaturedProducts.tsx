import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
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

const FeaturedProducts = () => {
  const [filter, setFilter] = useState("todos");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
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
              Descubra nossos produtos mais populares e personalizáveis
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

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
            />
          ))}
        </div>

        {/* Show more button */}
        <div className="text-center">
          <Link to="/products">
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