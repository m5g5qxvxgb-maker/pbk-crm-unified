import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware для проксирования API запросов
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Если запрос к /api/*, проксируем на backend
  if (pathname.startsWith('/api/')) {
    const backendUrl = process.env.API_URL || 'http://backend:5002';
    const apiPath = pathname;
    const targetUrl = `${backendUrl}${apiPath}${request.nextUrl.search}`;

    // Создаём новый request к backend
    return fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      // @ts-ignore
      duplex: 'half',
    }).then(response => {
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    });
  }

  return NextResponse.next();
}

// Применяем middleware только к /api/* путям
export const config = {
  matcher: '/api/:path*',
};
