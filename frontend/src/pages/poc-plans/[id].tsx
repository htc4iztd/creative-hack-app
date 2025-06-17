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
  Avatar,
  AvatarGroup,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Group as GroupIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

// Mock data for a PoC plan
const mockPoCPlan = {
  id: 1,
  title: 'AI Customer Service Implementation',
  description: 'Implementing the AI-powered customer service platform using natural language processing and machine learning.',
  technical_requirements: 'Python, TensorFlow, NLP experience, API integration knowledge, cloud deployment experience.',
  implementation_approach: 'We will use a combination of pre-trained language models and custom training on company-specific data. The system will be implemented as a microservice architecture with separate components for language understanding, response generation, and integration with existing systems. We will use a cloud-based deployment for scalability.',
  timeline: 'Month 1: Research and data collection\nMonth 2-3: Model development and training\nMonth 4: Integration with existing systems\nMonth 5: Testing and refinement\nMonth 6: Deployment and documentation',
  resources_needed: 'Team of 3-4 engineers with ML/NLP experience, cloud infrastructure, access to customer service data for training, development environment with GPU capabilities.',
  expected_outcomes: 'A functional AI customer service system that can handle at least 70% of common customer queries without human intervention, with high accuracy and natural language capabilities. The system should integrate with existing customer service tools and provide analytics on performance.',
  creator: {
    id: 1,
    full_name: 'Taro Yamada',
    department: 'Engineering',
    division: 'AI Research',
  },
  business_plan_id: 1,
  business_plan_title: 'AI-Powered Customer Service Platform',
  is_technical_only: false,
  team_members: [
    { id: 1, full_name: 'Taro Yamada', role: 'creator' },
    { id: 5, full_name: 'Satoshi Ito', role: 'technical' },
    { id: 6, full_name: 'Akiko Kato', role: 'support' },
  ],
  created_at: '2023-07-10T10:30:00Z',
  updated_at: '2023-07-15T14:45:00Z',
  comments: [
    {
      id: 1,
      user: {
        id: 5,
        full_name: 'Satoshi Ito',
      },
      content: 'I think we should consider using BERT or GPT-3 as the base model for our NLP component.',
      created_at: '2023-07-11T09:20:00Z',
    },
    {
      id: 2,
      user: {
        id: 7,
        full_name: 'Yuki Nakamura',
      },
      content: 'Have you considered how we would handle the transition between AI and human agents when needed?',
      created_at: '2023-07-12T11:45:00Z',
    },
  ],
};

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
  implementation_approach: string;
  timeline: string;
  resources_needed: string;
  expected_outcomes: string;
  creator: {
    id: number;
    full_name: string;
    department: string;
    division: string;
  };
  business_plan_id: number | null;
  business_plan_title: string | null;
  is_technical_only: boolean;
  team_members: TeamMember[];
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

export default function PoCPlanDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pocPlan, setPoCPlan] = useState<PoCPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // In a real app, this would be determined by user role

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
      // In a real app, fetch PoC plan from API
      // const fetchPoCPlan = async () => {
      //   try {
      //     const token = localStorage.getItem('token');
      //     const response = await fetch(`/api/poc-plans/${id}`, {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     });
      //     if (!response.ok) {
      //       throw new Error('Failed to fetch PoC plan');
      //     }
      //     const data = await response.json();
      //     setPoCPlan(data);
      //   } catch (err) {
      //     setError(err instanceof Error ? err.message : 'An unknown error occurred');
      //   } finally {
      //     setLoading(false);
      //   }
      // };
      // fetchPoCPlan();

      // For demo purposes, use mock data
      setPoCPlan(mockPoCPlan);
      setLoading(false);
    }
  }, [isAuthenticated, id]);

  const handleJoinTeam = async () => {
    try {
      // In a real app, send join team request to API
      // const token = localStorage.getItem('token');
      // const response = await fetch(`/api/poc-plans/${id}/join`, {
      //   method: 'POST',
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // });
      // if (!response.ok) {
      //   throw new Error('Failed to join team');
      // }

      // For demo purposes, just show success message
      setJoinSuccess(true);
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

  if (!pocPlan) {
    return (
      <Box mt={4}>
        <Alert severity="error">PoC plan not found</Alert>
      </Box>
    );
  }

  return (
    <div>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/poc-plans')}
          sx={{ mr: 2 }}
        >
          Back to PoC Plans
        </Button>
        <Typography variant="h4" component="h1" className="page-title" sx={{ flexGrow: 1 }}>
          PoC Plan Details
        </Typography>
        {isAdmin && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/poc-plans/edit/${pocPlan.id}`)}
          >
            Edit
          </Button>
        )}
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h5" component="h2" gutterBottom>
            {pocPlan.title}
          </Typography>
          <Tooltip title={pocPlan.is_technical_only ? "Technical-only project" : "Business-related project"}>
            <Chip
              icon={pocPlan.is_technical_only ? <CodeIcon /> : <DescriptionIcon />}
              label={pocPlan.is_technical_only ? "Technical" : "Business"}
              color={pocPlan.is_technical_only ? "secondary" : "primary"}
            />
          </Tooltip>
        </Box>

        <Box display="flex" alignItems="center" mb={2}>
          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mr: 3 }}>
            {pocPlan.creator.full_name} ({pocPlan.creator.department}, {pocPlan.creator.division})
          </Typography>
          <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Submitted on {new Date(pocPlan.created_at).toLocaleDateString()}
          </Typography>
        </Box>

        {pocPlan.business_plan_id && (
          <Box mb={2}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => router.push(`/business-plans/${pocPlan.business_plan_id}`)}
            >
              Based on: {pocPlan.business_plan_title}
            </Button>
          </Box>
        )}

        <Box display="flex" alignItems="center" mb={3}>
          <GroupIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" sx={{ mr: 2 }}>
            Team Members ({pocPlan.team_members.length}):
          </Typography>
          <AvatarGroup max={5}>
            {pocPlan.team_members.map((member) => (
              <Tooltip key={member.id} title={`${member.full_name} (${member.role})`}>
                <Avatar sx={{ width: 32, height: 32 }}>
                  {member.full_name.charAt(0)}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
          <Button
            variant="contained"
            color="primary"
            startIcon={<GroupIcon />}
            onClick={handleJoinTeam}
            sx={{ ml: 'auto' }}
          >
            Join Team
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {pocPlan.description}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Technical Requirements
            </Typography>
            <Typography variant="body1" paragraph>
              {pocPlan.technical_requirements}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Implementation Approach
            </Typography>
            <Typography variant="body1" paragraph>
              {pocPlan.implementation_approach}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Timeline
            </Typography>
            <Typography variant="body1" paragraph>
              {pocPlan.timeline}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Resources Needed
            </Typography>
            <Typography variant="body1" paragraph>
              {pocPlan.resources_needed}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Expected Outcomes
            </Typography>
            <Typography variant="body1" paragraph>
              {pocPlan.expected_outcomes}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Comments
      </Typography>
      <Paper elevation={2} sx={{ mb: 4 }}>
        <List>
          {pocPlan.comments.map((comment) => (
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
          {pocPlan.comments.length === 0 && (
            <ListItem>
              <ListItemText primary="No comments yet" />
            </ListItem>
          )}
        </List>
      </Paper>

      <Snackbar
        open={joinSuccess}
        autoHideDuration={3000}
        onClose={() => setJoinSuccess(false)}
      >
        <Alert onClose={() => setJoinSuccess(false)} severity="success">
          Team join request submitted successfully!
        </Alert>
      </Snackbar>
    </div>
  );
}
