/*
 * @Author: yuheng li a1793138
 * @Date: 2026-02-02 14:23:40
 * @LastEditors: yuheng 
 * @LastEditTime: 2026-02-02 14:34:04
 * @FilePath: \maker\frontend\src\app\api\convert\route.ts
 * @Description: 
 * 
 * Copyright (c) ${2024} by ${yuheng li}, All Rights Reserved. 
 */
import { NextResponse } from 'next/server';
import axios from 'axios';

interface ConvertResponse {
  markdown: string;
  images: Record<string, string>;
  metadata: {
    filename: string;
    file_size: number;
    page_count: number;
    torch_device: string;
    timestamp: string;
  };
  success: boolean;
  message: string;
}

export async function POST(request: Request) {
  try {
    // Parse the incoming request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Get marker service URL
    const markerPort = process.env.MARKER_PORT || '8001';
    const markerUrl = `http://localhost:${markerPort}/convert`;

    // Forward to Marker API
    const forwardFormData = new FormData();
    forwardFormData.append('file', file);

    // Add optional max_pages parameter if provided
    const maxPages = formData.get('max_pages');
    if (maxPages) {
      forwardFormData.append('max_pages', maxPages.toString());
    }

    // Use axios with 1 hour timeout
    const response = await axios.post(markerUrl, forwardFormData, {
      timeout: 3600000, // 1 hour in milliseconds
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

    if (response.status >= 400) {
      console.error('Marker API error:', response.data);
      return NextResponse.json(
        { error: 'Failed to convert PDF', details: response.data },
        { status: response.status }
      );
    }

    const data: ConvertResponse = response.data;

    // Return the conversion result
    return NextResponse.json(data);

  } catch (error) {
    console.error('Convert API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Configure route options
export const maxDuration = 3600; // 1 hour timeout (in seconds)
export const dynamic = 'force-dynamic';
