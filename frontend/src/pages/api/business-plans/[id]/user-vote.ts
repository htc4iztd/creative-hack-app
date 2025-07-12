// src/pages/api/business-plans/[id]/user-vote.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<boolean>
) {
  const { id } = req.query;
  const token = req.headers.authorization || '';

  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/business_plans/${id}/user-vote`,
      {
        headers: { Authorization: token },
      }
    );
    const hasVoted = await backendRes.json();
    return res.status(backendRes.status).json(hasVoted);
  } catch (err) {
    console.error('[API] user-vote error:', err);
    return res.status(500).json(false);
  }
}