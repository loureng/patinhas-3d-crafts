import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { 
  Heart,
  ShoppingCart,
  Trash2,
  Package,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ListaDesejos = () => {
  const { items, loading, error, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar lista de desejos: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const handleRemoveFromWishlist = async (productId: string, productName: string) => {
    try {
      await removeFromWishlist(productId);
      toast({
        title: "Removido da lista de desejos",
        description: `${productName} foi removido da sua lista de desejos.`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o item da lista de desejos.",
        variant: "destructive"
      });
    }
  };

  const handleMoveToCart = async (product: any) => {
    try {
      // Adicionar ao carrinho
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        quantity: 1
      });

      // Remover da wishlist
      await removeFromWishlist(product.id);

      toast({
        title: "Movido para o carrinho",
        description: `${product.name} foi adicionado ao seu carrinho.`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível mover o item para o carrinho.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center">
            <Heart className="mr-2 h-6 w-6 text-red-500" />
            Lista de Desejos
          </h2>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? 'item salvo' : 'itens salvos'}
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" asChild>
            <Link to="/produtos">
              Continuar Comprando
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sua lista de desejos está vazia</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Explore nossos produtos e adicione seus favoritos à lista de desejos 
              para acompanhá-los facilmente.
            </p>
            <Button asChild>
              <Link to="/produtos">
                Explorar Produtos
                <Package className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="group overflow-hidden">
              <div className="relative">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.product?.image_url || '/placeholder-product.jpg'}
                    alt={item.product?.name || 'Produto'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                  onClick={() => handleRemoveFromWishlist(item.product_id, item.product?.name || 'Produto')}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              
              <CardHeader className="pb-3">
                <CardTitle className="line-clamp-2 text-lg leading-tight">
                  {item.product?.name || 'Produto sem nome'}
                </CardTitle>
                {item.product?.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.product.description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      R$ {item.product?.price?.toFixed(2) || '0,00'}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Adicionado em {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => handleMoveToCart(item.product)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Mover para Carrinho
                  </Button>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/produto/${item.product_id}`}>
                      Ver Detalhes
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ações em Lote</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  items.forEach(item => {
                    if (item.product) {
                      handleMoveToCart(item.product);
                    }
                  });
                }}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Mover Todos para Carrinho
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  items.forEach(item => {
                    handleRemoveFromWishlist(item.product_id, item.product?.name || 'Produto');
                  });
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ListaDesejos;