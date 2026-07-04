import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://momentem-ai.onrender.com/api';
    
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      cache: 'no-store',
    });

    return NextResponse.json({
      status: 'ok',
      backend: response.ok ? 'alive' : 'unreachable',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      backend: 'unreachable',
      timestamp: new Date().toISOString(),
    }, { status: 200 }); // return 200 so cron doesn't fail
  }
}
