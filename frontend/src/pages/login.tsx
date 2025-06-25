// src/pages/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import MuiLink from '@mui/material/Link';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
} from '@mui/material';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';

interface LoginFormValues {
  username: string;
  password: string;
}

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('ユーザー名は必須です'),
  password: Yup.string().required('パスワードは必須です'),
});

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const initialValues: LoginFormValues = { username: '', password: '' };

  const handleSubmit = async (
    values: LoginFormValues,
    { setSubmitting }: FormikHelpers<LoginFormValues>
  ) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username: values.username,
          password: values.password,
        }),
      });

      const text = await response.text();
      if (!response.ok) {
        const errData = JSON.parse(text);
        throw new Error(errData.detail || 'ログインに失敗しました');
      }

      const data = JSON.parse(text);
      const token = data.access_token;
      if (!token) throw new Error('トークンが取得できませんでした');

      // 1) localStorage にも保存
      localStorage.setItem('token', token);

      // 2) SSR 用に Cookie にも保存
      //    有効期間を1時間(3600秒)にしてみます
      document.cookie = `token=${token}; Path=/; Max-Age=3600; SameSite=Lax`;

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography h1 variant="h5" align="center" gutterBottom>
            Creative.hackプラットフォーム
          </Typography>
          <Typography h2 variant="h6" align="center" gutterBottom>
            ログイン
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Formik
            initialValues={initialValues}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form>
                <Field
                  as={TextField}
                  name="username"
                  label="ユーザー名"
                  fullWidth
                  margin="normal"
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                />
                <Field
                  as={TextField}
                  name="password"
                  type="password"
                  label="パスワード"
                  fullWidth
                  margin="normal"
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ mt: 3, mb: 2 }}
                >
                  ログイン
                </Button>
                <Grid container spacing={1} direction="column" alignItems="flex-end">
                  <Grid item>
                    <NextLink href="/register" passHref legacyBehavior>
                      <MuiLink underline="none">アカウントをお持ちでない方は新規登録</MuiLink>
                    </NextLink>
                  </Grid>
                  <Grid item>
                    <NextLink href="/forgot-password" passHref legacyBehavior>
                      <MuiLink underline="none">パスワードをお忘れですか？</MuiLink>
                    </NextLink>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Paper>
      </Box>
    </Container>
  );
}