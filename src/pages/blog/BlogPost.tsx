import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, User, Tag, ArrowLeft, Share2, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOMetaTags from "@/components/seo/SEOMetaTags";
import StructuredDataHelper, { generateBlogPostSchema, generateBreadcrumbSchema } from "@/components/seo/StructuredDataHelper";
import NewsletterSubscription from "@/components/blog/NewsletterSubscription";

// Mock data - will be replaced with Supabase data
const mockPost = {
  id: "1",
  title: "Como Criar um Jardim Pet-Friendly: Dicas Essenciais",
  excerpt: "Descubra como transformar seu jardim em um espaço seguro e divertido para seus pets com plantas adequadas e elementos decorativos especiais.",
  content: `
    <h2>Introdução</h2>
    <p>Criar um jardim que seja seguro e divertido para nossos pets é uma das melhores formas de proporcionar qualidade de vida aos nossos companheiros de quatro patas. Com algumas dicas simples e cuidados específicos, você pode transformar seu espaço externo em um verdadeiro paraíso pet-friendly.</p>
    
    <h2>Plantas Seguras para Pets</h2>
    <p>A primeira preocupação ao criar um jardim pet-friendly é escolher plantas que não sejam tóxicas para cães e gatos. Algumas opções seguras incluem:</p>
    <ul>
      <li><strong>Girassóis:</strong> Coloridos e não tóxicos</li>
      <li><strong>Hortelã:</strong> Refrescante e pode até ajudar na digestão</li>
      <li><strong>Capim-santo:</strong> Aromático e relaxante</li>
      <li><strong>Petúnias:</strong> Flores coloridas e seguras</li>
    </ul>
    
    <h2>Elementos Decorativos 3D Personalizados</h2>
    <p>Nossa especialidade é criar elementos únicos para o jardim do seu pet através da impressão 3D. Você pode personalizar:</p>
    <ul>
      <li>Comedouros e bebedouros únicos</li>
      <li>Placas identificadoras personalizadas</li>
      <li>Brinquedos resistentes para área externa</li>
      <li>Elementos decorativos temáticos</li>
    </ul>
    
    <h2>Áreas de Sombra e Conforto</h2>
    <p>Todo jardim pet-friendly precisa de áreas onde os animais possam descansar e se refrescar. Considere criar:</p>
    <ul>
      <li>Pergolados com plantas trepadeiras</li>
      <li>Casinhas personalizadas em 3D</li>
      <li>Áreas com piso antiderrapante</li>
      <li>Fontes de água fresca</li>
    </ul>
    
    <h2>Segurança em Primeiro Lugar</h2>
    <p>Algumas dicas importantes para manter seu jardim seguro:</p>
    <ul>
      <li>Evite plantas tóxicas como azaleia, comigo-ninguém-pode e espirradeira</li>
      <li>Certifique-se de que cercas estão bem fixadas</li>
      <li>Mantenha produtos químicos fora do alcance</li>
      <li>Crie caminhos definidos para evitar pisoteamento</li>
    </ul>
    
    <h2>Conclusão</h2>
    <p>Com planejamento e cuidado, é possível criar um jardim que seja belo, funcional e seguro para toda a família, incluindo nossos pets. Na Jardim das Patinhas, estamos sempre prontos para ajudar com elementos personalizados que tornarão seu espaço ainda mais especial.</p>
  `,
  author: "Jardim das Patinhas",
  category: "jardim", 
  tags: ["pets", "jardim", "segurança", "plantas"],
  featured_image: "/lovable-uploads/6e03e475-6083-4d29-be79-60c3f1ffef52.png",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  published: true,
  slug: "jardim-pet-friendly-dicas-essenciais"
};

const relatedPosts = [
  {
    id: "2",
    title: "Decoração 3D: Personalize a Casa do Seu Pet", 
    excerpt: "Explore as infinitas possibilidades da impressão 3D para criar elementos únicos.",
    featured_image: "/lovable-uploads/6e03e475-6083-4d29-be79-60c3f1ffef52.png",
    slug: "decoracao-3d-personalize-casa-pet"
  }
];

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState(mockPost);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // Here you would fetch the post by slug from Supabase
    // For now using mock data
    if (slug !== post.slug) {
      // Post not found - could redirect or show 404
      console.log("Post not found for slug:", slug);
    }
  }, [slug, post.slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Post não encontrado</h1>
            <Button onClick={() => navigate('/blog')}>
              Voltar ao Blog
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOMetaTags
        title={post.title}
        description={post.excerpt}
        keywords={post.tags}
        canonical_url={`https://jardimdas patinhas.com/blog/${post.slug}`}
        og_title={post.title}
        og_description={post.excerpt}
        og_image={post.featured_image}
        og_type="article"
      />
      
      <StructuredDataHelper 
        data={[
          generateBlogPostSchema(
            post.title,
            post.excerpt,
            post.author,
            post.created_at,
            post.updated_at,
            `https://jardimdas patinhas.com/blog/${post.slug}`,
            post.featured_image,
            "Jardim das Patinhas",
            "https://jardimdas patinhas.com"
          ),
          generateBreadcrumbSchema([
            { name: "Início", url: "https://jardimdas patinhas.com/" },
            { name: "Blog", url: "https://jardimdas patinhas.com/blog" },
            { name: post.title, url: `https://jardimdas patinhas.com/blog/${post.slug}` }
          ])
        ]}
      />
      
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/blog')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Blog
          </Button>
        </div>

        {/* Article */}
        <article className="max-w-4xl mx-auto">
          {/* Featured Image */}
          <div className="relative mb-8 rounded-lg overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover"
            />
            <div className="absolute top-4 left-4">
              <Badge className="bg-primary/90 text-primary-foreground">
                {post.category}
              </Badge>
            </div>
          </div>

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              {post.title}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-6">
              {post.excerpt}
            </p>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(post.created_at)}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {post.author}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setIsLiked(!isLiked)}
                className={isLiked ? "text-red-500 border-red-500" : ""}
              >
                <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-red-500" : ""}`} />
                {isLiked ? "Curtido" : "Curtir"}
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </header>

          <Separator className="mb-8" />

          {/* Content */}
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <Separator className="my-12" />

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Posts Relacionados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Card key={relatedPost.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <img
                        src={relatedPost.featured_image}
                        alt={relatedPost.title}
                        className="w-full h-32 object-cover rounded mb-4"
                      />
                      <h3 className="font-semibold mb-2">
                        <Link 
                          to={`/blog/${relatedPost.slug}`}
                          className="hover:text-primary transition-colors"
                        >
                          {relatedPost.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {relatedPost.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Newsletter Subscription */}
          <div className="mt-12">
            <NewsletterSubscription variant="sidebar" />
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;