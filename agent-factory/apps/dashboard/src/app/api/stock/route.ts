import { NextRequest } from 'next/server';

// Mock inventory — in production this would query a real inventory system.
const MOCK_INVENTORY: Record<string, Record<string, number>> = {
  'blue-runner-01': {
    '7': 5, '7.5': 3, '8': 8, '8.5': 6, '9': 4, '9.5': 2,
    '10': 3, '10.5': 1, '11': 7, '12': 2,
  },
  'white-court-02': {
    '7': 2, '7.5': 4, '8': 6, '8.5': 8, '9': 5, '9.5': 3,
    '10': 4, '10.5': 0, '11': 2, '12': 1,
  },
  'black-high-03': {
    '7': 3, '7.5': 2, '8': 7, '8.5': 5, '9': 6, '9.5': 4,
    '10': 3, '10.5': 2, '11': 4, '12': 3,
  },
};

export function checkStock(productId: string, size: string): { size: string; available: boolean; qty: number } {
  const productInventory = MOCK_INVENTORY[productId] || {};
  const qty = productInventory[size] ?? 0;
  return { size, available: qty > 0, qty };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId') || '';
  const size = searchParams.get('size') || '';

  if (!productId || !size) {
    return Response.json({ error: 'productId and size are required' }, { status: 400 });
  }

  return Response.json(checkStock(productId, size), {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
