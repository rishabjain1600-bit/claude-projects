import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { pushObserverEvent } from '@/lib/agent-store';
import { checkStock } from '@/app/api/stock/route';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model toggle — set AI_MODEL=sonnet in .env.local to switch to Sonnet
const MODELS = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
} as const;

const activeModel = process.env.AI_MODEL === 'sonnet' ? MODELS.sonnet : MODELS.haiku;

// Tool definitions available to the agent
const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'check_stock',
    description: 'Check if a specific shoe size is currently in stock. Use this whenever the customer asks about size availability or wants to change their size. Never guess — always call this tool.',
    input_schema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'The product ID (e.g. "blue-runner-01")' },
        size: { type: 'string', description: 'The shoe size to check (e.g. "9", "10.5")' },
      },
      required: ['productId', 'size'],
    },
  },
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  agentConfig: {
    systemPrompt: string;
    frictionType: 'process' | 'decision';
    allowedActions: string[];
    name: string;
  };
  pageContext: Record<string, unknown>;
  customerKey: string;
  sessionId: string;
}

export async function POST(req: NextRequest) {
  const body: ChatRequest = await req.json();
  const { messages, agentConfig, pageContext, customerKey, sessionId } = body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('ANTHROPIC_API_KEY not configured. Add it to .env.local', { status: 500 });
  }

  // Build the system prompt with page context injected
  const systemPrompt = buildSystemPrompt(agentConfig, pageContext);

  // Claude requires at least one user message.
  // On activation (empty messages), inject a system trigger — not a fake customer line.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentMessages: any[] =
    messages.length === 0
      ? [{ role: 'user', content: '[ACTIVATED] Customer has been idle at checkout. Open the conversation with your greeting.' }]
      : messages.map(m => ({ role: m.role, content: m.content }));

  // Stream Claude's response, handling tool use in a loop
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let fullText = '';

      try {
        // Agentic loop: keep going until Claude stops calling tools
        while (true) {
          // Reset thinking-block extraction state on every turn.
          // Claude may emit [THINKING] in each turn (including post-tool turns);
          // without resetting, turns after a tool call stream thinking verbatim.
          let thinkingBuffer = '';
          let thinkingMode: 'searching' | 'extracting' | 'streaming' = 'searching';

          const stream = anthropic.messages.stream({
            model: activeModel,
            max_tokens: 2048,
            system: systemPrompt,
            messages: currentMessages,
            tools: AGENT_TOOLS,
          });

          // Stream text chunks, extracting thinking block before forwarding to client
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const text = chunk.delta.text;

              if (thinkingMode === 'streaming') {
                fullText += text;
                controller.enqueue(encoder.encode(text));
                continue;
              }

              thinkingBuffer += text;

              if (thinkingMode === 'searching') {
                if (thinkingBuffer.includes('[THINKING]')) {
                  thinkingMode = 'extracting';
                } else if (
                  thinkingBuffer.length > '[THINKING]'.length ||
                  !'[THINKING]'.startsWith(thinkingBuffer)
                ) {
                  // No thinking block coming — flush and stream normally
                  controller.enqueue(encoder.encode(thinkingBuffer));
                  thinkingBuffer = '';
                  thinkingMode = 'streaming';
                }
              }

              if (thinkingMode === 'extracting' && thinkingBuffer.includes('[/THINKING]')) {
                const startTag = '[THINKING]';
                const endTag = '[/THINKING]';
                const contentStart = thinkingBuffer.indexOf(startTag) + startTag.length;
                const contentEnd = thinkingBuffer.indexOf(endTag);
                const thinkingContent = thinkingBuffer.slice(contentStart, contentEnd).trim();
                const remainder = thinkingBuffer.slice(contentEnd + endTag.length).replace(/^\s*\n/, '');

                pushObserverEvent(customerKey, {
                  type: 'agent_plan',
                  timestamp: Date.now(),
                  sessionId,
                  message: 'Agent reasoning',
                  detail: thinkingContent,
                  severity: 'info',
                });

                if (remainder) {
                  fullText += remainder;
                  controller.enqueue(encoder.encode(remainder));
                }
                thinkingBuffer = '';
                thinkingMode = 'streaming';
              }
            }
          }

          // Safety: flush any remaining buffer (e.g. model never emitted [/THINKING])
          if (thinkingBuffer) {
            fullText += thinkingBuffer;
            controller.enqueue(encoder.encode(thinkingBuffer));
            thinkingBuffer = '';
            thinkingMode = 'streaming';
          }

          const finalMessage = await stream.finalMessage();

          // If no tool call, we're done
          if (finalMessage.stop_reason !== 'tool_use') break;

          // Handle tool calls
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolUseBlocks = finalMessage.content.filter((b: any) => b.type === 'tool_use');
          currentMessages.push({ role: 'assistant', content: finalMessage.content });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolResults: any[] = [];

          for (const block of toolUseBlocks) {
            if (block.type !== 'tool_use') continue;
            const toolInput = block.input as Record<string, string>;

            // Notify observer panel: tool call in progress
            pushObserverEvent(customerKey, {
              type: 'tool_call',
              timestamp: Date.now(),
              sessionId,
              message: `Agent calling: ${block.name}(${JSON.stringify(toolInput)})`,
              detail: `  Tool: ${block.name}\n  Input: ${JSON.stringify(toolInput, null, 2)}`,
              severity: 'action',
            });

            let result: unknown = { error: 'Unknown tool' };

            if (block.name === 'check_stock') {
              result = checkStock(toolInput.productId, toolInput.size);
            }

            // Notify observer panel: tool result received
            pushObserverEvent(customerKey, {
              type: 'tool_result',
              timestamp: Date.now(),
              sessionId,
              message: `Stock API response: ${JSON.stringify(result)}`,
              detail: `  Result: ${JSON.stringify(result, null, 2)}`,
              severity: 'info',
            });

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          }

          currentMessages.push({ role: 'user', content: toolResults });
        }

        // Extract ACTION_PLAN block and push to observer panel (track.js handles client-side stripping)
        const apMatch = fullText.match(/\[ACTION_PLAN\]([\s\S]*?)\[\/ACTION_PLAN\]/);
        if (apMatch) {
          try {
            const plan = JSON.parse(apMatch[1].trim()) as { goal?: string; steps?: Array<{ action: string; description: string }> };
            const stepList = plan.steps
              ? plan.steps.map(s => `${s.action}: ${s.description}`).join('\n')
              : '';
            pushObserverEvent(customerKey, {
              type: 'agent_plan',
              timestamp: Date.now(),
              sessionId,
              message: `Action plan: ${plan.goal || ''}`,
              detail: stepList,
              severity: 'action',
            });
          } catch {
            // Invalid ACTION_PLAN JSON — ignore
          }
        }

        // After all turns complete, push the full agent response to the observer
        const displayText = fullText.replace(/\s*\[ACTION_PLAN\][\s\S]*?\[\/ACTION_PLAN\]\s*/, '').trim();
        if (displayText) {
          pushObserverEvent(customerKey, {
            type: 'agent_response',
            timestamp: Date.now(),
            sessionId,
            message: `Agent: "${displayText.length > 120 ? displayText.slice(0, 117) + '...' : displayText}"`,
            text: displayText,
            severity: 'info',
          });
        }
        await notifyObserver(customerKey, sessionId, fullText, agentConfig.frictionType);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Access-Control-Allow-Origin': 'http://localhost:3001',
    },
  });
}

