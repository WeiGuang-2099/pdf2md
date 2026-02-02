'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FileUploader from '@/components/FileUploader';
import { Upload, FileText, ArrowRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionId, setConversionId] = useState<string | null>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
  }, []);

  const handleConvert = async () => {
    if (!file) return;

    setConverting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Conversion failed' }));
        const errorMessage = errorData.details
          ? `${errorData.error}: ${JSON.stringify(errorData.details)}`
          : errorData.error || '转换失败';
        console.error('API Error:', errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        // Generate a unique ID for the conversion
        const id = Date.now().toString();
        setConversionId(id);

        // Store conversion data in sessionStorage
        const conversionData = {
          markdown: data.markdown,
          images: data.images,
          metadata: data.metadata,
          filename: file.name,
          timestamp: new Date().toISOString()
        };

        sessionStorage.setItem(`conversion_${id}`, JSON.stringify(conversionData));

        // Navigate to preview page
        router.push(`/preview/${id}`);
      } else {
        throw new Error(data.message || '转换失败');
      }
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err instanceof Error ? err.message : '转换过程中发生错误');
      setConverting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setError(null);
    setConversionId(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            PDF 转 Markdown
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            将 PDF 文件快速转换为 Markdown 格式，保持格式和图片
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Upload Section */}
            <div className="mb-8">
              <FileUploader
                onFileSelect={handleFileSelect}
                className="max-w-2xl mx-auto"
              />
            </div>

            {/* File Info */}
            {file && (
              <div className="max-w-2xl mx-auto mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {!converting && (
                    <button
                      onClick={handleReset}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      重新选择
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Convert Button */}
            {file && !converting && (
              <div className="max-w-2xl mx-auto">
                <button
                  onClick={handleConvert}
                  className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>开始转换</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Loading State */}
            {converting && (
              <div className="max-w-2xl mx-auto">
                <div className="flex flex-col items-center space-y-4 py-8">
                  <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                  <p className="text-gray-600 dark:text-gray-400">正在转换中，请稍候...</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="max-w-2xl mx-auto">
                <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-300">
                      转换失败
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-8 py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <Upload className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    简单上传
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    支持拖放或点击上传
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    智能转换
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    使用 AI 保持格式
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <ArrowRight className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    即时预览
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    实时对比查看效果
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="max-w-2xl mx-auto mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            支持的文件格式：PDF • 最大文件大小：50MB • 转换时间：通常少于 1 分钟
          </p>
        </div>
      </div>
    </main>
  );
}
