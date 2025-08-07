import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingCart, User, Heart, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produtos?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const categories = [
    { name: "Pets", href: "/pets" },
    { name: "Casa", href: "/casa" },
    { name: "Jardim", href: "/jardim" },
    { name: "Personalização 3D", href: "/personalizacao" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      {/* Top bar with announcement */}
      <div className="bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-2 text-center text-sm">
          🎉 Frete grátis para compras acima de R$ 199 | Impressão 3D personalizada
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/6e03e475-6083-4d29-be79-60c3f1ffef52.png" 
              alt="Jardim das Patinhas" 
              className="h-10 w-10"
            />
            <span className="text-xl font-bold text-primary">
              Jardim das Patinhas
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.href}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile search */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
              <Badge className="absolute -top-2 -right-2 px-1 min-w-[18px] h-[18px] text-xs bg-secondary text-secondary-foreground">
                2
              </Badge>
            </Button>

            {/* Cart */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 px-1 min-w-[18px] h-[18px] text-xs">
                  {itemCount}
                </Badge>
              )}
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user ? (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/account')}>
                      Minha conta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/account')}>
                      Meus pedidos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/auth')}>
                      Entrar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/auth')}>
                      Criar conta
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 animate-slide-up">
            <div className="flex flex-col space-y-4">
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              {/* Mobile navigation */}
              <nav className="flex flex-col space-y-2">
                {categories.map((category) => (
                  <Link
                    key={category.name}
                    to={category.href}
                    className="px-4 py-2 text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; // Fixed export