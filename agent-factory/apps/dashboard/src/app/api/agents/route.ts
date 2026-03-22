import { NextRequest, NextResponse } from 'next/server';
import { deployedAgents } from '@/lib/agent-store';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// GET /api/agents?key=xxx — called by track.js to load active agents
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json([], { status: 200, headers: CORS_HEADERS });

  const agents = deployedAgents.get(key) || [];
  return NextResponse.json(agents, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}
