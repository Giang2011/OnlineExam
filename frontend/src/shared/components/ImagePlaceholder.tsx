import React from 'react';
import { ImageOff } from 'lucide-react';

export interface ImagePlaceholderProps {
  alt?: string;
  className?: string;
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({ alt = 'Image unavailable', className = '' }) => (
  <div className={['flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400', className].join(' ')} aria-label={alt}>
    <ImageOff size={20} />
  </div>
);

export default ImagePlaceholder;
