'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  maxSize?: number;
  accept?: Record<string, string[]>;
  className?: string;
}

export default function FileUploader({
  onFileSelect,
  maxSize = 50 * 1024 * 1024, // 50MB
  accept = {
    'application/pdf': ['.pdf']
  },
  className = ''
}: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setError('文件太大，最大支持 50MB');
      } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setError('仅支持 PDF 文件');
      } else {
        setError('文件上传失败，请重试');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxSize,
    accept,
    multiple: false,
    noClick: !!selectedFile
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 ease-in-out
          ${isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : isDragReject
            ? 'border-red-500 bg-red-50 dark:bg-red-950'
            : 'border-gray-300 bg-gray-50 dark:bg-gray-900 dark:border-gray-700'
          }
          hover:border-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800
          cursor-pointer
        `}
      >
        <input {...getInputProps()} />

        {selectedFile ? (
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex-shrink-0">
                <File className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            {isDragActive ? (
              <>
                <Upload className="h-16 w-16 text-blue-600 dark:text-blue-400 animate-bounce" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  松开鼠标上传文件
                </p>
              </>
            ) : (
              <>
                <Upload className="h-16 w-16 text-gray-400 dark:text-gray-600" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    拖放 PDF 文件到这里
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    或者点击选择文件
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    最大支持 50MB
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center space-x-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-3 py-2 rounded-md text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!selectedFile && !error && (
          <div className="absolute top-2 right-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        )}
      </div>
    </div>
  );
}
