import { useState } from "react";
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

const FeaturedProducts = () => {
  const [filter, setFilter] = useState("todos");

  // Mock data - in a real app, this would come from an API
  const products = [
    {
      id: "1",
      name: "Comedouro Personalizado para Cães",
      price: 45.90,
      originalPrice: 59.90,
      image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop",
      rating: 4.8,
      reviewCount: 124,
      isCustomizable: true,
      isNew: true,
      inStock: true,
      category: "pets",
    },
    {
      id: "2",
      name: "Vaso Suspenso para Suculentas",
      price: 32.50,
      image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop",
      rating: 4.6,
      reviewCount: 89,
      isCustomizable: false,
      inStock: true,
      category: "jardim",
    },
    {
      id: "3",
      name: "Porta-chaves Personalizado - Casa",
      price: 28.90,
      originalPrice: 35.90,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
      rating: 4.9,
      reviewCount: 156,
      isCustomizable: true,
      inStock: true,
      category: "casa",
    },
    {
      id: "4",
      name: "Brinquedo Interativo para Gatos",
      price: 52.90,
      image: "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=400&fit=crop",
      rating: 4.7,
      reviewCount: 67,
      isCustomizable: true,
      isNew: true,
      inStock: true,
      category: "pets",
    },
    {
      id: "5",
      name: "Luminária LED Personalizada",
      price: 89.90,
      originalPrice: 109.90,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      rating: 4.8,
      reviewCount: 203,
      isCustomizable: true,
      inStock: true,
      category: "casa",
    },
    {
      id: "6",
      name: "Regador Automático 3D",
      price: 76.50,
      image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop",
      rating: 4.5,
      reviewCount: 45,
      isCustomizable: false,
      inStock: true,
      category: "jardim",
    },
    {
      id: "7",
      name: "Coleira Personalizada com Nome",
      price: 39.90,
      image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop",
      rating: 4.9,
      reviewCount: 312,
      isCustomizable: true,
      inStock: true,
      category: "pets",
    },
    {
      id: "8",
      name: "Organizador de Mesa 3D",
      price: 42.90,
      originalPrice: 52.90,
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
      rating: 4.6,
      reviewCount: 91,
      isCustomizable: true,
      inStock: false,
      category: "casa",
    },
  ];

  const filteredProducts = filter === "todos" 
    ? products 
    : products.filter(product => product.category === filter);

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
          <Button 
            size="lg" 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Ver Todos os Produtos
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
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