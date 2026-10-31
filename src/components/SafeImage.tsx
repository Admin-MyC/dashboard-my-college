import React, { useState, useEffect } from 'react';
import {
  ImageFallbackType,
  getFallbackForType,
  handleImageError,
} from '../utils/imageUtils';

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: ImageFallbackType;
  fallbackText?: string;
  fallbackExtra?: string;
}

/**
 * SafeImage: Drop-in replacement for <img> that prevents broken image icons
 * across the application by gracefully rendering high-quality SVG fallbacks
 * (student initials, cafeteria food illustrations, user avatars, etc.).
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = '',
  className = '',
  fallbackType = 'student',
  fallbackText = '',
  fallbackExtra = '',
  onError,
  ...props
}) => {
  const fallbackUrl = getFallbackForType(fallbackType, fallbackText || alt, fallbackExtra);
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackUrl);
  const [hasError, setHasError] = useState<boolean>(!src);

  useEffect(() => {
    if (!src) {
      setCurrentSrc(fallbackUrl);
      setHasError(true);
    } else {
      setCurrentSrc(src);
      setHasError(false);
    }
  }, [src, fallbackUrl]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackUrl);
      handleImageError(e, fallbackType, fallbackText || alt, fallbackExtra);
    }
    if (onError) {
      onError(e);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading={props.loading || 'lazy'}
      {...props}
    />
  );
};

export default SafeImage;
