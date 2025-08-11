import { Link, useLocation } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BlogNavigationProps {
  items?: BreadcrumbItem[];
}

const BlogNavigation = ({ items }: BlogNavigationProps) => {
  const location = useLocation();
  
  // Generate breadcrumbs based on current path if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Início", href: "/" }
    ];

    if (pathSegments.includes('blog')) {
      breadcrumbs.push({ label: "Blog", href: "/blog" });
      
      if (pathSegments.length > 1) {
        // This is a blog post page
        breadcrumbs.push({ label: "Post" });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = items || generateBreadcrumbs();

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index === 0 && <Home className="w-4 h-4 mr-1" />}
          
          {item.href ? (
            <Link 
              to={item.href}
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">
              {item.label}
            </span>
          )}
          
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="w-4 h-4 mx-2" />
          )}
        </div>
      ))}
    </nav>
  );
};

export default BlogNavigation;