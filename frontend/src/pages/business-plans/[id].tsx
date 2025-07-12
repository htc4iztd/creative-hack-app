// src/pages/business-plans/[id].tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

interface Comment {
  id: number;
  user: { id: number; full_name: string };
  content: string;
  created_at: string;
}

interface BusinessPlanDetail {
  id: number;
  title: string;
  description: string;
  problem_statement: string;
  solution: string;
  target_market: string;
  business_model: string;
  competition: string;
  implementation_plan: string;
  creator_id: number;
  creator_name: string;
  department: string;
  vote_count: number;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
  comments: Comment[];
}

export default function BusinessPlanDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [businessPlan, setBusinessPlan] = useState<BusinessPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [voteMessage, setVoteMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // 認証チェック（デモ用に isAdmin も true）
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      setIsAdmin(true);
    }
  }, [router]);

  // ビジネスプラン詳細 & 投票状態取得
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    (async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token')!;
      try {
        // 詳細取得
        const res = await fetch(`/api/business-plans/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem('token');
          return router.push('/login');
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setBusinessPlan({
          id: data.id,
          title: data.title,
          description: data.description,
          problem_statement: data.problem_statement,
          solution: data.solution,
          target_market: data.target_market,
          business_model: data.business_model,
          competition: data.competition,
          implementation_plan: data.implementation_plan,
          creator_id: data.creator.id,
          creator_name: data.creator.full_name,
          department: data.creator.department,
          vote_count: data.vote_count,
          is_selected: data.is_selected,
          created_at: data.created_at,
          updated_at: data.updated_at,
          comments: data.comments ?? [],
        });
        // 投票済みかチェック
        const voteRes = await fetch(`/api/business-plans/${id}/user-vote`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (voteRes.ok) {
          setHasVoted(await voteRes.json());
        }
      } catch (e) {
        console.error(e);
        setError('データ取得に失敗しました');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, id]);

  // 投票／取消し処理
  const handleVote = async () => {
    if (!businessPlan || voteLoading) return;
    setVoteLoading(true);
    const token = localStorage.getItem('token')!;
    try {
      const method = hasVoted ? 'DELETE' : 'POST';
      const res = await fetch(`/api/business-plans/${id}/vote`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const didVote = !hasVoted;
      setBusinessPlan({
        ...businessPlan,
        vote_count: businessPlan.vote_count + (didVote ? 1 : -1),
      });
      setHasVoted(didVote);
      setVoteMessage(didVote ? '投票しました' : '投票を取り消しました');
      setVoteSuccess(true);
    } catch (e) {
      console.error(e);
      setError('投票処理に失敗しました');
    } finally {
      setVoteLoading(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box mt={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  if (!businessPlan) {
    return (
      <Box mt={4}>
        <Alert severity="error">プランが見つかりません</Alert>
      </Box>
    );
  }

  return (
    <div>
      {/* 上部ナビ */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/business-plans')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Business Plan Details
        </Typography>
        {isAdmin && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/business-plans/edit/${businessPlan.id}`)}
          >
            Edit
          </Button>
        )}
      </Box>

      {/* プラン内容 */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h5">{businessPlan.title}</Typography>
          <Box>
            {businessPlan.is_selected && (
              <Chip
                label="選定済"
                color="success"
                icon={<CheckCircleIcon />}
                sx={{ mr: 1 }}
              />
            )}
            <Button
              variant={hasVoted ? 'outlined' : 'contained'}
              startIcon={<ThumbUpIcon />}
              onClick={handleVote}
              disabled={voteLoading}
            >
              {hasVoted ? '取消し' : '投票'} ({businessPlan.vote_count})
            </Button>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" mb={3}>
          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography sx={{ mr: 3 }}>
            {businessPlan.creator_name}（{businessPlan.department}）
          </Typography>
          <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography>
            提出日 {new Date(businessPlan.created_at).toLocaleDateString()}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Typography variant="h6">Description</Typography>
            <Typography paragraph>{businessPlan.description}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6">Problem Statement</Typography>
            <Typography paragraph>{businessPlan.problem_statement}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6">Solution</Typography>
            <Typography paragraph>{businessPlan.solution}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Target Market</Typography>
            <Typography paragraph>{businessPlan.target_market}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Business Model</Typography>
            <Typography paragraph>{businessPlan.business_model}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6">Competition</Typography>
            <Typography paragraph>{businessPlan.competition}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6">Implementation Plan</Typography>
            <Typography paragraph>{businessPlan.implementation_plan}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* コメント一覧 */}
      <Typography variant="h6" gutterBottom>Comments</Typography>
      <Paper elevation={2} sx={{ mb: 4, p: 2 }}>
        <List>
          {businessPlan.comments.length > 0 ? (
            businessPlan.comments.map((c) => (
              <ListItem key={c.id} divider>
                <ListItemIcon><PersonIcon /></ListItemIcon>
                <ListItemText
                  primary={c.user.full_name}
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        {c.content}
                      </Typography>
                      <br />
                      <Typography component="span" variant="caption" color="text.secondary">
                        {new Date(c.created_at).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))
          ) : (
            <Typography>コメントはまだありません</Typography>
          )}
        </List>
      </Paper>

      {/* 成功メッセージ */}
      <Snackbar open={voteSuccess} autoHideDuration={3000} onClose={() => setVoteSuccess(false)}>
        <Alert onClose={() => setVoteSuccess(false)} severity="success">
          {voteMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}