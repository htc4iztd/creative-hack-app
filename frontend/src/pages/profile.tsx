import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Save as SaveIcon,
  Description as DescriptionIcon,
  Code as CodeIcon,
} from '@mui/icons-material';

// Mock data for user profile
const mockUserProfile = {
  id: 1,
  username: 'testuser',
  email: 'taro.yamada@example.com',
  full_name: 'Taro Yamada',
  department: 'Engineering',
  division: 'AI Research',
  created_at: '2023-01-15T10:30:00Z',
  business_plans: [
    {
      id: 1,
      title: 'AI-Powered Customer Service Platform',
      vote_count: 15,
      is_selected: true,
      created_at: '2023-04-15T10:30:00Z',
    },
  ],
  poc_plans: [
    {
      id: 1,
      title: 'AI Customer Service Implementation',
      team_members_count: 3,
      is_technical_only: false,
      created_at: '2023-07-10T10:30:00Z',
    },
  ],
};

interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  department: string;
  division: string;
  created_at: string;
  business_plans: {
    id: number;
    title: string;
    vote_count: number;
    is_selected: boolean;
    created_at: string;
  }[];
  poc_plans: {
    id: number;
    title: string;
    team_members_count: number;
    is_technical_only: boolean;
    created_at: string;
  }[];
}

interface ProfileFormData {
  email: string;
  full_name: string;
  department: string;
  division: string;
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function Profile() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<ProfileFormData>({
    email: '',
    full_name: '',
    department: '',
    division: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      // In a real app, fetch user profile from API
      // const fetchUserProfile = async () => {
      //   try {
      //     const token = localStorage.getItem('token');
      //     const response = await fetch('/api/users/me', {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     });
      //     if (!response.ok) {
      //       throw new Error('Failed to fetch user profile');
      //     }
      //     const data = await response.json();
      //     setUserProfile(data);
      //     setFormData({
      //       email: data.email,
      //       full_name: data.full_name,
      //       department: data.department,
      //       division: data.division,
      //       current_password: '',
      //       new_password: '',
      //       confirm_password: '',
      //     });
      //   } catch (err) {
      //     setError(err instanceof Error ? err.message : 'An unknown error occurred');
      //   } finally {
      //     setLoading(false);
      //   }
      // };
      // fetchUserProfile();

      // For demo purposes, use mock data
      setUserProfile(mockUserProfile);
      setFormData({
        email: mockUserProfile.email,
        full_name: mockUserProfile.full_name,
        department: mockUserProfile.department,
        division: mockUserProfile.division,
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords if changing password
    if (formData.new_password || formData.confirm_password) {
      if (!formData.current_password) {
        setError('Current password is required to change password');
        return;
      }
      if (formData.new_password !== formData.confirm_password) {
        setError('New passwords do not match');
        return;
      }
      if (formData.new_password.length < 8) {
        setError('New password must be at least 8 characters');
        return;
      }
    }

    try {
      // In a real app, update user profile via API
      // const token = localStorage.getItem('token');
      // const response = await fetch('/api/users/me', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({
      //     email: formData.email,
      //     full_name: formData.full_name,
      //     department: formData.department,
      //     division: formData.division,
      //     ...(formData.new_password ? {
      //       current_password: formData.current_password,
      //       new_password: formData.new_password,
      //     } : {}),
      //   }),
      // });
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || 'Failed to update profile');
      // }

      // For demo purposes, just update the local state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          email: formData.email,
          full_name: formData.full_name,
          department: formData.department,
          division: formData.division,
        });
      }

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }));

      setSuccess(true);
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

  if (!userProfile) {
    return (
      <Box mt={4}>
        <Alert severity="error">Failed to load user profile</Alert>
      </Box>
    );
  }

  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom className="page-title">
        My Profile
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Avatar
                sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main' }}
              >
                {userProfile.full_name.charAt(0)}
              </Avatar>
              <Typography variant="h6">{userProfile.full_name}</Typography>
              <Typography variant="body2" color="text.secondary">
                @{userProfile.username}
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <List dense>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary="Email" secondary={userProfile.email} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText primary="Department" secondary={`${userProfile.department}, ${userProfile.division}`} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText primary="Business Plans" secondary={`${userProfile.business_plans.length} submitted`} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon />
                </ListItemIcon>
                <ListItemText primary="PoC Plans" secondary={`${userProfile.poc_plans.length} submitted`} />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ mb: 4 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
              <Tab label="Edit Profile" />
              <Tab label="My Submissions" />
            </Tabs>

            <Box p={3}>
              {tabValue === 0 && (
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Personal Information
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Division"
                        name="division"
                        value={formData.division}
                        onChange={handleChange}
                        required
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Change Password (Optional)
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        name="current_password"
                        type="password"
                        value={formData.current_password}
                        onChange={handleChange}
                        helperText="Required only if changing password"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="New Password"
                        name="new_password"
                        type="password"
                        value={formData.new_password}
                        onChange={handleChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirm_password"
                        type="password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                      />
                    </Grid>

                    {error && (
                      <Grid item xs={12}>
                        <Alert severity="error">{error}</Alert>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <Box display="flex" justifyContent="flex-end">
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          startIcon={<SaveIcon />}
                        >
                          Save Changes
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              )}

              {tabValue === 1 && (
                <div>
                  <Typography variant="h6" gutterBottom>
                    My Business Plans
                  </Typography>
                  <List>
                    {userProfile.business_plans.map((plan) => (
                      <ListItem
                        key={plan.id}
                        button
                        onClick={() => router.push(`/business-plans/${plan.id}`)}
                        divider
                      >
                        <ListItemIcon>
                          <DescriptionIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={plan.title}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {plan.is_selected ? 'Selected for PoC phase' : 'Pending selection'}
                              </Typography>
                              <br />
                              <Typography component="span" variant="caption" color="text.secondary">
                                Votes: {plan.vote_count} • Submitted on {new Date(plan.created_at).toLocaleDateString()}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                    {userProfile.business_plans.length === 0 && (
                      <ListItem>
                        <ListItemText primary="No business plans submitted yet" />
                      </ListItem>
                    )}
                  </List>

                  <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                    My PoC Plans
                  </Typography>
                  <List>
                    {userProfile.poc_plans.map((plan) => (
                      <ListItem
                        key={plan.id}
                        button
                        onClick={() => router.push(`/poc-plans/${plan.id}`)}
                        divider
                      >
                        <ListItemIcon>
                          {plan.is_technical_only ? <CodeIcon /> : <DescriptionIcon />}
                        </ListItemIcon>
                        <ListItemText
                          primary={plan.title}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {plan.is_technical_only ? 'Technical-only project' : 'Business-related project'}
                              </Typography>
                              <br />
                              <Typography component="span" variant="caption" color="text.secondary">
                                Team members: {plan.team_members_count} • Submitted on {new Date(plan.created_at).toLocaleDateString()}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                    {userProfile.poc_plans.length === 0 && (
                      <ListItem>
                        <ListItemText primary="No PoC plans submitted yet" />
                      </ListItem>
                    )}
                  </List>
                </div>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert onClose={() => setSuccess(false)} severity="success">
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </div>
  );
}
