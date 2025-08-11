import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecommendations, RecommendedProduct } from '@/hooks/useRecommendations';
import { ArrowRight, Star, TrendingUp, Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecommendationSectionProps {
  title: string;
  type: 'content' | 'collaborative' | 'popular' | 'personalized';
  productId?: string;
  category?: string;
  limit?: number;
  className?: string;
  showScore?: boolean;
}

const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  title,
  type,
  productId,
  category,
  limit = 4,
  className = '',
  showScore = false
}) => {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const {
    loading,
    error,
    getCachedRecommendations,
    getPersonalizedRecommendations,
    getPopularRecommendations
  } = useRecommendations();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        let results: RecommendedProduct[] = [];

        switch (type) {
          case 'content':
            if (productId) {
              results = await getCachedRecommendations(productId, 'content', limit);
            }
            break;
          case 'collaborative':
            if (productId) {
              results = await getCachedRecommendations(productId, 'collaborative', limit);
            }
            break;
          case 'popular':
            results = await getPopularRecommendations(category, limit);
            break;
          case 'personalized':
            results = await getPersonalizedRecommendations(limit);
            break;
        }

        setRecommendations(results);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setRecommendations([]);
      }
    };

    fetchRecommendations();
  }, [type, productId, category, limit, getCachedRecommendations, getPersonalizedRecommendations, getPopularRecommendations]);

  const getIcon = () => {
    switch (type) {
      case 'content':
        return <Sparkles className="h-4 w-4" />;
      case 'collaborative':
        return <Users className="h-4 w-4" />;
      case 'popular':
        return <TrendingUp className="h-4 w-4" />;
      case 'personalized':
        return <Star className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        {recommendations.length > limit && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/products">
              Ver mais
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.slice(0, limit).map((product) => (
          <Card 
            key={product.product_id} 
            className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
          >
            <Link to={`/product/${product.product_id}`} className="block">
              <div className="relative overflow-hidden">
                <img
                  src={product.image_url || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                  }}
                />
                {showScore && product.score > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2 bg-white/90"
                  >
                    {Math.round(product.score * 100)}%
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className="absolute top-2 left-2 bg-white/90"
                >
                  {product.category}
                </Badge>
              </div>
              
              <CardContent className="p-4 space-y-2">
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-current" />
                    <span>4.5</span>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecommendationSection;