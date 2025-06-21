import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // body の読み込み
  const body = await new Promise<string>((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', err => reject(err));
  });

  const backendURL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/token`;

  const response = await fetch(backendURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body, // ここに変換済みの文字列をそのまま使う
  });

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    return res.status(response.status).json({ message: text });
  }

  const data = await response.json();
  return res.status(response.status).json(data);
}