import { NextRequest } from 'next/server';
import { observerListeners, observerBuffers } from '@/lib/agent-store';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key) {
    return new Response('Missing key', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send buffered events first (reconnection support)
      const buffer = observerBuffers.get(key) || [];
      for (const event of buffer) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch { break; }
      }

      // Register listener for new events
      const listener = (event: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch { /* connection closed */ }
      };

      const listeners = observerListeners.get(key) || [];
      listeners.push(listener);
      observerListeners.set(key, listeners);

      // Heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        const ls = observerListeners.get(key) || [];
        observerListeners.set(key, ls.filter(l => l !== listener));
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
