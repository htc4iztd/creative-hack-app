// src/components/Layout.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Container,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Code as CodeIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

  // 通知件数を取得
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/notifications/unread-count', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const count = await res.json();
          setNotificationCount(count);
        } else {
          console.error('Failed to fetch notification count');
        }
      } catch (err) {
        console.error('Error fetching notification count:', err);
      }
    };

    fetchNotificationCount();
  }, []);

  const handleProfileMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleNotificationMenuOpen = (e: React.MouseEvent<HTMLElement>) => setNotificationAnchorEl(e.currentTarget);
  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationAnchorEl(null);
  };
  const handleDrawerToggle = () => setDrawerOpen(prev => !prev);
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  // ログイン・登録ページではレイアウト不要
  if (['/login', '/register'].includes(router.pathname)) {
    return <>{children}</>;
  }

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6">Creative.hack</Typography>
      </Toolbar>
      <Divider />
      <List>
        <Link href="/" passHref>
          <ListItem button component="a">
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
        </Link>
        <Link href="/business-plans" passHref>
          <ListItem button component="a">
            <ListItemIcon><DescriptionIcon /></ListItemIcon>
            <ListItemText primary="Business Plans" />
          </ListItem>
        </Link>
        <Link href="/poc-plans" passHref>
          <ListItem button component="a">
            <ListItemIcon><CodeIcon /></ListItemIcon>
            <ListItemText primary="PoC Plans" />
          </ListItem>
        </Link>
      </List>
    </div>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Creative.hack
          </Typography>
          <IconButton color="inherit" onClick={handleNotificationMenuOpen}>
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton edge="end" onClick={handleProfileMenuOpen} color="inherit">
            <AccountCircleIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* プロフィールメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => router.push('/profile')}>Profile</MenuItem>
        <MenuItem onClick={handleLogout}>
          <ExitToAppIcon fontSize="small" sx={{ mr: 1 }} /> Logout
        </MenuItem>
      </Menu>

      {/* 通知メニュー */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => router.push('/notifications')}>
          View All Notifications
        </MenuItem>
      </Menu>

      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: 240 } }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          pt: { xs: 8, sm: 9 },
          minHeight: '100vh',
        }}
      >
        <Container maxWidth="lg">{children}</Container>
      </Box>
    </>
  );
};

export default Layout;