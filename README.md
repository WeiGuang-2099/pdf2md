# PDF to Markdown Converter

A Next.js + FastAPI application that converts PDF files to Markdown format using Marker with a modern, responsive UI.

## Features

- Drag and drop PDF file upload
- Real-time PDF to Markdown conversion using AI
- Side-by-side comparison view (PDF vs Markdown)
- Modern, responsive UI with Tailwind CSS
- Dark mode support
- Download converted Markdown files
- Copy to clipboard functionality
- Code syntax highlighting
- Mobile-friendly design
- Docker containerization
- CI/CD with GitHub Actions
- Cloud Run deployment ready

## Project Structure

```
maker/
├── frontend/                    # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── convert/    # PDF conversion API
│   │   │   │   ├── download/   # Markdown download API
│   │   │   │   └── health/     # Health check API
│   │   │   ├── page.tsx        # Home page (upload)
│   │   │   ├── preview/[id]/  # Preview page
│   │   │   └── layout.tsx      # Root layout
│   │   ├── components/
│   │   │   ├── FileUploader.tsx    # File upload component
│   │   │   ├── MarkdownPreview.tsx # Markdown preview
│   │   │   └── PDFViewer.tsx      # PDF viewer
│   │   └── app/
│   │       └── globals.css      # Global styles
│   ├── package.json
│   └── .env.example              # Environment variables example
│
├── marker-service/              # FastAPI backend
│   ├── server.py               # Main FastAPI server
│   ├── health.py               # Health check script
│   ├── requirements.txt        # Python dependencies
│   └── uploads/               # Temporary file storage
│
├── .github/
│   └── workflows/
│       └── deploy.yaml         # GitHub Actions workflow
│
├── Dockerfile                   # Multi-stage Docker build
├── docker-entrypoint.sh         # Container startup script
├── docker-compose.yml           # Local Docker Compose
├── .dockerignore               # Docker ignore patterns
├── .env.example                # Environment variables example
├── DEPLOYMENT.md               # Deployment guide
└── README.md                   # This file
```

## Implementation Progress

### Phase 1: Backend Infrastructure - Completed
- [x] Initialize Next.js project with TypeScript and Tailwind CSS
- [x] Create marker-service directory structure
- [x] Create Marker FastAPI server with `/convert` endpoint
- [x] Create Next.js API Routes (convert, download, health)

### Phase 2: Frontend UI - Completed
- [x] Create FileUploader component with drag-and-drop
- [x] Create MarkdownPreview component
- [x] Create PDFViewer component
- [x] Create home page with upload functionality
- [x] Create preview page with PDF and Markdown comparison
- [x] Add modern UI styling with Tailwind CSS
- [x] Implement dark mode support
- [x] Add responsive design

### Phase 3: Deployment - Completed
- [x] Create Dockerfile (multi-stage build)
- [x] Create docker-entrypoint.sh startup script
- [x] Set up GitHub Actions workflow
- [x] Create Docker Compose configuration
- [x] Add deployment documentation

## Quick Start

### Option 1: Docker Compose (Recommended for Local Development)

```bash
# Build and run
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Local Development

#### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

#### 2. Install Python Dependencies

```bash
cd marker-service
pip install -r requirements.txt
```

Or create a virtual environment:

```bash
cd marker-service
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

#### 3. Run Marker Service

```bash
cd marker-service
python server.py
```

The service will start on `http://localhost:8001`

#### 4. Run Next.js Development Server

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:3000`

## Deployment

### Deploy to Google Cloud Run

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

**Quick Deploy:**

1. Set up GitHub Secrets:
   - `GCP_PROJECT_ID`
   - `GCP_WORKLOAD_IDENTITY_PROVIDER`
   - `GCP_SERVICE_ACCOUNT`

2. Push to main branch:
   ```bash
   git push origin main
   ```

3. GitHub Actions will automatically deploy!

### Docker Build

```bash
# Build image
docker build -t pdf-to-markdown .

# Run container
docker run -p 3000:3000 -p 8001:8001 pdf-to-markdown
```

## Usage

1. Open `http://localhost:3000` in your browser
2. Drag and drop a PDF file or click to select one
3. Click "开始转换" (Start Conversion)
4. View the side-by-side comparison of PDF and Markdown
5. Download the Markdown file or copy it to clipboard

## API Endpoints

### Marker Service (Port 8001)

- `GET /health` - Health check
- `POST /convert` - Convert PDF to Markdown
  - Parameters:
    - `file`: PDF file (required)
    - `max_pages`: Maximum pages to convert (optional)

### Next.js API (Port 3000)

- `GET /api/health` - Check both Next.js and Marker service status
- `POST /api/convert` - Forward PDF conversion request to Marker
- `POST /api/download` - Download converted markdown as file

