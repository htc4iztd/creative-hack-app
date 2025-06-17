import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Paper,
  Divider,
} from '@mui/material';
import { Description, Code, Announcement } from '@mui/icons-material';

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom className="page-title">
        Creative.hackプラットフォームへようこそ
      </Typography>

      <Box mb={4}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            <Announcement color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
            お知らせ
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1" paragraph>
            Creative.hackプラットフォームへようこそ！このプラットフォームは、KDDIの社内アイデアソンと技術コンテストを促進するために設計されています。
          </Typography>
          <Typography variant="body1" paragraph>
            年の前半はサービス開発コンテスト（アイデアソン）に充てられ、ビジネスプランを提出し、最良のアイデアに投票することができます。
          </Typography>
          <Typography variant="body1">
            後半は技術コンテストに焦点を当て、選ばれたビジネスプランに基づいた実証実験（PoC）プロジェクトを実装したり、純粋に技術的なアイデアを提出したりすることができます。
          </Typography>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                <Description color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
                ビジネスプラン
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ビジネスアイデアを提出し、他の提案を閲覧し、最良のプランに投票しましょう。選ばれたプランはPoCフェーズに進みます。
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component="a" href="/business_plans">
                ビジネスプラン一覧
              </Button>
              <Button size="small" component="a" href="/business_plans/create">
                新規プラン提出
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                <Code color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
                PoCプラン
              </Typography>
              <Typography variant="body2" color="text.secondary">
                技術プロジェクトを閲覧し、既存のチームに参加するか、独自の技術提案を作成しましょう。あなたの技術スキルとイノベーションを披露してください。
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component="a" href="/poc-plans">
                PoCプラン一覧
              </Button>
              <Button size="small" component="a" href="/poc-plans/create">
                新規PoC提出
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}
