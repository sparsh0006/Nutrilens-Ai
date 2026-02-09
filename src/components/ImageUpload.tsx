'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  onUpload: (imageData: string) => void;
  disabled?: boolean;
}

export default function ImageUpload({ onUpload, disabled }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0 || disabled) return;

      const file = acceptedFiles[0];

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        setPreview(result);
        onUpload(result);
      };

      reader.readAsDataURL(file);
    },
    [onUpload, disabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    multiple: false,
    disabled,
  });

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
            ${
              isDragActive
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-white hover:border-green-400 hover:bg-green-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload
            className={`mx-auto w-16 h-16 mb-4 ${
              isDragActive ? 'text-green-500' : 'text-gray-400'
            }`}
          />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {isDragActive ? 'Drop your meal photo here' : 'Upload a meal photo'}
          </p>
          <p className="text-sm text-gray-500">
            Drag and drop or click to select a file
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Supports JPG, PNG, WebP (max 10MB)
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Uploaded Image
              </span>
            </div>
            {!disabled && (
              <button
                onClick={clearPreview}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Remove image"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={preview}
              alt="Meal preview"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}