'use client';

import { FileText, AlertCircle, Download } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface PDFViewerProps {
  fileUrl: string;
  filename?: string;
  className?: string;
}

export default function PDFViewer({ fileUrl, filename = 'document.pdf', className = '' }: PDFViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!fileUrl) {
    return (
      <div className={`flex items-center justify-center h-full min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto" />
          <p className="text-gray-500 dark:text-gray-400">暂无 PDF 文件</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-red-600" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
            {filename}
          </h3>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          title="下载 PDF"
        >
          <Download className="h-4 w-4" />
          <span>下载</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        <iframe
          ref={iframeRef}
          src={fileUrl}
          className="w-full h-full border-0"
          title="PDF Preview"
          loading="lazy"
        />
      </div>
    </div>
  );
}
