import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';  // ← 追加
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
    return null;
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
            Creative.hackプラットフォームへようこそ！このプラットフォームは、WebベースでKDDIの社内アイデアソンと技術コンテストを支援します。
          </Typography>
          <Typography variant="body1" paragraph>
            Creative.hackは１年の期間の中で「ビジネスチャレンジ」と「テックチャレンジ」の２つに分けて開催され、各チャレンジ個別、もしくは総合して優秀な案を選定します。
          </Typography>
          <Typography variant="body1" paragraph>
            １年の前半はビジネスチャレンジに充てられます。本チャレンジではビジネスプランを提出し、最良のアイデアに投票することができます。
          </Typography>
          <Typography variant="body1">
            １年の後半はテックチャレンジに焦点が当てられます、選ばれたビジネスプランに基づいた実証実験（PoC）プロジェクトを実装したり、純粋に技術的なアイデアを提出したりすることができます。
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
                ビジネスアイデアを提出し、他の提案を閲覧し、最良のプランに投票しましょう。優秀なプランは商用サービス化の検討にご活用いただくことが可能です。
              </Typography>
            </CardContent>
            <CardActions>
              <Link href="/business-plans" passHref legacyBehavior>
                <Button size="small" component="a">ビジネスプラン一覧</Button>
              </Link>
              <Link href="/business-plans/create" passHref legacyBehavior>
                <Button size="small" component="a">ビジネスプランの提出</Button>
              </Link>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                <Code color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
                実験プラン
              </Typography>
              <Typography variant="body2" color="text.secondary">
                技術プロジェクトを閲覧し、既存のチームに参加するか、独自の技術提案を作成しましょう。あなたの技術スキルとイノベーションを披露してください。
              </Typography>
            </CardContent>
            <CardActions>
              <Link href="/poc-plans" passHref legacyBehavior>
                <Button size="small" component="a">実験プラン一覧</Button>
              </Link>
              <Link href="/poc-plans/create" passHref legacyBehavior>
                <Button size="small" component="a">実験案の提出</Button>
              </Link>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}