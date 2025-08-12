import React, { useCallback, useState } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  uploadedFile?: File | null;
  uploadProgress?: number;
  className?: string;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  acceptedTypes = ['.stl', '.obj', '.3mf', '.gcode'],
  maxSize = 50, // 50MB default
  uploadedFile,
  uploadProgress,
  className = '',
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const validateFile = useCallback((file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${maxSize}MB. Arquivo atual: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
        variant: "destructive"
      });
      return false;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: `Tipos aceitos: ${acceptedTypes.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  }, [acceptedTypes, maxSize]);

  const handleFiles = useCallback(async (files: FileList) => {
    if (files.length === 0 || disabled) return;

    const file = files[0];
    setIsValidating(true);

    try {
      if (validateFile(file)) {
        onFileSelect(file);
        toast({
          title: "Arquivo selecionado",
          description: `${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: "Tente novamente com outro arquivo.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  }, [disabled, validateFile, onFileSelect]);

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

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (uploadedFile) {
    return (
      <Card className={`border-2 border-dashed ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {uploadProgress !== undefined && uploadProgress < 100 ? (
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uploadedFile.size)}
                  {uploadProgress !== undefined && uploadProgress < 100 && (
                    <span> • {uploadProgress}% enviado</span>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onFileRemove}
              disabled={disabled || (uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {uploadProgress !== undefined && uploadProgress < 100 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`border-2 border-dashed transition-colors ${
        dragActive 
          ? 'border-primary bg-primary/5' 
          : 'border-gray-300 hover:border-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CardContent className="p-8">
        <div className="text-center">
          <input
            type="file"
            className="hidden"
            onChange={handleFileInput}
            accept={acceptedTypes.join(',')}
            disabled={disabled}
            id="file-upload"
          />
          <label htmlFor="file-upload" className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}>
            <div className="flex flex-col items-center space-y-4">
              {isValidating ? (
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400" />
              )}
              
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isValidating ? 'Validando arquivo...' : 'Envie seu arquivo 3D'}
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
                  <File className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              )}
            </div>
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;