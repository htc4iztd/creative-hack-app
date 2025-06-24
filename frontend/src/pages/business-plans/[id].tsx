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
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // 認証チェック
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      setIsAdmin(true); // デモ用。実際はユーザー情報から判定
    }
  }, [router]);

  // データ取得 & WebSocket 接続
  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const token = localStorage.getItem('token')!;
    setLoading(true);
    setError(null);

    // 1. ビジネスプラン詳細取得
    (async () => {
      try {
        const res = await fetch(`/api/business-plans/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // ネストされた creator をフラット化
        const detail: BusinessPlanDetail = {
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
          comments: data.comments ?? [],  // API 側に comments がない場合は空配列
        };
        setBusinessPlan(detail);

        // 2. 投票状況取得
        const voteRes = await fetch(`/api/business-plans/${id}/user-vote`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (voteRes.ok) {
          setHasVoted(await voteRes.json());
        }
      } catch (err) {
        console.error(err);
        setError('ビジネスプランの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    })();

    // 3. WebSocket 接続（リアルタイム投票更新）
    const ws = new WebSocket(`ws://localhost:8000/ws/business-plans/${id}`);
    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.type === 'vote_update' && businessPlan) {
        setBusinessPlan({
          ...businessPlan,
          vote_count: msg.vote_count,
        });
      }
    };
    ws.onerror = (e) => console.error('WebSocket error:', e);
    ws.onclose = () => console.log('WebSocket disconnected');
    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [isAuthenticated, id]);

  // 投票ハンドラ
  const handleVote = async () => {
    if (!businessPlan) return;
    const token = localStorage.getItem('token')!;
    try {
      const method = hasVoted ? 'DELETE' : 'POST';
      const res = await fetch(`/api/business-plans/${id}/vote`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBusinessPlan({
        ...businessPlan,
        vote_count: hasVoted
          ? businessPlan.vote_count - 1
          : businessPlan.vote_count + 1,
      });
      setHasVoted(!hasVoted);
      setVoteSuccess(true);
    } catch (err) {
      console.error(err);
      setError('投票に失敗しました');
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
        <Alert severity="error">Business plan not found</Alert>
      </Box>
    );
  }

  return (
    <div>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/business-plans')}
          sx={{ mr: 2 }}
        >
          Back to Business Plans
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

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h5">{businessPlan.title}</Typography>
          <Box>
            {businessPlan.is_selected && (
              <Chip
                icon={<CheckCircleIcon />}
                label="Selected for PoC"
                color="success"
                sx={{ mr: 1 }}
              />
            )}
            <Button
              variant={hasVoted ? 'outlined' : 'contained'}
              startIcon={<ThumbUpIcon />}
              onClick={handleVote}
            >
              {hasVoted ? 'Voted' : 'Vote'} ({businessPlan.vote_count})
            </Button>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" mb={3}>
          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography sx={{ mr: 3 }}>
            {businessPlan.creator_name} ({businessPlan.department})
          </Typography>
          <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography>
            Submitted on {new Date(businessPlan.created_at).toLocaleDateString()}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Description</Typography>
            <Typography paragraph>{businessPlan.description}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Problem Statement</Typography>
            <Typography paragraph>{businessPlan.problem_statement}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Solution</Typography>
            <Typography paragraph>{businessPlan.solution}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Target Market</Typography>
            <Typography paragraph>{businessPlan.target_market}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Business Model</Typography>
            <Typography paragraph>{businessPlan.business_model}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Competition</Typography>
            <Typography paragraph>{businessPlan.competition}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Implementation Plan</Typography>
            <Typography paragraph>{businessPlan.implementation_plan}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom>Comments</Typography>
      <Paper elevation={2} sx={{ mb: 4, p: 2 }}>
        <List>
          {businessPlan.comments.length > 0 ? (
            businessPlan.comments.map((comment) => (
              <ListItem key={comment.id} divider>
                <ListItemIcon><PersonIcon /></ListItemIcon>
                <ListItemText
                  primary={comment.user.full_name}
                  secondary={
                    <>
                      <Typography component="span" variant="body2">{comment.content}</Typography><br />
                      <Typography component="span" variant="caption" color="text.secondary">
                        {new Date(comment.created_at).toLocaleString()}
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

      <Snackbar open={voteSuccess} autoHideDuration={3000} onClose={() => setVoteSuccess(false)}>
        <Alert onClose={() => setVoteSuccess(false)} severity="success">
          Vote submitted successfully!
        </Alert>
      </Snackbar>
    </div>
  );
}