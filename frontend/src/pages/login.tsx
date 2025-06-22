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

  const initialValues: LoginFormValues = {
    username: '',
    password: '',
  };

  const handleSubmit = async (
    values: LoginFormValues,
    { setSubmitting }: FormikHelpers<LoginFormValues>
  ) => {
    console.log('[LOGIN] フォーム送信開始');
    console.log('[LOGIN] 入力値:', values);

    try {
      setError(null);

      console.log('[LOGIN] APIにリクエスト送信: /api/auth/token');
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: values.username,
          password: values.password,
        }),
      });

      console.log('[LOGIN] レスポンスステータス:', response.status);

      const text = await response.text();
      console.log('[LOGIN] レスポンスボディ:', text);

      if (!response.ok) {
        try {
          const errorData = JSON.parse(text);
          console.warn('[LOGIN] エラー詳細:', errorData);
          throw new Error(errorData.detail || 'ログインに失敗しました');
        } catch (jsonErr) {
          console.error('[LOGIN] レスポンスJSON解析失敗:', jsonErr);
          throw new Error('ログインに失敗しました（不正なレスポンス）');
        }
      }

      let data: any = {};
      try {
        data = JSON.parse(text);
        console.log('[LOGIN] 成功レスポンス:', data);
      } catch (parseErr) {
        console.error('[LOGIN] JSON解析エラー:', parseErr);
        throw new Error('ログイン成功しましたが、レスポンスが不正です');
      }

      if (!data.access_token) {
        console.error('[LOGIN] access_tokenがレスポンスに存在しない');
        throw new Error('ログインに成功しましたが、トークンが取得できませんでした');
      }

      localStorage.setItem('token', data.access_token);
      console.log('[LOGIN] トークンをlocalStorageに保存');
      router.push('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ログインに失敗しました';
      console.error('[LOGIN] 例外発生:', msg);
      setError(msg);
    } finally {
      setSubmitting(false);
      console.log('[LOGIN] フォーム送信完了');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Creative.hackプラットフォーム
          </Typography>
          <Typography component="h2" variant="h6" align="center" gutterBottom>
            ログイン
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form>
                <Field
                  as={TextField}
                  margin="normal"
                  fullWidth
                  id="username"
                  label="ユーザー名"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                />
                <Field
                  as={TextField}
                  margin="normal"
                  fullWidth
                  name="password"
                  label="パスワード"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                  sx={{ mt: 3, mb: 2 }}
                >
                  ログイン
                </Button>
                <Grid container spacing={1} direction="column" alignItems="flex-end">
                  <Grid item>
                    <NextLink href="/register" passHref legacyBehavior>
                      <MuiLink
                        underline="none"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: 'primary.light',
                          },
                        }}
                      >
                        アカウントをお持ちでない方は新規登録
                      </MuiLink>
                    </NextLink>
                  </Grid>
                  <Grid item>
                    <NextLink href="/forgot-password" passHref legacyBehavior>
                      <MuiLink
                        underline="none"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: 'primary.light',
                          },
                        }}
                      >
                        パスワードをお忘れですか？
                      </MuiLink>
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