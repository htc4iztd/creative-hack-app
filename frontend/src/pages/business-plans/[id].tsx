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
  Card,
  CardContent,
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

// Mock data for a business plan
const mockBusinessPlan = {
  id: 1,
  title: 'AI-Powered Customer Service Platform',
  description: 'A platform that uses AI to provide automated customer service responses, reducing response time and improving customer satisfaction.',
  problem_statement: 'Customer service departments often struggle with high volumes of repetitive queries, leading to long wait times, frustrated customers, and overworked staff. Traditional solutions like FAQ pages and chatbots lack the intelligence to handle complex or nuanced questions effectively.',
  solution: 'Our AI-powered customer service platform uses natural language processing and machine learning to understand and respond to customer queries with human-like accuracy. The system continuously learns from interactions and can handle increasingly complex questions over time. It integrates with existing customer service tools and can escalate to human agents when necessary.',
  target_market: 'Primary: Large B2C companies with high customer service volumes (e-commerce, telecommunications, banking, utilities)\nSecondary: Medium-sized businesses looking to scale customer support efficiently',
  business_model: 'SaaS subscription model with tiered pricing based on query volume and customization needs. Additional revenue from implementation services, custom AI training, and analytics packages.',
  competition: 'Current solutions include basic chatbots (limited intelligence), general AI platforms (not specialized for customer service), and traditional CRM systems (lacking advanced AI capabilities). Our competitive advantage is the specialized focus on customer service AI with seamless human handoff capabilities.',
  implementation_plan: 'Phase 1: Develop core NLP engine and basic response capabilities\nPhase 2: Build integration framework for common CRM and customer service platforms\nPhase 3: Implement learning algorithms to improve responses over time\nPhase 4: Develop analytics dashboard for performance monitoring\nPhase 5: Create customization tools for business-specific knowledge',
  creator: {
    id: 1,
    full_name: 'Taro Yamada',
    department: 'Engineering',
    division: 'AI Research',
  },
  vote_count: 15,
  is_selected: true,
  created_at: '2023-04-15T10:30:00Z',
  updated_at: '2023-04-20T14:45:00Z',
  comments: [
    {
      id: 1,
      user: {
        id: 2,
        full_name: 'Hanako Suzuki',
      },
      content: 'This is a great idea! I think we could also explore integrating this with our existing CRM system.',
      created_at: '2023-04-16T09:20:00Z',
    },
    {
      id: 2,
      user: {
        id: 3,
        full_name: 'Kenji Tanaka',
      },
      content: 'Have you considered how this would handle multiple languages? Our customer base is quite international.',
      created_at: '2023-04-17T11:45:00Z',
    },
  ],
};

interface BusinessPlan {
  id: number;
  title: string;
  description: string;
  problem_statement: string;
  solution: string;
  target_market: string;
  business_model: string;
  competition: string;
  implementation_plan: string;
  creator: {
    id: number;
    full_name: string;
    department: string;
    division: string;
  };
  vote_count: number;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
  comments: {
    id: number;
    user: {
      id: number;
      full_name: string;
    };
    content: string;
    created_at: string;
  }[];
}

export default function BusinessPlanDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [businessPlan, setBusinessPlan] = useState<BusinessPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // In a real app, this would be determined by user role
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      // For demo purposes, set admin to true
      setIsAdmin(true);
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchBusinessPlan();
      
      // Connect to WebSocket for real-time updates
      const ws = new WebSocket(`ws://localhost:8000/ws/business-plans/${id}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'vote_update') {
          // Update business plan with new vote count
          setBusinessPlan(prevPlan => {
            if (prevPlan) {
              return {
                ...prevPlan,
                vote_count: data.vote_count
              };
            }
            return prevPlan;
          });
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
      
      setSocket(ws);
      
      // Cleanup function
      return () => {
        ws.close();
      };
    }
  }, [isAuthenticated, id]);
  
  const fetchBusinessPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/business-plans/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch business plan');
      }
      
      const data = await response.json();
      setBusinessPlan(data);
      
      // Check if user has already voted
      const votesResponse = await fetch(`/api/business-plans/${id}/user-vote`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (votesResponse.ok) {
        const hasVoted = await votesResponse.json();
        setHasVoted(hasVoted);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!businessPlan) return;
    
    try {
      const token = localStorage.getItem('token');
      let response;
      
      if (hasVoted) {
        // Remove vote
        response = await fetch(`/api/business-plans/${id}/vote`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // Add vote
        response = await fetch(`/api/business-plans/${id}/vote`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      
      if (!response.ok) {
        throw new Error(hasVoted ? 'Failed to remove vote' : 'Failed to vote for business plan');
      }
      
      // Update local state
      setBusinessPlan({
        ...businessPlan,
        vote_count: hasVoted ? businessPlan.vote_count - 1 : businessPlan.vote_count + 1,
      });
      
      setHasVoted(!hasVoted);
      setVoteSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
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
        <Typography variant="h4" component="h1" className="page-title" sx={{ flexGrow: 1 }}>
          Business Plan Details
        </Typography>
        {isAdmin && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/business-plans/edit/${businessPlan.id}`)}
          >
            Edit
          </Button>
        )}
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h5" component="h2" gutterBottom>
            {businessPlan.title}
          </Typography>
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
              variant={hasVoted ? "outlined" : "contained"}
              color="primary"
              startIcon={<ThumbUpIcon />}
              onClick={handleVote}
            >
              {hasVoted ? "Voted" : "Vote"} ({businessPlan.vote_count})
            </Button>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" mb={3}>
          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mr: 3 }}>
            {businessPlan.creator.full_name} ({businessPlan.creator.department}, {businessPlan.creator.division})
          </Typography>
          <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Submitted on {new Date(businessPlan.created_at).toLocaleDateString()}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {businessPlan.description}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Problem Statement
            </Typography>
            <Typography variant="body1" paragraph>
              {businessPlan.problem_statement}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Solution
            </Typography>
            <Typography variant="body1" paragraph>
              {businessPlan.solution}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Target Market
            </Typography>
            <Typography variant="body1" paragraph>
              {businessPlan.target_market}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Business Model
            </Typography>
            <Typography variant="body1" paragraph>
              {businessPlan.business_model}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Competition
            </Typography>
            <Typography variant="body1" paragraph>
              {businessPlan.competition}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Implementation Plan
            </Typography>
            <Typography variant="body1" paragraph>
              {businessPlan.implementation_plan}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Comments
      </Typography>
      <Paper elevation={2} sx={{ mb: 4 }}>
        <List>
          {businessPlan.comments.map((comment) => (
            <ListItem key={comment.id} divider>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText
                primary={comment.user.full_name}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {comment.content}
                    </Typography>
                    <br />
                    <Typography component="span" variant="caption" color="text.secondary">
                      {new Date(comment.created_at).toLocaleString()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
          {businessPlan.comments.length === 0 && (
            <ListItem>
              <ListItemText primary="No comments yet" />
            </ListItem>
          )}
        </List>
      </Paper>

      <Snackbar
        open={voteSuccess}
        autoHideDuration={3000}
        onClose={() => setVoteSuccess(false)}
      >
        <Alert onClose={() => setVoteSuccess(false)} severity="success">
          Vote submitted successfully!
        </Alert>
      </Snackbar>
    </div>
  );
}
