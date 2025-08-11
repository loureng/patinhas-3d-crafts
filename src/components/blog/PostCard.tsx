import { Link } from "react-router-dom";
import { Calendar, User, Tag } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  tags: string[];
  featured_image: string;
  created_at: string;
  slug: string;
}

interface PostCardProps {
  post: BlogPost;
  categoryLabel?: string;
}

const PostCard = ({ post, categoryLabel }: PostCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
      <CardHeader className="p-0 flex-shrink-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
          />
          {categoryLabel && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-primary/90 text-primary-foreground">
                {categoryLabel}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-semibold mb-3 line-clamp-2 flex-shrink-0">
          <Link 
            to={`/blog/${post.slug}`}
            className="hover:text-primary transition-colors"
          >
            {post.title}
          </Link>
        </h3>
        
        <p className="text-muted-foreground mb-4 line-clamp-3 flex-grow">
          {post.excerpt}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4 flex-shrink-0">
          {post.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>

        {/* Meta Information */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-shrink-0">
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
        <div className="flex-shrink-0">
          <Link to={`/blog/${post.slug}`}>
            <Button variant="outline" className="w-full">
              Ler mais
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;