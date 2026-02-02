'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Download, FileText, AlertCircle } from 'lucide-react';
import PDFViewer from '@/components/PDFViewer';
import MarkdownPreview from '@/components/MarkdownPreview';

interface ConversionData {
  markdown: string;
  images: Record<string, string>;
  metadata: {
    filename: string;
    file_size: number;
    page_count: number;
    torch_device: string;
    timestamp: string;
  };
  filename: string;
  timestamp: string;
}

export default function PreviewPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<ConversionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const id = params.id;
    if (!id) {
      setError('无效的转换 ID');
      setLoading(false);
      return;
    }

    // Retrieve conversion data from sessionStorage
    const stored = sessionStorage.getItem(`conversion_${id}`);
    if (!stored) {
      setError('未找到转换数据，请重新上传文件');
      setLoading(false);
      return;
    }

    try {
      const parsedData: ConversionData = JSON.parse(stored);
      setData(parsedData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to parse conversion data:', err);
      setError('数据解析失败，请重新上传文件');
      setLoading(false);
    }
  }, [params.id]);

  const handleBack = () => {
    router.push('/');
  };

  const handleDownloadMarkdown = async () => {
    if (!data) return;

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: data.markdown,
          filename: data.filename.replace('.pdf', '.md'),
        }),
      });

      if (!response.ok) {
        throw new Error('下载失败');
      }

      // Create blob from response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename.replace('.pdf', '.md');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('下载失败，请重试');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              出错了
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {error}
            </p>
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>返回首页</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">返回</span>
              </button>
              {data && (
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-red-600" />
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[300px]">
                      {data.metadata.filename}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {data.metadata.page_count} 页 • {(data.metadata.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>下载 Markdown</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
        {/* PDF Panel */}
        <div className="flex-1 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          {data && pdfUrl && (
            <PDFViewer
              fileUrl={pdfUrl}
              filename={data.metadata.filename}
            />
          )}
          {data && !pdfUrl && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">
                PDF 预览暂不可用
              </p>
            </div>
          )}
        </div>

        {/* Markdown Panel */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800">
          {data && (
            <MarkdownPreview
              markdown={data.markdown}
              filename={data.filename.replace('.pdf', '.md')}
            />
          )}
        </div>
      </div>

      {/* Mobile Toggle */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex space-x-2">
          <button
            className="flex-1 px-4 py-2 text-center font-medium rounded-lg transition-colors"
            onClick={() => {
              // Toggle view for mobile
            }}
          >
            PDF
          </button>
          <button
            className="flex-1 px-4 py-2 text-center font-medium bg-blue-600 text-white rounded-lg transition-colors"
            onClick={() => {
              // Toggle view for mobile
            }}
          >
            Markdown
          </button>
        </div>
      </div>
    </main>
  );
}
