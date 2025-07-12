// src/pages/api/business-plans/[id]/vote.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const token = req.headers.authorization || '';

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  try {
    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/business_plans/${id}/vote`,
      {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
      }
    );

    if (req.method === 'POST') {
      const data = await backendRes.json();
      return res.status(backendRes.status).json(data);
    } else {
      return res.status(backendRes.status).end();
    }
  } catch (err) {
    console.error('[API] vote error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}