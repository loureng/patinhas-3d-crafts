// MyMiniFactory API Service
// Note: This is a simulation service since MyMiniFactory API documentation wasn't found
// In production, replace with actual MyMiniFactory API endpoints

interface MyMiniFactoryProduct {
  id: string;
  name: string;
  description: string;
  image_url: string;
  thumbnail_url: string;
  download_count: number;
  like_count: number;
  view_count: number;
  category: string;
  tags: string[];
  creator: {
    name: string;
    avatar_url: string;
  };
  price: number;
  currency: string;
  is_free: boolean;
  created_at: string;
  updated_at: string;
}

interface PopularProductsResponse {
  products: MyMiniFactoryProduct[];
  total: number;
  page: number;
  limit: number;
}

class MyMiniFactoryAPI {
  private baseURL = 'https://api.myminifactory.com/v1'; // Simulated endpoint
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || 'demo_api_key';
  }

  // Get popular/trending products
  async getPopularProducts(options: {
    category?: 'pets' | 'home' | 'garden' | 'decorative';
    limit?: number;
    page?: number;
  } = {}): Promise<PopularProductsResponse> {
    const { category, limit = 12, page = 1 } = options;

    // Simulate API call with mock data for demonstration
    // In production, replace with actual API call:
    // const response = await fetch(`${this.baseURL}/products/popular?category=${category}&limit=${limit}&page=${page}`, {
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    // });

    // Mock data for demonstration
    const mockProducts: MyMiniFactoryProduct[] = [
      {
        id: 'mmf-001',
        name: 'Porta Ração Personalizado para Cães',
        description: 'Porta ração 3D personalizado com nome do seu pet',
        image_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop',
        thumbnail_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200&h=200&fit=crop',
        download_count: 2847,
        like_count: 356,
        view_count: 12450,
        category: 'pets',
        tags: ['cão', 'pets', 'ração', 'personalizado'],
        creator: {
          name: 'Pet3D Creator',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        },
        price: 0,
        currency: 'BRL',
        is_free: true,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-20T14:22:00Z',
      },
      {
        id: 'mmf-002',
        name: 'Casa de Passarinho Decorativa',
        description: 'Linda casa decorativa para jardim com design moderno',
        image_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop',
        thumbnail_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop',
        download_count: 1892,
        like_count: 278,
        view_count: 8965,
        category: 'garden',
        tags: ['jardim', 'decoração', 'passarinho', 'casa'],
        creator: {
          name: 'Garden Designer',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b6d72a65?w=100&h=100&fit=crop',
        },
        price: 15.99,
        currency: 'BRL',
        is_free: false,
        created_at: '2024-01-10T08:15:00Z',
        updated_at: '2024-01-18T16:45:00Z',
      },
      {
        id: 'mmf-003',
        name: 'Vaso Moderno para Plantas',
        description: 'Vaso geométrico moderno perfeito para plantas pequenas',
        image_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop',
        thumbnail_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=200&h=200&fit=crop',
        download_count: 3521,
        like_count: 412,
        view_count: 15789,
        category: 'home',
        tags: ['vaso', 'plantas', 'decoração', 'moderno'],
        creator: {
          name: 'Modern Home 3D',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        },
        price: 0,
        currency: 'BRL',
        is_free: true,
        created_at: '2024-01-05T12:00:00Z',
        updated_at: '2024-01-22T09:30:00Z',
      },
      {
        id: 'mmf-004',
        name: 'Brinquedo Interativo para Gatos',
        description: 'Brinquedo 3D que estimula a inteligência felina',
        image_url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop',
        thumbnail_url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop',
        download_count: 1654,
        like_count: 198,
        view_count: 7234,
        category: 'pets',
        tags: ['gato', 'brinquedo', 'interativo', 'pets'],
        creator: {
          name: 'Cat Toys Studio',
          avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
        },
        price: 12.50,
        currency: 'BRL',
        is_free: false,
        created_at: '2024-01-12T15:45:00Z',
        updated_at: '2024-01-19T11:20:00Z',
      },
    ];

    // Filter by category if specified
    const filteredProducts = category 
      ? mockProducts.filter(product => product.category === category)
      : mockProducts;

    // Simulate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return {
      products: paginatedProducts,
      total: filteredProducts.length,
      page,
      limit,
    };
  }

  // Get product details by ID
  async getProductById(id: string): Promise<MyMiniFactoryProduct | null> {
    // Simulate API call
    const popularProducts = await this.getPopularProducts();
    return popularProducts.products.find(p => p.id === id) || null;
  }

  // Search products
  async searchProducts(query: string, options: {
    category?: string;
    limit?: number;
    page?: number;
  } = {}): Promise<PopularProductsResponse> {
    const { limit = 12, page = 1 } = options;
    
    // Get all products and filter by search query
    const allProducts = await this.getPopularProducts({ limit: 100 });
    const filteredProducts = allProducts.products.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );

    // Simulate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return {
      products: paginatedProducts,
      total: filteredProducts.length,
      page,
      limit,
    };
  }
}

// Export singleton instance
export const myMiniFactoryAPI = new MyMiniFactoryAPI();
export default MyMiniFactoryAPI;