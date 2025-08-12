import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useRecommendations } from '@/hooks/useRecommendations';
import productionLogger from '@/utils/productionLogger';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  weight?: number; // Product weight in grams
  customization?: {
    text?: string;
    color?: string;
    material?: string;
    dimensions?: {
      width: number;
      height: number;
      depth: number;
    };
    logoUrl?: string;
    stlPath?: string;
    priceEstimate?: number;
  };
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { trackInteraction } = useRecommendations();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.id === newItem.id && 
        JSON.stringify(item.customization) === JSON.stringify(newItem.customization)
      );

      if (existingItem) {
        toast({
          title: "Item atualizado",
          description: `${newItem.name} quantidade atualizada no carrinho`
        });
        
        // Track add to cart interaction
        trackInteraction({
          product_id: newItem.id,
          interaction_type: 'add_to_cart',
          interaction_data: {
            product_name: newItem.name,
            price: newItem.price,
            quantity: existingItem.quantity + 1,
            customization: newItem.customization,
            action: 'quantity_update'
          }
        });
        
        return prevItems.map(item =>
          item === existingItem
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        toast({
          title: "Item adicionado",
          description: `${newItem.name} foi adicionado ao carrinho`
        });
        
        // Track add to cart interaction
        trackInteraction({
          product_id: newItem.id,
          interaction_type: 'add_to_cart',
          interaction_data: {
            product_name: newItem.name,
            price: newItem.price,
            quantity: 1,
            customization: newItem.customization,
            action: 'new_item'
          }
        });
        
        return [...prevItems, { ...newItem, quantity: 1 }];
      }
    });
  };

  const removeItem = (id: string) => {
    setItems(prevItems => {
      console.log('🗑️ TENTANDO REMOVER ITEM:', { 
        requestedId: id, 
        availableIds: prevItems.map(item => ({ 
          id: item.id, 
          fullId: `${item.id}-${JSON.stringify(item.customization)}`,
          name: item.name 
        })) 
      });
      
      // Buscar por ID completo (incluindo customização)
      const itemIndex = prevItems.findIndex(item => 
        `${item.id}-${JSON.stringify(item.customization)}` === id
      );
      
      if (itemIndex === -1) {
        console.error('❌ ERRO: Item não encontrado para remoção!', {
          requestedId: id,
          availableItems: prevItems.map(item => `${item.id}-${JSON.stringify(item.customization)}`)
        });
        
        // 🚨 LOG PARA PRODUÇÃO - FUNCIONALIDADE FALHOU
        productionLogger.logFunctionFail('removeItem', new Error('Item não encontrado'), {
          requestedId: id,
          availableItems: prevItems.length,
          cartState: prevItems.map(item => ({
            id: item.id,
            name: item.name,
            hasCustomization: !!item.customization
          }))
        });
        
        toast({
          title: "Erro ao remover item",
          description: "Item não encontrado no carrinho",
          variant: "destructive"
        });
        return prevItems;
      }
      
      const item = prevItems[itemIndex];
      console.log('✅ REMOVENDO ITEM:', { id, name: item.name });
      
      toast({
        title: "Item removido",
        description: `${item.name} foi removido do carrinho`
      });
      
      return prevItems.filter((_, index) => index !== itemIndex);
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems(prevItems => {
      console.log('🔄 ATUALIZANDO QUANTIDADE:', { 
        requestedId: id, 
        newQuantity: quantity,
        availableIds: prevItems.map(item => `${item.id}-${JSON.stringify(item.customization)}`)
      });
      
      return prevItems.map(item => {
        const itemFullId = `${item.id}-${JSON.stringify(item.customization)}`;
        if (itemFullId === id) {
          console.log('✅ QUANTIDADE ATUALIZADA:', { itemName: item.name, oldQty: item.quantity, newQty: quantity });
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setItems([]);
    toast({
      title: "Carrinho limpo",
      description: "Todos os items foram removidos do carrinho"
    });
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};