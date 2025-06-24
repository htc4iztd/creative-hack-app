// src/pages/api/business-plans.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';
  console.log('[api/business-plans] incoming Authorization:', authHeader);
  const { method, query, headers, body } = req;
  // バックエンドURLを構築（クエリパラメータ透過）
  const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/business_plans/`);
  if (query.search) url.searchParams.append('search', String(query.search));
  if (query.skip)   url.searchParams.append('skip',   String(query.skip));
  if (query.limit)  url.searchParams.append('limit',  String(query.limit));

  const apiRes = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      // クライアントの認証トークンを透過
      Authorization: headers.authorization || '',
    },
    // GET のときは body を含めない
    ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
  });

  const data = await apiRes.json();
  res.status(apiRes.status).json(data);
}