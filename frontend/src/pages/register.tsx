import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  MenuItem,
} from '@mui/material';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  department: string;
  division: string;
}

const departments = [
  '事業開発',
  'エンジニアリング',
  'プロダクト管理',
  'マーケティング',
  '営業',
  'カスタマーサポート',
  '人事',
  '財務',
  '法務',
  '運営',
];

const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'ユーザー名は3文字以上である必要があります')
    .max(20, 'ユーザー名は20文字以下である必要があります')
    .required('ユーザー名は必須です'),
  email: Yup.string()
    .email('無効なメールアドレスです')
    .required('メールアドレスは必須です'),
  password: Yup.string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .required('パスワードは必須です'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'パスワードが一致しません')
    .required('パスワード確認は必須です'),
  full_name: Yup.string()
    .required('氏名は必須です'),
  department: Yup.string()
    .required('部署は必須です'),
  division: Yup.string()
    .required('部門は必須です'),
});

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const initialValues: RegisterFormValues = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    department: '',
    division: '',
  };

  const handleSubmit = async (
    values: RegisterFormValues,
    { setSubmitting }: FormikHelpers<RegisterFormValues>
  ) => {
    try {
      setError(null);
      
      // In a real app, this would be an API call
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     username: values.username,
      //     email: values.email,
      //     password: values.password,
      //     full_name: values.full_name,
      //     department: values.department,
      //     division: values.division,
      //   }),
      // });
      
      // For demo purposes, we'll just simulate a successful registration
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || 'Registration failed');
      // }
      
      // Redirect to login page after successful registration
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
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
            アカウント作成
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Formik
            initialValues={initialValues}
            validationSchema={RegisterSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      id="full_name"
                      label="氏名"
                      name="full_name"
                      autoComplete="name"
                      error={touched.full_name && Boolean(errors.full_name)}
                      helperText={touched.full_name && errors.full_name}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      id="username"
                      label="ユーザー名"
                      name="username"
                      autoComplete="username"
                      error={touched.username && Boolean(errors.username)}
                      helperText={touched.username && errors.username}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      id="email"
                      label="メールアドレス"
                      name="email"
                      autoComplete="email"
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      select
                      id="department"
                      label="部署"
                      name="department"
                      error={touched.department && Boolean(errors.department)}
                      helperText={touched.department && errors.department}
                    >
                      {departments.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </Field>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      id="division"
                      label="部門"
                      name="division"
                      error={touched.division && Boolean(errors.division)}
                      helperText={touched.division && errors.division}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="password"
                      label="パスワード"
                      type="password"
                      id="password"
                      autoComplete="new-password"
                      error={touched.password && Boolean(errors.password)}
                      helperText={touched.password && errors.password}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="confirmPassword"
                      label="パスワード確認"
                      type="password"
                      id="confirmPassword"
                      error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                      helperText={touched.confirmPassword && errors.confirmPassword}
                    />
                  </Grid>
                </Grid>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                  sx={{ mt: 3, mb: 2 }}
                >
                  登録
                </Button>
                <Grid container justifyContent="flex-end">
                  <Grid item>
                    <Link href="/login">
                      <Typography variant="body2">
                        すでにアカウントをお持ちの方はログイン
                      </Typography>
                    </Link>
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
