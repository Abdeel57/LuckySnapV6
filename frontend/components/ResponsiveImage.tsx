import React from 'react';
import { buildSrcSet, defaultSizes, OutputFormat } from '../utils/imageCdn';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    widths?: number[]; // p.ej. [480,768,1200,1600,2160]
    sizesHint?: string; // override sizes
    preferFormat?: OutputFormat; // 'auto' | 'webp' | 'avif' | ...
}

const DEFAULT_WIDTHS = [480, 768, 1200, 1600, 1920, 2160];

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
    src,
    alt,
    widths = DEFAULT_WIDTHS,
    sizesHint,
    preferFormat = 'auto',
    loading,
    decoding,
    fetchPriority,
    ...imgProps
}) => {
    const srcSet = buildSrcSet(src, widths, preferFormat);
    const sizes = sizesHint || defaultSizes(Math.max(...widths));

    return (
        <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            loading={loading}
            decoding={decoding}
            fetchPriority={fetchPriority as any}
            {...imgProps}
        />
    );
};

export default ResponsiveImage;


