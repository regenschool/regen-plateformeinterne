import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}

/**
 * Composant d'image optimisé avec lazy loading et placeholder
 */
export const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  placeholderClassName 
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer pour lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px", // Charger 50px avant que l'image soit visible
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  if (!src) {
    return (
      <div className={cn("bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center", placeholderClassName || className)}>
        <span className="text-4xl text-muted-foreground/40">?</span>
      </div>
    );
  }

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
      {/* Placeholder pendant le chargement */}
      {!isLoaded && (
        <div className={cn("absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse", placeholderClassName)} />
      )}
      
      {/* Image réelle avec lazy loading */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)} // Afficher quand même si erreur
        />
      )}
    </div>
  );
};
