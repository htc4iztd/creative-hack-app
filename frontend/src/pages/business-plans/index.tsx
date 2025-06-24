// src/pages/business-plans/index.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  ThumbUp as ThumbUpIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface BusinessPlan {
  id: number;
  title: string;
  description: string;
  creator_name: string;
  creator_id: number
  vote_count: number;
  is_selected: boolean;
  created_at: string;
}

export default function BusinessPlans() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [businessPlans, setBusinessPlans] = useState<BusinessPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 認証チェック＆データ取得
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);

    (async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('[BusinessPlans] token:', token);
        const res = await fetch('/api/business-plans', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // トークン期限切れ等で 401 が返ってきた場合
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        if (!res.ok) {
          throw new Error(`Unexpected HTTP ${res.status}`);
        }

        const data: BusinessPlan[] = await res.json();
        setBusinessPlans(data);
      } catch (err) {
        console.error(err);
        setError('ビジネスプランの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) =>
    setTabValue(newValue);

  const handleVote = (id: number) =>
    setBusinessPlans((plans) =>
      plans.map((p) =>
        p.id === id ? { ...p, vote_count: p.vote_count + 1 } : p
      )
    );

  // ローカルフィルタリング
  const filteredPlans = businessPlans.filter((plan) => {
    const txt = `${plan.title} ${plan.description}`.toLowerCase();
    const matches = txt.includes(searchTerm.toLowerCase());
    if (tabValue === 1) return matches && plan.is_selected;
    if (tabValue === 2) return matches && !plan.is_selected;
    return matches;
  });

  if (!isAuthenticated) return null;

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">ビジネスプラン</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/business-plans/create')}
        >
          新規プラン提出
        </Button>
      </Box>

      {loading && (
        <Box textAlign="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <>
          <Box mb={3}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="ビジネスプランを検索..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box mb={3}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="すべてのプラン" />
              <Tab label="選定されたプラン" />
              <Tab label="審査中のプラン" />
            </Tabs>
          </Box>

          <div className="card-grid">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{plan.title}</Typography>
                    {plan.is_selected && (
                      <Tooltip title="PoCフェーズに選定されました">
                        <Chip label="選定済" color="success" size="small" />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {plan.description.length > 150
                      ? `${plan.description.slice(0, 150)}…`
                      : plan.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    作成者: {plan.creator_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    提出日: {new Date(plan.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => router.push(`/business-plans/${plan.id}`)}
                  >
                    詳細を見る
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ThumbUpIcon />}
                    onClick={() => handleVote(plan.id)}
                  >
                    投票 ({plan.vote_count})
                  </Button>
                </CardActions>
              </Card>
            ))}

            {filteredPlans.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary">
                  ビジネスプランが見つかりません
                </Typography>
              </Box>
            )}
          </div>
        </>
      )}
    </div>
  );
}