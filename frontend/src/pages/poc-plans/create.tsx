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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

// Mock data for business plans
const mockBusinessPlans = [
  {
    id: 1,
    title: 'AI-Powered Customer Service Platform',
  },
  {
    id: 2,
    title: 'IoT Smart Office Solution',
  },
  {
    id: 3,
    title: 'Blockchain-based Supply Chain Tracking',
  },
  {
    id: 4,
    title: 'AR Training Platform for Field Workers',
  },
];

interface PoCPlanFormData {
  title: string;
  description: string;
  technical_requirements: string;
  implementation_approach: string;
  timeline: string;
  resources_needed: string;
  expected_outcomes: string;
  business_plan_id: number | null;
  is_technical_only: boolean;
}

export default function CreatePoCPlan() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<PoCPlanFormData>({
    title: '',
    description: '',
    technical_requirements: '',
    implementation_approach: '',
    timeline: '',
    resources_needed: '',
    expected_outcomes: '',
    business_plan_id: null,
    is_technical_only: false,
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

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
      // If technical only is checked, clear business plan id
      ...(name === 'is_technical_only' && checked ? { business_plan_id: null } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/poc-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit PoC plan');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/poc-plans');
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
        Submit New PoC Plan
      </Typography>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_technical_only}
                    onChange={handleCheckboxChange}
                    name="is_technical_only"
                    color="primary"
                  />
                }
                label="This is a technical-only project (not based on any business plan)"
              />
            </Grid>

            {!formData.is_technical_only && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="business-plan-label">Related Business Plan</InputLabel>
                  <Select
                    labelId="business-plan-label"
                    id="business_plan_id"
                    name="business_plan_id"
                    value={formData.business_plan_id || ''}
                    onChange={handleSelectChange}
                    label="Related Business Plan"
                    disabled={formData.is_technical_only}
                  >
                    <MenuItem value="">
                      <em>Select a business plan</em>
                    </MenuItem>
                    {mockBusinessPlans.map((plan) => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {plan.title}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select the business plan this PoC is related to</FormHelperText>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                variant="outlined"
                helperText="A concise and descriptive title for your PoC plan"
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
                helperText="A detailed description of your PoC project"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                label="Technical Requirements"
                name="technical_requirements"
                value={formData.technical_requirements}
                onChange={handleChange}
                variant="outlined"
                helperText="List the technical skills, tools, and technologies required for this PoC"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Implementation Approach"
                name="implementation_approach"
                value={formData.implementation_approach}
                onChange={handleChange}
                variant="outlined"
                helperText="Describe your approach to implementing this PoC"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                label="Timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleChange}
                variant="outlined"
                helperText="Outline the timeline for completing this PoC"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                label="Resources Needed"
                name="resources_needed"
                value={formData.resources_needed}
                onChange={handleChange}
                variant="outlined"
                helperText="Describe the resources needed for this PoC (e.g., team members, hardware, software)"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                label="Expected Outcomes"
                name="expected_outcomes"
                value={formData.expected_outcomes}
                onChange={handleChange}
                variant="outlined"
                helperText="Describe the expected outcomes and success criteria for this PoC"
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end">
                <Button
                  type="button"
                  variant="outlined"
                  color="secondary"
                  sx={{ mr: 2 }}
                  onClick={() => router.push('/poc-plans')}
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
                  {isSubmitting ? 'Submitting...' : 'Submit PoC Plan'}
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
          PoC plan submitted successfully! Redirecting...
        </Alert>
      </Snackbar>
    </div>
  );
}
