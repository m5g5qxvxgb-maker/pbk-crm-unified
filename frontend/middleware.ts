import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware для проксирования API запросов на backend
 * Исправлено: 2026-01-07 - упрощенный подход без манипуляций с Content-Length
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проксируем только /api/* запросы на backend
  if (pathname.startsWith('/api/')) {
    const backendUrl = process.env.API_URL || 'http://backend:5002';
    const targetUrl = `${backendUrl}${pathname}${request.nextUrl.search}`;

    console.log(`[Middleware] ${request.method} ${pathname} -> ${targetUrl}`);

    try {
      // Для GET/HEAD - просто проксируем без body
      if (request.method === 'GET' || request.method === 'HEAD') {
        const response = await fetch(targetUrl, {
          method: request.method,
          headers: request.headers,
        });

        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }

      // Для POST/PUT/DELETE/PATCH - читаем body как arrayBuffer и НЕ трогаем headers
      const bodyBuffer = await request.arrayBuffer();
      const headers = new Headers(request.headers);
      
      console.log(`[Middleware] Body size: ${bodyBuffer.byteLength} bytes`);
      
      // Удаляем проблемные заголовки и позволяем fetch установить их заново
      headers.delete('content-length');
      headers.delete('transfer-encoding');

      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
      });

      console.log(`[Middleware] Response: ${response.status} ${response.statusText}`);

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
      
    } catch (error) {
      console.error('[Middleware] Proxy error:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Proxy error: ' + (error as Error).message 
        },
        { status: 500 }
      );
    }
  }

  // Для не-API запросов - пропускаем дальше без изменений
  return NextResponse.next();
}

// Применяем middleware только к /api/* путям
export const config = {
  matcher: '/api/:path*',
};
