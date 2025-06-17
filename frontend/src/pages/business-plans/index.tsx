import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  ThumbUp as ThumbUpIcon,
  Add as AddIcon,
} from '@mui/icons-material';

// Mock data for business plans
const mockBusinessPlans = [
  {
    id: 1,
    title: 'AI搭載カスタマーサービスプラットフォーム',
    description: 'AIを使用して自動化されたカスタマーサービス応答を提供し、応答時間を短縮し顧客満足度を向上させるプラットフォーム。',
    creator: {
      id: 1,
      full_name: 'Taro Yamada',
    },
    vote_count: 15,
    is_selected: true,
    created_at: '2023-04-15T10:30:00Z',
  },
  {
    id: 2,
    title: 'IoTスマートオフィスソリューション',
    description: 'スマートセンサーと自動化を通じて、オフィススペースの使用、エネルギー消費、従業員の快適性を最適化するIoTソリューション。',
    creator: {
      id: 2,
      full_name: 'Hanako Suzuki',
    },
    vote_count: 8,
    is_selected: false,
    created_at: '2023-04-16T14:20:00Z',
  },
  {
    id: 3,
    title: 'ブロックチェーンベースのサプライチェーン追跡',
    description: 'サプライチェーン全体で製品を追跡し、信頼性と透明性を確保するブロックチェーンソリューション。',
    creator: {
      id: 3,
      full_name: 'Kenji Tanaka',
    },
    vote_count: 12,
    is_selected: true,
    created_at: '2023-04-14T09:15:00Z',
  },
  {
    id: 4,
    title: '現場作業員向けARトレーニングプラットフォーム',
    description: '現場作業員のトレーニングのための拡張現実プラットフォームで、トレーニング時間を短縮しスキル保持を向上させる。',
    creator: {
      id: 4,
      full_name: 'Yuki Nakamura',
    },
    vote_count: 7,
    is_selected: false,
    created_at: '2023-04-17T11:45:00Z',
  },
];

interface BusinessPlan {
  id: number;
  title: string;
  description: string;
  creator: {
    id: number;
    full_name: string;
  };
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      // In a real app, fetch business plans from API
      setBusinessPlans(mockBusinessPlans);
    }
  }, [router]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleVote = (id: number) => {
    // In a real app, send vote to API
    setBusinessPlans(
      businessPlans.map((plan) =>
        plan.id === id ? { ...plan, vote_count: plan.vote_count + 1 } : plan
      )
    );
  };

  const filteredPlans = businessPlans.filter((plan) => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (tabValue === 0) return matchesSearch; // All
    if (tabValue === 1) return matchesSearch && plan.is_selected; // Selected
    if (tabValue === 2) return matchesSearch && !plan.is_selected; // Not Selected
    
    return matchesSearch;
  });

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" className="page-title">
          ビジネスプラン
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/business-plans/create')}
        >
          新規プラン提出
        </Button>
      </Box>

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
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="business plan tabs">
          <Tab label="すべてのプラン" />
          <Tab label="選定されたプラン" />
          <Tab label="審査中のプラン" />
        </Tabs>
      </Box>

      <div className="card-grid">
        {filteredPlans.map((plan) => (
          <Card key={plan.id}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography variant="h6" component="h2" gutterBottom>
                  {plan.title}
                </Typography>
                {plan.is_selected && (
                  <Tooltip title="PoCフェーズに選定されました">
                    <Chip
                      label="選定済"
                      color="success"
                      size="small"
                    />
                  </Tooltip>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                {plan.description.length > 150
                  ? `${plan.description.substring(0, 150)}...`
                  : plan.description}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                作成者: {plan.creator.full_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                提出日: {new Date(plan.created_at).toLocaleDateString()}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => router.push(`/business-plans/${plan.id}`)}>
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
      </div>

      {filteredPlans.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            ビジネスプランが見つかりません
          </Typography>
        </Box>
      )}
    </div>
  );
}
