import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "PDF to Markdown Converter - 将 PDF 转换为 Markdown",
  description: "使用 AI 技术，快速将 PDF 文件转换为格式完美的 Markdown 文档。支持拖放上传、实时预览、一键下载。",
  keywords: "PDF, Markdown, 转换, AI, 文档转换",
  authors: [{ name: "PDF to Markdown" }],
  creator: "PDF to Markdown",
  publisher: "PDF to Markdown",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://pdf-to-markdown.com",
    title: "PDF to Markdown Converter",
    description: "快速将 PDF 文件转换为 Markdown 格式",
    siteName: "PDF to Markdown",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF to Markdown Converter",
    description: "快速将 PDF 文件转换为 Markdown 格式",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="PDF to Markdown" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
