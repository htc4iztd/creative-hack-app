// pages/forgot-password.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Container, Typography, TextField, Button, Alert, Box, Paper
} from '@mui/material';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setError(null);
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('送信に失敗しました');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信エラー');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" gutterBottom>パスワードリセット</Typography>
        {sent ? (
          <Alert severity="success">リセットリンクを送信しました</Alert>
        ) : (
          <>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              fullWidth
              label="メールアドレス"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button variant="contained" onClick={handleSubmit} fullWidth sx={{ mt: 2 }}>
              リセットリンクを送信
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
}