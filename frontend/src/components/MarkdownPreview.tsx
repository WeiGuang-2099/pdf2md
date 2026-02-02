'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Download, Copy, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface MarkdownPreviewProps {
  markdown: string;
  filename?: string;
  className?: string;
}

export default function MarkdownPreview({ markdown, filename = 'converted.md', className = '' }: MarkdownPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!markdown) {
    return (
      <div className={`flex items-center justify-center h-full min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto" />
          <p className="text-gray-500 dark:text-gray-400">暂无 Markdown 内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Markdown 预览
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {showRaw ? '查看渲染' : '查看源码'}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            title="复制到剪贴板"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            title="下载 Markdown 文件"
          >
            <Download className="h-4 w-4" />
            <span>下载</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-950">
        {showRaw ? (
          <pre className="p-6 text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {markdown}
          </pre>
        ) : (
          <div className="p-6 markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Custom image component to handle base64 images
                img: ({ src, alt, ...props }) => (
                  <img
                    src={src}
                    alt={alt}
                    className="max-w-full h-auto rounded-lg my-4"
                    {...props}
                  />
                ),
                // Custom code block styling
                code: ({ node, inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
