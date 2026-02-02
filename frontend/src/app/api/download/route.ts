import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { markdown, filename } = await request.json();

    if (!markdown) {
      return NextResponse.json(
        { error: 'No markdown content provided' },
        { status: 400 }
      );
    }

    // Generate filename
    const downloadFilename = filename || 'converted.md';

    // Return markdown as downloadable file
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
      },
    });

  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Support GET method for direct download
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const markdown = searchParams.get('markdown');
    const filename = searchParams.get('filename') || 'converted.md';

    if (!markdown) {
      return NextResponse.json(
        { error: 'No markdown content provided' },
        { status: 400 }
      );
    }

    // Return markdown as downloadable file
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
