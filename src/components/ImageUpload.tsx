import React, { useCallback, useState } from 'react';
import { Upload, Image, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  uploadedImage?: File | null;
  imagePreview?: string | null;
  className?: string;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onImageRemove,
  acceptedTypes = ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  maxSize = 5, // 5MB default for images
  uploadedImage,
  imagePreview,
  className = '',
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const validateImage = useCallback((file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Imagem muito grande. Máximo: ${maxSize}MB. Atual: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return false;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      toast.error(`Tipo de arquivo não suportado. Tipos aceitos: ${acceptedTypes.join(', ')}`);
      return false;
    }

    // Check if it's actually an image
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return false;
    }

    return true;
  }, [acceptedTypes, maxSize]);

  const handleFiles = useCallback(async (files: FileList) => {
    if (files.length === 0 || disabled) return;

    const file = files[0];
    setIsValidating(true);

    try {
      if (validateImage(file)) {
        onImageSelect(file);
        toast.success(`Imagem selecionada: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      }
    } catch (error) {
      toast.error('Erro ao processar imagem. Tente novamente com outro arquivo.');
    } finally {
      setIsValidating(false);
    }
  }, [disabled, validateImage, onImageSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleRemove = useCallback(() => {
    onImageRemove();
    toast.success('Imagem removida');
  }, [onImageRemove]);

  if (uploadedImage || imagePreview) {
    return (
      <Card className={`relative ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Image Preview */}
            <div className="relative">
              <img 
                src={imagePreview || (uploadedImage ? URL.createObjectURL(uploadedImage) : '')} 
                alt="Preview da imagem" 
                className="w-20 h-20 object-cover rounded-md border"
              />
              <div className="absolute -top-2 -right-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 bg-white rounded-full" />
              </div>
            </div>
            
            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {uploadedImage?.name || 'Imagem carregada'}
              </p>
              <p className="text-xs text-muted-foreground">
                {uploadedImage ? `${(uploadedImage.size / 1024 / 1024).toFixed(1)}MB` : 'Imagem do produto'}
              </p>
            </div>
            
            {/* Remove Button */}
            {!disabled && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative ${className}`}>
      <CardContent className="p-0">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="image-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept={acceptedTypes.join(',')}
            onChange={handleInputChange}
            disabled={disabled}
          />
          
          <label htmlFor="image-upload" className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}>
            <div className="flex flex-col items-center space-y-4">
              {isValidating ? (
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="relative">
                  <Image className="h-12 w-12 text-gray-400" />
                  <Upload className="h-6 w-6 text-gray-600 absolute -bottom-1 -right-1 bg-white rounded-full p-1" />
                </div>
              )}
              
              <div className="space-y-2 text-center">
                <p className="text-lg font-medium">
                  {isValidating ? 'Validando imagem...' : 'Envie a imagem do produto'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Arraste e solte ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: {acceptedTypes.join(', ')} • Máximo: {maxSize}MB
                </p>
              </div>
              
              {!disabled && !isValidating && (
                <Button type="button" variant="outline" size="sm">
                  Selecionar Imagem
                </Button>
              )}
            </div>
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageUpload;