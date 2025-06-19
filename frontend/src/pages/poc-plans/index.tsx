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
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Group as GroupIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

// Mock data for PoC plans
const mockPoCPlans = [
  {
    id: 1,
    title: 'AIカスタマーサービス実装',
    description: '自然言語処理と機械学習を使用したAI搭載カスタマーサービスプラットフォームの実装。',
    technical_requirements: 'Python、TensorFlow、NLP経験',
    creator: {
      id: 1,
      full_name: 'Taro Yamada',
    },
    business_plan_id: 1,
    business_plan_title: 'AI搭載カスタマーサービスプラットフォーム',
    is_technical_only: false,
    team_members: [
      { id: 1, full_name: 'Taro Yamada', role: 'creator' },
      { id: 5, full_name: 'Satoshi Ito', role: 'technical' },
      { id: 6, full_name: 'Akiko Kato', role: 'support' },
    ],
    created_at: '2023-07-10T10:30:00Z',
  },
  {
    id: 2,
    title: 'IoTオフィスセンサーネットワーク',
    description: 'スマートオフィスソリューション用のIoTセンサーネットワークの構築（温度、占有率、エネルギー使用量のモニタリングを含む）。',
    technical_requirements: 'IoTハードウェア、Arduino/Raspberry Pi、MQTT、Node.js',
    creator: {
      id: 2,
      full_name: 'Hanako Suzuki',
    },
    business_plan_id: 2,
    business_plan_title: 'IoTスマートオフィスソリューション',
    is_technical_only: false,
    team_members: [
      { id: 2, full_name: 'Hanako Suzuki', role: 'creator' },
      { id: 7, full_name: 'Takeshi Mori', role: 'technical' },
    ],
    created_at: '2023-07-12T14:20:00Z',
  },
  {
    id: 3,
    title: '量子コンピューティングアルゴリズム研究',
    description: '通信分野の最適化問題に対する量子コンピューティングアルゴリズムを探求する研究プロジェクト。',
    technical_requirements: '量子コンピューティングの知識、Python、線形代数',
    creator: {
      id: 8,
      full_name: 'Hiroshi Watanabe',
    },
    business_plan_id: null,
    business_plan_title: null,
    is_technical_only: true,
    team_members: [
      { id: 8, full_name: 'Hiroshi Watanabe', role: 'creator' },
    ],
    created_at: '2023-07-15T09:15:00Z',
  },
  {
    id: 4,
    title: 'ブロックチェーンサプライチェーンプロトタイプ',
    description: 'Hyperledger Fabricを使用したブロックチェーンベースのサプライチェーン追跡システムのプロトタイプ開発。',
    technical_requirements: 'ブロックチェーン、Hyperledger Fabric、JavaScript、Go',
    creator: {
      id: 3,
      full_name: 'Kenji Tanaka',
    },
    business_plan_id: 3,
    business_plan_title: 'ブロックチェーンベースのサプライチェーン追跡',
    is_technical_only: false,
    team_members: [
      { id: 3, full_name: 'Kenji Tanaka', role: 'creator' },
      { id: 9, full_name: 'Yumiko Sato', role: 'technical' },
      { id: 10, full_name: 'Ryo Kobayashi', role: 'technical' },
      { id: 11, full_name: 'Naomi Takahashi', role: 'support' },
    ],
    created_at: '2023-07-11T11:45:00Z',
  },
];

interface TeamMember {
  id: number;
  full_name: string;
  role: string;
}

interface PoCPlan {
  id: number;
  title: string;
  description: string;
  technical_requirements: string;
  creator: {
    id: number;
    full_name: string;
  };
  business_plan_id: number | null;
  business_plan_title: string | null;
  is_technical_only: boolean;
  team_members: TeamMember[];
  created_at: string;
}

export default function PoCPlans() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pocPlans, setPoCPlans] = useState<PoCPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      // In a real app, fetch PoC plans from API
      setPoCPlans(mockPoCPlans);
    }
  }, [router]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleJoinTeam = (id: number) => {
    // In a real app, send join team request to API
    alert(`Join request sent for PoC plan #${id}`);
  };

  const filteredPlans = pocPlans.filter((plan) => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (tabValue === 0) return matchesSearch; // All
    if (tabValue === 1) return matchesSearch && !plan.is_technical_only; // Business-related
    if (tabValue === 2) return matchesSearch && plan.is_technical_only; // Technical-only
    
    return matchesSearch;
  });

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" className="page-title">
          PoCプラン
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/poc-plans/create')}
        >
          新規PoC提出
        </Button>
      </Box>

      <Box mb={3}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="PoCプランを検索..."
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
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="poc plan tabs">
          <Tab label="すべてのプラン" />
          <Tab label="ビジネスチャレンジからの引継ぎ案件" />
          <Tab label="テックチャレンジ単体案件" />
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
                <Tooltip title={plan.is_technical_only ? "技術のみのプロジェクト" : "ビジネス関連プロジェクト"}>
                  <Chip
                    icon={plan.is_technical_only ? <CodeIcon /> : <DescriptionIcon />}
                    label={plan.is_technical_only ? "テック" : "ビジネス"}
                    color={plan.is_technical_only ? "secondary" : "primary"}
                    size="small"
                  />
                </Tooltip>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                {plan.description.length > 150
                  ? `${plan.description.substring(0, 150)}...`
                  : plan.description}
              </Typography>
              {plan.business_plan_id && (
                <Typography variant="caption" color="text.secondary" display="block">
                  ベース: {plan.business_plan_title}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" display="block">
                作成者: {plan.creator.full_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                提出日: {new Date(plan.created_at).toLocaleDateString()}
              </Typography>
              <Box mt={1} display="flex" alignItems="center">
                <GroupIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  チーム ({plan.team_members.length}):
                </Typography>
                <AvatarGroup max={3} sx={{ ml: 1 }}>
                  {plan.team_members.map((member) => (
                    <Tooltip key={member.id} title={`${member.full_name} (${member.role})`}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        {member.full_name.charAt(0)}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => router.push(`/poc-plans/${plan.id}`)}>
                詳細を見る
              </Button>
              <Button
                size="small"
                startIcon={<GroupIcon />}
                onClick={() => handleJoinTeam(plan.id)}
              >
                チームに参加
              </Button>
            </CardActions>
          </Card>
        ))}
      </div>

      {filteredPlans.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            PoCプランが見つかりません
          </Typography>
        </Box>
      )}
    </div>
  );
}
