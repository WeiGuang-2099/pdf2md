import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  const markerPort = process.env.MARKER_PORT || '8001';
  const markerUrl = `http://localhost:${markerPort}`;

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      MARKER_PORT: process.env.MARKER_PORT,
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
    },
    markerService: {
      url: markerUrl,
      health: null as any,
      error: null as any,
    }
  };

  // Check Marker service health
  try {
    const response = await axios.get(`${markerUrl}/health`, {
      timeout: 5000,
    });
    diagnostics.markerService.health = response.data;
  } catch (error) {
    diagnostics.markerService.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return NextResponse.json(diagnostics, { status: 200 });
}

export const dynamic = 'force-dynamic';
