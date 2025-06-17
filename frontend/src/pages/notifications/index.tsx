import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Button,
  Paper,
  Tabs,
  Tab,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  ThumbUp as ThumbUpIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkEmailReadIcon,
  MarkEmailUnread as MarkEmailUnreadIcon,
} from '@mui/icons-material';

// Mock data for notifications
const mockNotifications = [
  {
    id: 1,
    title: 'New Vote',
    message: 'Kenji Tanaka voted for your business plan: AI-Powered Customer Service Platform',
    is_read: false,
    notification_type: 'vote',
    related_id: 1,
    created_at: '2023-04-20T10:30:00Z',
  },
  {
    id: 2,
    title: 'Business Plan Selected',
    message: 'Your business plan \'AI-Powered Customer Service Platform\' has been selected for the next phase!',
    is_read: true,
    notification_type: 'selection',
    related_id: 1,
    created_at: '2023-05-01T14:20:00Z',
  },
  {
    id: 3,
    title: 'New Team Member',
    message: 'Satoshi Ito joined your PoC team for: AI Customer Service Implementation',
    is_read: false,
    notification_type: 'team_join',
    related_id: 1,
    created_at: '2023-07-12T09:15:00Z',
  },
  {
    id: 4,
    title: 'New Vote',
    message: 'Yuki Nakamura voted for your business plan: AI-Powered Customer Service Platform',
    is_read: true,
    notification_type: 'vote',
    related_id: 1,
    created_at: '2023-04-18T11:45:00Z',
  },
];

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  notification_type: string;
  related_id: number;
  created_at: string;
}

export default function Notifications() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      fetchNotifications();
    }
  }, [router]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_read: true })
      });
      
      if (response.ok) {
        const updatedNotification = await response.json();
        setNotifications(
          notifications.map((notification) =>
            notification.id === id ? updatedNotification : notification
          )
        );
      } else {
        console.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAsUnread = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_read: false })
      });
      
      if (response.ok) {
        const updatedNotification = await response.json();
        setNotifications(
          notifications.map((notification) =>
            notification.id === id ? updatedNotification : notification
          )
        );
      } else {
        console.error('Failed to mark notification as unread');
      }
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications(notifications.filter((notification) => notification.id !== id));
      } else {
        console.error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const updatedNotifications = await response.json();
        setNotifications(updatedNotifications);
      } else {
        console.error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications([]);
      } else {
        console.error('Failed to delete all notifications');
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (tabValue === 0) return true; // All
    if (tabValue === 1) return !notification.is_read; // Unread
    if (tabValue === 2) return notification.is_read; // Read
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'vote':
        return <ThumbUpIcon color="primary" />;
      case 'team_join':
      case 'team_leave':
      case 'team_remove':
        return <GroupIcon color="secondary" />;
      case 'selection':
        return <CheckCircleIcon color="success" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const getRelatedLink = (notification: Notification) => {
    switch (notification.notification_type) {
      case 'vote':
      case 'selection':
        return `/business-plans/${notification.related_id}`;
      case 'team_join':
      case 'team_leave':
      case 'team_remove':
        return `/poc-plans/${notification.related_id}`;
      default:
        return '#';
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" className="page-title">
          Notifications
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<MarkEmailReadIcon />}
            onClick={handleMarkAllAsRead}
            sx={{ mr: 1 }}
            disabled={!notifications.some((n) => !n.is_read)}
          >
            Mark All as Read
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteAll}
            disabled={notifications.length === 0}
          >
            Delete All
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="notification tabs">
          <Tab label="All" />
          <Tab 
            label={
              <Badge 
                badgeContent={notifications.filter(n => !n.is_read).length} 
                color="error"
                showZero={false}
              >
                Unread
              </Badge>
            } 
          />
          <Tab label="Read" />
        </Tabs>
      </Paper>

      {filteredNotifications.length > 0 ? (
        <Paper>
          <List>
            {filteredNotifications.map((notification, index) => (
              <div key={notification.id}>
                <ListItem
                  button
                  onClick={() => router.push(getRelatedLink(notification))}
                  sx={{
                    backgroundColor: notification.is_read ? 'inherit' : 'rgba(25, 118, 210, 0.08)',
                  }}
                >
                  <ListItemIcon>{getNotificationIcon(notification.notification_type)}</ListItemIcon>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {notification.message}
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption" color="text.secondary">
                          {new Date(notification.created_at).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    {notification.is_read ? (
                      <Tooltip title="Mark as unread">
                        <IconButton edge="end" onClick={() => handleMarkAsUnread(notification.id)}>
                          <MarkEmailUnreadIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Mark as read">
                        <IconButton edge="end" onClick={() => handleMarkAsRead(notification.id)}>
                          <MarkEmailReadIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton edge="end" onClick={() => handleDelete(notification.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider />}
              </div>
            ))}
          </List>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No notifications found
          </Typography>
        </Paper>
      )}
    </div>
  );
}
