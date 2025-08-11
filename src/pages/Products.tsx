import { useState, useEffect, useCallback } from "react";
import { Filter, Grid, List, ChevronDown, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import RecommendationSection from "@/components/RecommendationSection";
import { useAuth } from "@/contexts/AuthContext";

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
  created_at?: string;
  sale_price?: number; // opcional: se existir, usar como preço efetivo
}

const Products = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [onlyCustomizable, setOnlyCustomizable] = useState(false);
  const [onlyNew, setOnlyNew] = useState(false);
  const [onlyOnSale, setOnlyOnSale] = useState(false);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    fetchProducts();
  }, []);

  const filterAndSortProducts = useCallback(() => {
    let filtered = [...products];
    // Preço efetivo (considera sale_price quando disponível)
    const getEffectivePrice = (p: Product) => (typeof p.sale_price === 'number' ? p.sale_price : p.price);

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price range filter
    filtered = filtered.filter(product => {
      const price = getEffectivePrice(product);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => 
        selectedCategories.includes(product.category)
      );
    }

    // Materials filter (fallback por texto: name/description inclui material)
    if (selectedMaterials.length > 0) {
      filtered = filtered.filter((product) => {
        const anyProduct = product as unknown as { name?: string; description?: string };
        const hay = `${anyProduct.name || ''} ${(anyProduct.description || '')}`.toLowerCase();
        return selectedMaterials.some(m => hay.includes(m.toLowerCase()));
      });
    }

    // Customizable filter
    if (onlyCustomizable) {
      filtered = filtered.filter(product => product.customizable);
    }

    // New (últimos 30 dias)
    if (onlyNew) {
      const now = Date.now();
      const THIRTY_D = 30 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(p => {
        const created = p.created_at ? new Date(p.created_at).getTime() : 0;
        return created && now - created <= THIRTY_D;
      });
    }

    // On Sale (tem sale_price < price)
    if (onlyOnSale) {
      filtered = filtered.filter(p => typeof p.sale_price === 'number' && p.sale_price < p.price);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': {
          return getEffectivePrice(a) - getEffectivePrice(b);
        }
        case 'price-high': {
          return getEffectivePrice(b) - getEffectivePrice(a);
        }
        case 'rating': {
          return b.rating - a.rating;
        }
        case 'newest': {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
        default: {
          // relevância: melhor avaliados mais recentes primeiro
          const byRating = b.rating - a.rating;
          if (byRating !== 0) return byRating;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchQuery, priceRange, selectedCategories, selectedMaterials, onlyCustomizable, onlyNew, onlyOnSale, sortBy]);

  useEffect(() => {
    filterAndSortProducts();
  }, [filterAndSortProducts]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialChange = (material: string, checked: boolean) => {
    if (checked) {
      setSelectedMaterials([...selectedMaterials, material]);
    } else {
      setSelectedMaterials(selectedMaterials.filter(m => m !== material));
    }
  };

  // max do slider baseado nos produtos
  const effectivePrices = products.map(p => (typeof p.sale_price === 'number' ? p.sale_price : p.price));
  const dynamicMax = Math.max(200, Math.ceil((Math.max(0, ...effectivePrices) || 200) / 50) * 50);

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    }
  };

  const categories = [
    { name: "Pets", count: 150 },
    { name: "Casa", count: 200 },
    { name: "Jardim", count: 100 },
    { name: "Personalização 3D", count: 50 },
  ];

  const materials = [
    { name: "PLA", count: 120 },
    { name: "PETG", count: 80 },
    { name: "ABS", count: 60 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <a href="/" className="hover:text-primary">Home</a>
          <span className="mx-2">/</span>
          <span>Produtos</span>
        </nav>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Todos os Produtos'}
          </h1>
          <p className="text-muted-foreground">
            {searchQuery 
              ? `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`
              : 'Descubra nossa coleção completa de produtos personalizados'
            }
          </p>
        </div>

        {/* Personalized Recommendations Section */}
        <RecommendationSection
          title="Recomendado para Você"
          type="personalized"
          limit={6}
          className="mb-8"
        />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64">
            <div className="sticky top-24">
              {/* Mobile filter toggle */}
              <div className="lg:hidden mb-4">
                <Button
                  variant="outline"
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </div>

              <div className={`space-y-6 ${isFiltersOpen ? 'block' : 'hidden lg:block'}`}>
                {/* Price Range */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Preço</h3>
                  <div className="space-y-4">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={dynamicMax}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex items-center space-x-2 text-sm">
                      <Input
                        type="number"
                        value={priceRange[0]}
                        className="w-20 h-8"
                        readOnly
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        value={priceRange[1]}
                        className="w-20 h-8"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full font-semibold text-foreground">
                    Categorias
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-3">
                    {categories.map((category) => (
                      <div key={category.name} className="flex items-center space-x-2">
                        <Checkbox 
                          id={category.name}
                          checked={selectedCategories.includes(category.name)}
                          onCheckedChange={(checked) => handleCategoryChange(category.name, checked as boolean)}
                        />
                        <Label htmlFor={category.name} className="flex-1 text-sm">
                          {category.name}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          ({products.filter(p => p.category === category.name).length})
                        </span>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                {/* Materials */}
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full font-semibold text-foreground">
                    Material
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-3">
                    {materials.map((material) => (
                      <div key={material.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={material.name}
                          checked={selectedMaterials.includes(material.name)}
                          onCheckedChange={(checked) => handleMaterialChange(material.name, checked as boolean)}
                        />
                        <Label htmlFor={material.name} className="flex-1 text-sm">
                          {material.name}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          ({material.count})
                        </span>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                {/* Features */}
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full font-semibold text-foreground">
                    Características
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="customizable"
                        checked={onlyCustomizable}
                        onCheckedChange={(checked) => setOnlyCustomizable(checked as boolean)}
                      />
                      <Label htmlFor="customizable" className="text-sm">
                        Personalizável
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="new"
                        checked={onlyNew}
                        onCheckedChange={(checked) => setOnlyNew(checked as boolean)}
                      />
                      <Label htmlFor="new" className="text-sm">
                        Novidades
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="sale"
                        checked={onlyOnSale}
                        onCheckedChange={(checked) => setOnlyOnSale(checked as boolean)}
                      />
                      <Label htmlFor="sale" className="text-sm">
                        Em promoção
                      </Label>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0">
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''}
                {searchQuery && ` para "${searchQuery}"`}
              </div>

              <div className="flex items-center space-x-4">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevância</SelectItem>
                    <SelectItem value="price-low">Menor preço</SelectItem>
                    <SelectItem value="price-high">Maior preço</SelectItem>
                    <SelectItem value="newest">Mais recentes</SelectItem>
                    <SelectItem value="rating">Melhor avaliados</SelectItem>
                  </SelectContent>
                </Select>

                {/* View toggle */}
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "grid-cols-1"
              }`}>
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <Search className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum produto encontrado
                    </h3>
                    <p className="text-muted-foreground">
                      Tente ajustar os filtros ou usar outros termos de busca
                    </p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image_url}
                    rating={product.rating}
                    reviewCount={product.review_count}
                    isCustomizable={product.customizable}
                    inStock={product.stock > 0}
                    onAddToCart={() => {}}
                    onToggleWishlist={() => {}}
                  />
                  ))
                )}
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center mt-12">
              <div className="flex space-x-2">
                <Button variant="outline" disabled>
                  Anterior
                </Button>
                <Button variant="default">1</Button>
                <Button variant="outline">2</Button>
                <Button variant="outline">3</Button>
                <Button variant="outline">...</Button>
                <Button variant="outline">21</Button>
                <Button variant="outline">
                  Próximo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;