import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

interface BusinessPlanFormData {
  title: string;
  description: string;
  problem_statement: string;
  solution: string;
  target_market: string;
  business_model: string;
  competition: string;
  implementation_plan: string;
}

export default function CreateBusinessPlan() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<BusinessPlanFormData>({
    title: '',
    description: '',
    problem_statement: '',
    solution: '',
    target_market: '',
    business_model: '',
    competition: '',
    implementation_plan: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/business-plans/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit business plan');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/business-plans');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom className="page-title">
        Submit New Business Plan
      </Typography>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                variant="outlined"
                helperText="A concise and descriptive title for your business plan"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                variant="outlined"
                helperText="A brief overview of your business plan"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Problem Statement"
                name="problem_statement"
                value={formData.problem_statement}
                onChange={handleChange}
                variant="outlined"
                helperText="Describe the problem your business plan aims to solve"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Solution"
                name="solution"
                value={formData.solution}
                onChange={handleChange}
                variant="outlined"
                helperText="Explain your proposed solution to the problem"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                label="Target Market"
                name="target_market"
                value={formData.target_market}
                onChange={handleChange}
                variant="outlined"
                helperText="Describe your target market and potential customers"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                label="Business Model"
                name="business_model"
                value={formData.business_model}
                onChange={handleChange}
                variant="outlined"
                helperText="Explain how your business will generate revenue"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                label="Competition"
                name="competition"
                value={formData.competition}
                onChange={handleChange}
                variant="outlined"
                helperText="Analyze your competitors and your competitive advantage"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Implementation Plan"
                name="implementation_plan"
                value={formData.implementation_plan}
                onChange={handleChange}
                variant="outlined"
                helperText="Outline the steps needed to implement your business plan"
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end">
                <Button
                  type="button"
                  variant="outlined"
                  color="secondary"
                  sx={{ mr: 2 }}
                  onClick={() => router.push('/business-plans')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Business Plan'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Business plan submitted successfully! Redirecting...
        </Alert>
      </Snackbar>
    </div>
  );
}
