// --- pages/api/auth/token.ts ---
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false, // 重要：raw bodyを手動で読み込むため
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[API] /api/auth/token にリクエストが来ました');

  console.log('メソッド種別判定');
  if (req.method !== 'POST') {
    console.warn('[API] 不正なメソッド:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // リクエストボディ読み取り
  console.log('リクエストボディ読み取り');
  let rawBody: string;
  try {
    console.log('受信ボディ作成');
    rawBody = await new Promise<string>((resolve, reject) => {
      let data = '';
      req.on('data', chunk => (data += chunk));
      req.on('end', () => resolve(data));
      req.on('error', err => reject(err));
    });
    console.log('[API] 受信ボディ:', rawBody);
  } catch (err) {
    console.error('[API] ボディ読み込み失敗:', err);
    return res.status(400).json({ message: 'リクエストボディの読み込みに失敗しました' });
  }

  // パースして username/password を検証
  const params = new URLSearchParams(rawBody);
  const username = params.get('username');
  const password = params.get('password');

  if (!username || !password) {
    console.warn('[API] 必須パラメータ欠落:', { username, password });
    return res.status(400).json({ message: 'username または password が欠落しています' });
  }

  console.log('[API] 検出された username/password:', { username, password });

  const backendURL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/token`;
  console.log('[API] バックエンド転送先:', backendURL);

  try {
    const response = await fetch(backendURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ username, password }).toString(),
    });

    const contentType = response.headers.get('content-type');
    const responseText = await response.text();

    console.log('[API] バックエンド応答ステータス:', response.status);
    console.log('[API] バックエンド応答テキスト:', responseText);

    if (!contentType || !contentType.includes('application/json')) {
      return res.status(response.status).json({ message: responseText || '不正なレスポンス形式' });
    }

    try {
      const data = JSON.parse(responseText);
      return res.status(response.status).json(data);
    } catch (jsonErr) {
      console.error('[API] JSONパース失敗:', jsonErr);
      return res.status(500).json({ message: 'JSON解析に失敗しました' });
    }
  } catch (err) {
    console.error('[API] バックエンド通信エラー:', err);
    return res.status(502).json({ message: 'FastAPI バックエンドへの通信に失敗しました' });
  }
}