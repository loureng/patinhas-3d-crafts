import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, User, Tag } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOMetaTags from "@/components/seo/SEOMetaTags";
import StructuredDataHelper, { generateWebsiteSchema, generateBreadcrumbSchema } from "@/components/seo/StructuredDataHelper";
import NewsletterSubscription from "@/components/blog/NewsletterSubscription";

// Mock data for now - will be replaced with Supabase data
const mockPosts = [
  {
    id: "1",
    title: "Como Criar um Jardim Pet-Friendly: Dicas Essenciais",
    excerpt: "Descubra como transformar seu jardim em um espaço seguro e divertido para seus pets com plantas adequadas e elementos decorativos especiais.",
    content: "",
    author: "Jardim das Patinhas",
    category: "jardim",
    tags: ["pets", "jardim", "segurança"],
    featured_image: "/lovable-uploads/6e03e475-6083-4d29-be79-60c3f1ffef52.png",
    created_at: "2024-01-15T10:00:00Z",
    published: true,
    slug: "jardim-pet-friendly-dicas-essenciais"
  },
  {
    id: "2", 
    title: "Decoração 3D: Personalize a Casa do Seu Pet",
    excerpt: "Explore as infinitas possibilidades da impressão 3D para criar elementos únicos e personalizados para o espaço do seu animal de estimação.",
    content: "",
    author: "Jardim das Patinhas",
    category: "decoracao",
    tags: ["3d", "personalização", "pets", "casa"],
    featured_image: "/lovable-uploads/6e03e475-6083-4d29-be79-60c3f1ffef52.png", 
    created_at: "2024-01-10T14:30:00Z",
    published: true,
    slug: "decoracao-3d-personalize-casa-pet"
  }
];

const categories = [
  { name: "Todos", value: "", count: 2 },
  { name: "Jardim", value: "jardim", count: 1 },
  { name: "Decoração", value: "decoracao", count: 1 },
  { name: "Pets", value: "pets", count: 2 }
];

const BlogList = () => {
  const [posts, setPosts] = useState(mockPosts);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filteredPosts, setFilteredPosts] = useState(mockPosts);

  useEffect(() => {
    if (selectedCategory === "") {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter(post => post.category === selectedCategory));
    }
  }, [selectedCategory, posts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOMetaTags
        title="Blog - Jardim das Patinhas"
        description="Descubra dicas exclusivas sobre pets, jardim e decoração 3D personalizada. Inspirações e tendências para criar espaços únicos para seus animais de estimação."
        keywords={["blog", "pets", "jardim", "decoração 3D", "animais de estimação", "personalização", "dicas"]}
        canonical_url="https://jardimdas patinhas.com/blog"
        og_title="Blog Jardim das Patinhas - Dicas sobre Pets, Jardim e Decoração 3D"
        og_description="Explore nosso blog com dicas exclusivas sobre pets, jardim e decoração 3D personalizada."
        og_image="/lovable-uploads/6e03e475-6083-4d29-be79-60c3f1ffef52.png"
        og_type="website"
      />
      
      <StructuredDataHelper 
        data={[
          generateWebsiteSchema(
            "Jardim das Patinhas",
            "https://jardimdas patinhas.com",
            "Especialistas em produtos 3D personalizados para pets, casa e jardim"
          ),
          generateBreadcrumbSchema([
            { name: "Início", url: "https://jardimdas patinhas.com/" },
            { name: "Blog", url: "https://jardimdas patinhas.com/blog" }
          ])
        ]}
      />
      
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Blog Jardim das Patinhas
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubra dicas, tendências e inspirações sobre pets, jardim e decoração 3D personalizada
          </p>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.value)}
              className="flex items-center gap-2"
            >
              {category.name}
              <Badge variant="secondary" className="ml-1">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary/90 text-primary-foreground">
                      {categories.find(c => c.value === post.category)?.name || post.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 line-clamp-2">
                  <Link 
                    to={`/blog/${post.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {post.title}
                  </Link>
                </h3>
                
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {post.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Meta Information */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(post.created_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.author}
                  </div>
                </div>

                {/* Read More Button */}
                <div className="mt-4">
                  <Link to={`/blog/${post.slug}`}>
                    <Button variant="outline" className="w-full">
                      Ler mais
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Nenhum post encontrado para esta categoria.
            </p>
          </div>
        )}

        {/* Newsletter Subscription */}
        <div className="mt-16 max-w-2xl mx-auto">
          <NewsletterSubscription />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogList;