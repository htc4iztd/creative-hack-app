// src/pages/api/business-plans/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(
    '[API Route] GET /api/business-plans/:id',
    'method=', req.method,
    'id=', req.query.id
  );

  if (req.method !== 'GET') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  const { id } = req.query;
  const authHeader = req.headers.authorization || '';

  try {
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
    return res.status(backendRes.status).json(data);
  } catch (err) {
    console.error('[API] business-plans/[id] error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}