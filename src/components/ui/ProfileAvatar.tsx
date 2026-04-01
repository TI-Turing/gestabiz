import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ProfileAvatarProps {
  src?: string | null;
  alt?: string;
  fallbackText?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showFallbackIcon?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-24 w-24 text-2xl'
};

/**
 * ProfileAvatar - Componente robusto para mostrar avatares de usuario con reintentos automáticos
 * 
 * Features:
 * - Reintentos automáticos cuando falla la carga de imagen
 * - Cache busting con timestamps
 * - Fallback a iniciales o ícono
 * - Múltiples tamaños predefinidos
 * - Manejo de errores con callbacks
 * 
 * @example
 * ```tsx
 * <ProfileAvatar 
 *   src={user.avatar_url} 
 *   alt={user.name}
 *   fallbackText={user.name}
 *   size="md"
 *   maxRetries={3}
 * />
 * ```
 */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  alt = 'Avatar',
  fallbackText,
  className = '',
  size = 'md',
  showFallbackIcon = true,
  maxRetries = 3,
  retryDelay = 1000,
  onLoadSuccess,
  onLoadError
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Construir URL con cache busting (solo en reintentos)
  const buildImageUrl = useCallback((url: string, attempt: number = 0): string => {
    if (!url) return '';
    // Primer intento: URL original — permite que el browser use su caché
    if (attempt === 0) return url;
    // Reintentos: forzar descarga fresca añadiendo timestamp
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}_retry${attempt}`;
  }, []);

  // Intentar cargar la imagen
  const attemptLoad = useCallback((url: string, attempt: number) => {
    if (attempt >= maxRetries) {
      setHasError(true);
      setIsLoading(false);
      const error = new Error(`Failed to load image after ${maxRetries} attempts`);
      onLoadError?.(error);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    const imageUrl = buildImageUrl(url, attempt);

    img.onload = () => {
      setImageSrc(imageUrl);
      setIsLoading(false);
      setHasError(false);
      setRetryCount(0);
      onLoadSuccess?.();
    };

    img.onerror = () => {
      console.warn(`[ProfileAvatar] Failed to load image (attempt ${attempt + 1}/${maxRetries}):`, url);
      
      if (attempt + 1 < maxRetries) {
        // Reintentar después del delay
        setTimeout(() => {
          setRetryCount(attempt + 1);
          attemptLoad(url, attempt + 1);
        }, retryDelay * (attempt + 1)); // Incrementar delay exponencialmente
      } else {
        setHasError(true);
        setIsLoading(false);
        const error = new Error(`Failed to load image after ${maxRetries} attempts`);
        onLoadError?.(error);
      }
    };

    img.src = imageUrl;
  }, [maxRetries, retryDelay, buildImageUrl, onLoadSuccess, onLoadError]);

  // Effect para iniciar la carga cuando cambia el src
  useEffect(() => {
    if (!src) {
      setImageSrc(null);
      setHasError(false);
      setIsLoading(false);
      setRetryCount(0);
      return;
    }

    // Reset state y comenzar carga
    setRetryCount(0);
    attemptLoad(src, 0);
  }, [src, attemptLoad]);

  // Generar iniciales del fallback text
  const getInitials = (text?: string): string => {
    if (!text) return '';
    
    const words = text.trim().split(/\s+/);
    if (words.length === 0) return '';
    
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(fallbackText);
  const sizeClass = sizeClasses[size];
  const combinedClassName = `${sizeClass} ${className}`;

  return (
    <Avatar className={combinedClassName}>
      {imageSrc && !hasError && (
        <AvatarImage 
          src={imageSrc} 
          alt={alt}
          loading="lazy"
          decoding="async"
        />
      )}
      <AvatarFallback className={isLoading ? 'animate-pulse' : ''}>
        {initials || (showFallbackIcon ? <User className="h-1/2 w-1/2" /> : '?')}
      </AvatarFallback>
    </Avatar>
  );
};

// Export con nombre para compatibilidad
export default ProfileAvatar;
