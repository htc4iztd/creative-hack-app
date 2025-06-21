import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/business_plans/`, {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });
  const data = await apiRes.json();
  res.status(apiRes.status).json(data);
}