import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface VisibleElement {
  tag: string;
  text?: string;
  dataAction?: string | null;
  id?: string | null;
  href?: string;
  size?: string;
}

interface FailedStep {
  action?: string;
  selector?: string;
  description?: string;
}

interface RecoveryRequest {
  goal: string;
  currentUrl: string;
  visibleElements: VisibleElement[];
  failedStep: FailedStep;
  history: string[];
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json([], { status: 500 });
  }

  const body: RecoveryRequest = await req.json();
  const { goal, currentUrl, visibleElements, failedStep, history } = body;

  const prompt = `You are a UI navigation agent that got stuck mid-plan.

Goal: ${goal}
Current page: ${currentUrl}
Failed step: ${JSON.stringify(failedStep)}
Completed steps so far: ${JSON.stringify(history)}

Visible elements on page:
${JSON.stringify(visibleElements, null, 2)}

Generate replacement steps (JSON array) to complete the goal from the current position.
Use only selectors matching the visible elements above.
Output ONLY a valid JSON array of step objects, nothing else. Each step: {"action":"navigate"|"click"|"complete","to":"/path","selector":"css","description":"..."}.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]';
    // Strip markdown code fences if present
    const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const steps = JSON.parse(clean);

    return Response.json(steps, {
      headers: { 'Access-Control-Allow-Origin': 'http://localhost:3001' },
    });
  } catch {
    return Response.json([], {
      headers: { 'Access-Control-Allow-Origin': 'http://localhost:3001' },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3001',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