function buildSystemPrompt(
  agentConfig: ChatRequest['agentConfig'],
  pageContext: Record<string, unknown>
): string {
  const savedData = extractSavedData(pageContext);

  // Extract pageContent and siteMap for formatted rendering; keep rest as JSON
  const { pageContent, siteMap, ...structuralContext } = pageContext as Record<string, unknown> & {
    pageContent?: string;
    siteMap?: Record<string, { path: string; links: Array<{href:string;text:string}>; buttons: Array<{selector:string;text:string}>; sizes: string[]; products: Array<{href:string;text:string;selector:string}> }>;
  };

  const siteMapSection = siteMap && Object.keys(siteMap).length > 0
    ? formatSiteMap(siteMap)
    : '';

  return `${agentConfig.systemPrompt}

--- Session context (structural, no PII) ---
${JSON.stringify(structuralContext, null, 2)}

${pageContent ? `--- Product page content (ground truth — only cite facts from here) ---\n${pageContent}` : ''}

${savedData ? `--- Saved data visible on the page ---\n${savedData}` : ''}

${siteMapSection ? `--- Live site map (real elements scanned from visited pages) ---\n${siteMapSection}` : ''}

--- Your constraints ---
Allowed actions: ${agentConfig.allowedActions.join(', ')}
Friction type: ${agentConfig.frictionType}

${agentConfig.frictionType === 'process'
  ? 'This user has PROCESS friction — they want to complete the task but are stuck. Help them finish.'
  : 'This user has DECISION friction — they may be reconsidering. Provide information, not pressure.'
}

Keep your responses concise and conversational. Never generate HTML. Use plain text only.`;
}

type SiteMapEntry = {
  path: string;
  links: Array<{href: string; text: string}>;
  buttons: Array<{selector: string; text: string}>;
  sizes: string[];
  products: Array<{href: string; text: string; selector: string}>;
};

function formatSiteMap(siteMap: Record<string, SiteMapEntry>): string {
  return Object.values(siteMap).map(page => {
    const lines: string[] = [`Page: ${page.path}`];
    if (page.products.length) {
      lines.push('  Products: ' + page.products.map(p => `${p.selector} ("${p.text}")`).join(', '));
    }
    if (page.buttons.length) {
      lines.push('  Buttons: ' + page.buttons.map(b => `${b.selector} ("${b.text}")`).join(', '));
    }
    if (page.sizes.length) {
      lines.push('  Size buttons: ' + page.sizes.join(', '));
    }
    if (page.links.length) {
      const navLinks = page.links.filter(l => l.href.startsWith('/') && !l.href.startsWith('/product'));
      if (navLinks.length) {
        lines.push('  Nav links: ' + navLinks.map(l => `${l.href} ("${l.text}")`).join(', '));
      }
    }
    return lines.join('\n');
  }).join('\n\n');
}

function extractSavedData(pageContext: Record<string, unknown>): string {
  const savedIndicators = pageContext.savedIndicators as Array<{ type: string; label: string }> | undefined;
  if (!savedIndicators?.length) return '';

  return savedIndicators
    .map(s => `${s.type}: ${s.label}`)
    .join('\n');
}

async function notifyObserver(
  customerKey: string,
  sessionId: string,
  agentText: string,
  frictionType: string
) {
  // Check if this looks like a confirmation request
  const isConfirmation =
    agentText.toLowerCase().includes("here's my plan") ||
    agentText.toLowerCase().includes("shall i proceed") ||
    agentText.toLowerCase().includes("shall i go ahead") ||
    agentText.toLowerCase().includes("want me to proceed");

  if (isConfirmation) {
    pushObserverEvent(customerKey, {
      type: 'agent_activated',
      timestamp: Date.now(),
      sessionId,
      message: `Agent proposed action — awaiting confirmation`,
      detail: `  Friction: ${frictionType.toUpperCase()}\n  Status: waiting for user confirm/reject`,
      severity: 'action',
    });
  }
}

// Handle preflight CORS
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3001',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
