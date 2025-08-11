import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import LazyImage from "@/components/ui/LazyImage";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  isCustomizable?: boolean;
  isNew?: boolean;
  inStock: boolean;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  isInWishlist?: boolean;
}

const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  image,
  rating,
  reviewCount,
  isCustomizable = false,
  isNew = false,
  inStock = true,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
}: ProductCardProps) => {
  const { addItem } = useCart();
  const { trackAddToCart, trackViewItem } = useAnalytics();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inStock) {
      addItem({
        id,
        name,
        price,
        image
      });
      
      // Track add to cart event
      trackAddToCart({
        currency: 'BRL',
        value: price,
        items: [{
          item_id: id,
          item_name: name,
          quantity: 1,
          price: price,
        }],
      });
      
      onAddToCart?.();
    }
  };

  const handleProductClick = () => {
    // Track product view
    trackViewItem({
      currency: 'BRL',
      value: price,
      items: [{
        item_id: id,
        item_name: name,
        quantity: 1,
        price: price,
      }],
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWishlist?.();
  };

  return (
    <Link to={`/produto/${id}`} className="block" onClick={handleProductClick}>
      <Card className="group relative overflow-hidden border-border hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] shadow-card">
        <div className="relative">
          {/* Product Image */}
          <div className="aspect-square overflow-hidden bg-muted/30">
            <LazyImage
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isNew && (
              <Badge className="bg-secondary text-secondary-foreground">
                Novo
              </Badge>
            )}
            {isCustomizable && (
              <Badge className="bg-gradient-primary text-primary-foreground shadow-glow animate-bounce-subtle">
                ✨ Personalizável
              </Badge>
            )}
            {!inStock && (
              <Badge variant="destructive">
                Esgotado
              </Badge>
            )}
          </div>

          {/* Wishlist button */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${
              isInWishlist ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
            }`}
            onClick={handleToggleWishlist}
          >
            <Heart 
              className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} 
            />
          </Button>

          {/* Quick add to cart - appears on hover */}
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {inStock ? 'Adicionar' : 'Indisponível'}
            </Button>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Product name */}
          <h3 className="font-medium text-foreground line-clamp-2 leading-tight">
            {name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({reviewCount})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              R$ {price.toFixed(2).replace('.', ',')}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-muted-foreground line-through">
                R$ {originalPrice.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          {/* Discount percentage */}
          {originalPrice && originalPrice > price && (
            <Badge variant="destructive" className="text-xs">
              -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;