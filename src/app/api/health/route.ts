import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Basic health check
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
      services: {
        api: 'operational',
        opik: process.env.OPIK_API_KEY ? 'configured' : 'not configured',
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
      },
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

// Optional: Add HEAD method for lightweight health checks
export async function HEAD(_request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}