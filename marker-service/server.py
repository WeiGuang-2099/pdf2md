import os
import shutil
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure app
app = FastAPI(title="Marker PDF to Markdown API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
TEMP_DIR = Path(os.getenv("TEMP_DIR", "./uploads"))
TEMP_DIR.mkdir(exist_ok=True)

# Environment variables
TORCH_DEVICE = os.getenv("TORCH_DEVICE", "cpu")

# Response models
class ConvertResponse(BaseModel):
    markdown: str
    images: Dict[str, Any]
    metadata: Dict[str, Any]
    success: bool
    message: str


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "marker-api",
        "torch_device": TORCH_DEVICE,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Marker PDF to Markdown API",
        "version": "1.0.0",
        "endpoints": {
            "/convert": "POST - Convert PDF to Markdown",
            "/health": "GET - Health check"
        }
    }


async def cleanup_temp_files():
    """Clean up temporary files older than 1 hour"""
    try:
        now = datetime.now()
        for filepath in TEMP_DIR.iterdir():
            file_time = datetime.fromtimestamp(filepath.stat().st_mtime)
            
            # Delete files older than 1 hour
            if now - file_time > timedelta(hours=1):
                try:
                    if filepath.is_file():
                        filepath.unlink()
                    elif filepath.is_dir():
                        shutil.rmtree(filepath)
                    print(f"Cleaned up: {filepath}")
                except Exception as e:
                    print(f"Error cleaning up {filepath}: {e}")
    except Exception as e:
        print(f"Error in cleanup task: {e}")


@app.on_event("startup")
async def startup_event():
    """Run cleanup task on startup"""
    await cleanup_temp_files()
    # Schedule periodic cleanup
    asyncio.create_task(periodic_cleanup())


async def periodic_cleanup():
    """Run periodic cleanup every 30 minutes"""
    while True:
        await asyncio.sleep(1800)  # 30 minutes
        await cleanup_temp_files()


@app.post("/convert", response_model=ConvertResponse)
async def convert_pdf(
    file: UploadFile = File(..., description="PDF file to convert"),
    max_pages: int = Form(None, description="Maximum number of pages to convert (optional)")
):
    """
    Convert PDF to Markdown using Marker
    
    Args:
        file: Uploaded PDF file
        max_pages: Optional maximum number of pages to convert
    
    Returns:
        ConvertResponse: Contains markdown, images, metadata, and status
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    # Create temporary file path
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    temp_pdf_path = TEMP_DIR / f"{timestamp}_{file.filename}"
    
    try:
        # Save uploaded file
        with open(temp_pdf_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Import marker (lazy import for faster startup)
        try:
            from marker.converters.pdf import PdfConverter
            from marker.models import create_model_dict
        except ImportError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to import marker: {str(e)}"
            )
        
        # Create converter
        artifact_dict = create_model_dict()
        converter = PdfConverter(artifact_dict=artifact_dict)
        
        # Convert PDF
        print(f"Converting PDF: {temp_pdf_path}")
        rendered = converter(str(temp_pdf_path))

        # Extract markdown and images directly from rendered object
        markdown = rendered.markdown if hasattr(rendered, 'markdown') else str(rendered)
        images = rendered.images if hasattr(rendered, 'images') else {}
        
        # Prepare metadata
        metadata = {
            "filename": file.filename,
            "file_size": os.path.getsize(temp_pdf_path),
            "page_count": len(rendered.pages) if hasattr(rendered, 'pages') else 0,
            "torch_device": TORCH_DEVICE,
            "timestamp": datetime.now().isoformat()
        }
        
        # Encode images to base64 for JSON response
        images_dict = {}
        if images:
            import base64
            for img_name, img_data in images.items():
                try:
                    if isinstance(img_data, bytes):
                        img_base64 = base64.b64encode(img_data).decode('utf-8')
                        images_dict[img_name] = f"data:image/png;base64,{img_base64}"
                except Exception as e:
                    print(f"Error encoding image {img_name}: {e}")
        
        print(f"Conversion completed: {len(markdown)} characters, {len(images_dict)} images")
        
        return ConvertResponse(
            markdown=markdown,
            images=images_dict,
            metadata=metadata,
            success=True,
            message="PDF converted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error converting PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to convert PDF: {str(e)}"
        )
    finally:
        # Clean up temporary file
        try:
            if temp_pdf_path.exists():
                temp_pdf_path.unlink()
        except Exception as e:
            print(f"Error cleaning up temp file: {e}")


@app.get("/cleanup")
async def manual_cleanup():
    """Manually trigger cleanup of temporary files"""
    await cleanup_temp_files()
    return {
        "message": "Cleanup completed",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("MARKER_PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"Starting Marker API server on {host}:{port}")
    print(f"TORCH_DEVICE: {TORCH_DEVICE}")
    print(f"TEMP_DIR: {TEMP_DIR}")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )
