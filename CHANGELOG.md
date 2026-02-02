# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-02-02

### Added
- Initial release of PDF to Markdown Converter
- **Backend Infrastructure**
  - Next.js 14 with App Router and TypeScript
  - FastAPI server for PDF to Markdown conversion
  - Marker integration for AI-powered conversion
  - API routes for convert, download, and health
  - Automatic cleanup of temporary files
  - CORS support and error handling

- **Frontend UI**
  - Modern, responsive design with Tailwind CSS
  - FileUploader component with drag-and-drop
  - MarkdownPreview component with syntax highlighting
  - PDFViewer component for inline preview
  - Side-by-side comparison view
  - Dark mode support
  - Mobile-friendly interface
  - Loading states and error handling
  - Copy to clipboard functionality
  - Download buttons for both PDF and Markdown

- **Deployment**
  - Multi-stage Dockerfile for optimized builds
  - Docker Compose for local development
  - GitHub Actions workflow for CI/CD
  - Google Cloud Run deployment ready
  - Workload Identity Federation support
  - Health checks and monitoring

- **Documentation**
  - Comprehensive README with setup instructions
  - DEPLOYMENT.md for Cloud Run setup
  - Environment variable examples
  - Troubleshooting guides
  - Cost estimation

### Features
- PDF to Markdown conversion using AI
- Supports files up to 50MB
- Automatic image extraction and embedding
- Real-time preview
- Responsive design for all devices
- Dark/light mode support
- Code syntax highlighting in markdown
- Batch conversion ready (infrastructure in place)

### Technology Stack
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: FastAPI, Marker, PyTorch
- DevOps: Docker, GitHub Actions, Google Cloud Run

### Deployment
- Supports local development with Docker Compose
- Ready for Cloud Run deployment
- CPU and GPU instance options
- Auto-scaling configuration
- Health monitoring and alerting

## [Unreleased]

### Planned Features
- [ ] Batch file conversion
- [ ] Conversion history with user accounts
- [ ] Export to other formats (HTML, DOCX)
- [ ] Conversion templates and presets
- [ ] OCR language selection
- [ ] Performance metrics dashboard
- [ ] API rate limiting
- [ ] WebSocket support for real-time updates
