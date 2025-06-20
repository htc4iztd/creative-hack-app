import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.query;
  const { newPassword } = req.body;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/reset-password/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ new_password: newPassword }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ message: data.detail || 'Password reset failed' });
    }

    return res.status(200).json({ message: data.message || 'Password reset successful' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}