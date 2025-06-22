// pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ detail: data.detail || '登録に失敗しました' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('[Register API] Unexpected error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}