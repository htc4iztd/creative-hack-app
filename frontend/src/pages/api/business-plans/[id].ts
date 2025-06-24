// src/pages/api/business-plans/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const authHeader = req.headers.authorization || '';

  // GET 以外は許可しない
  if (req.method !== 'GET') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  try {
    // FastAPI の /business_plans/{id} を呼び出し
    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/business_plans/${id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
      }
    );

    const data = await backendRes.json();

    // バックエンドのステータスをそのまま返却
    return res.status(backendRes.status).json(data);
  } catch (err) {
    console.error('[API] business-plans/[id] error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}