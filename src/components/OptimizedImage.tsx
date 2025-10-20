import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderClassName?: string;
}

/**
 * Composant d'image optimisé avec lazy loading, dimensions fixes et placeholder
 */
export const OptimizedImage = ({ 
  src, 
  alt,
  width,
  height, 
  className, 
  placeholderClassName 
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
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

  if (!src || hasError) {
    return (
      <div className={cn("bg-gradient-to-br from-muted/20 to-muted/10 flex items-center justify-center", placeholderClassName || className)}>
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
      
      {/* Image réelle avec lazy loading et dimensions fixes pour éviter CLS */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            console.error(`Failed to load image: ${src}`);
            setHasError(true);
          }}
        />
      )}
    </div>
  );
};
