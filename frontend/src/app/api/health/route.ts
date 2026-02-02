import { NextResponse } from 'next/server';

interface HealthResponse {
  nextjs: string;
  marker?: string;
  timestamp: string;
  error?: string;
}

export async function GET() {
  try {
    // Check Next.js service
    const nextjsStatus = 'ok';

    // Check Marker service
    const markerPort = process.env.MARKER_PORT || '8001';
    const markerUrl = `http://localhost:${markerPort}/health`;

    let markerStatus: string | undefined;
    let error: string | undefined;

    try {
      const markerResponse = await fetch(markerUrl, {
        method: 'GET',
        cache: 'no-store',
      });

      if (markerResponse.ok) {
        markerStatus = 'ok';
      } else {
        markerStatus = 'error';
        error = `Marker service returned status ${markerResponse.status}`;
      }
    } catch (fetchError) {
      markerStatus = 'error';
      error = `Failed to connect to Marker service: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`;
    }

    const response: HealthResponse = {
      nextjs: nextjsStatus,
      marker: markerStatus,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      response.error = error;
    }

    // Return 200 if Next.js is healthy, even if Marker is down
    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json(
      { error: 'Health check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