## Environment Variables

Create a `.env.local` file in the frontend directory (copy from `.env.example`):

```env
# Local development
MARKER_PORT=8001
MAX_UPLOAD_SIZE=52428800  # 50MB
TORCH_DEVICE=cpu
```

For production (see `.env.example`):
```env
# Production
GCP_PROJECT_ID=your-project-id
REGION=us-central1
TORCH_DEVICE=cpu
```

## Testing

### Health Check

```bash
curl http://localhost:3000/api/health
```

### Convert PDF

```bash
curl -X POST http://localhost:3000/api/convert \
  -F "file=@test.pdf"
```

## Features

### FileUploader Component
- Drag and drop support
- Click to browse files
- File size validation (max 50MB)
- File type validation (PDF only)
- Visual feedback during drag
- Clear file functionality

### MarkdownPreview Component
- Rendered Markdown view
- Raw Markdown source view
- Copy to clipboard
- Download as .md file
- Support for embedded images
- Code syntax highlighting

### PDFViewer Component
- Inline PDF preview using iframe
- Download PDF button
- File information display

### Preview Page
- Split view (PDF | Markdown)
- Responsive design (stacks on mobile)
- Toggle between views on mobile
- Download button
- Back to home navigation

## UI/UX Features

- Modern gradient backgrounds
- Smooth animations and transitions
- Loading states with spinners
- Error handling with user-friendly messages
- Success indicators
- Dark mode support (automatic based on system preference)
- Responsive design for mobile, tablet, and desktop
- Accessible keyboard navigation
- Focus indicators for screen readers

## Docker Architecture

### Multi-Stage Build

1. **Python Base Stage**
   - Installs Python 3.10 slim
   - Installs Marker and dependencies
   - Pre-downloads AI models
   - Copies server files

2. **Node.js Build Stage**
   - Builds Next.js application
   - Optimizes production bundle
   - Minimizes image size

3. **Runtime Stage**
   - Combines both services
   - Minimal base image
   - Runs both services via entrypoint script

### Benefits

- Optimized image size (~2GB)
- Fast builds with layer caching
- Pre-downloaded models (no cold start delay)
- Single container for easy deployment

## CI/CD with GitHub Actions

### Workflow Features

- Automated builds on push to main
- Manual workflow dispatch
- Multi-environment support (production/staging)
- GPU deployment option
- Service health checks
- PR comments with deployment URL
- Failure notifications

### Deployment Steps

1. Build Docker image with BuildKit
2. Push to Google Container Registry
3. Deploy to Cloud Run
4. Wait for health check
5. Report service URL

## Troubleshooting

### Marker Service Won't Start

If Marker service fails to start, ensure:
1. All Python dependencies are installed (`pip install -r requirements.txt`)
2. The port 8001 is not in use
3. PyTorch is properly installed

### Next.js Cannot Connect to Marker

If Next.js API cannot connect to Marker:
1. Check if Marker service is running on port 8001
2. Verify `MARKER_PORT` environment variable in `.env.local`
3. Check browser console and server logs for errors

### Large File Uploads Fail

For large PDF files (> 25MB), ensure:
1. The `MAX_UPLOAD_SIZE` is set in `.env.local`
2. Next.js configuration allows large request bodies (set in `next.config.js`)
3. Sufficient memory is available

### Docker Build Fails

If Docker build fails:
1. Check Dockerfile syntax
2. Verify all files exist
3. Check .dockerignore doesn't exclude needed files
4. Ensure sufficient disk space

### Deployment Fails

If GitHub Actions deployment fails:
1. Check all secrets are configured
2. Verify Workload Identity setup
3. Check service account permissions
4. Review workflow logs in GitHub Actions tab

For more troubleshooting, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Technology Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- React Dropzone
- React Markdown
- Lucide React (icons)

### Backend
- FastAPI
- Marker (PDF to Markdown conversion)
- PyTorch
- Uvicorn (ASGI server)

### DevOps
- Docker (Multi-stage builds)
- Docker Compose
- GitHub Actions (CI/CD)
- Google Cloud Run

## Cost Estimates

### Local Development
- Free (using your own machine)

### Cloud Run (CPU)
- Memory: 4Gi × $0.00000025/GB second
- CPU: 2 vCPU × $0.000004/vCPU second
- Estimated: ~$0.01-0.05 per conversion
- Monthly (100 conversions/day): ~$30-150

### Cloud Run (GPU)
- Base + NVIDIA L4: ~$0.74/hour
- Memory: 16Gi, CPU: 8 vCPU
- Monthly (100 conversions/day): ~$600-800

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Open an issue on GitHub for bugs or feature requests
