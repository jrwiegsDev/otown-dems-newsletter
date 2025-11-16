import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Stack,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import ChangePasswordButton from '../ChangePasswordButton';

const DashboardLayout = ({ currentView, onViewChange, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'newsletter':
        return 'Newsletter Dashboard';
      case 'calendar':
        return 'Calendar Dashboard';
      case 'analytics':
        return 'Analytics Dashboard';
      case 'staff':
        return 'Staff Management';
      default:
        return 'Dashboard';
    }
  };

  return (
    <Box p={5} h="100vh" display="flex" flexDirection="column">
      {/* Header */}
      <Flex justifyContent="space-between" alignItems="center" mb={8} flexShrink={0}>
        <Heading>{getViewTitle()}</Heading>
        <Stack direction="row" spacing={4} alignItems="center">
          {user && <Text>Welcome, {user.username}!</Text>}
          <Button 
            onClick={() => onViewChange('newsletter')}
            colorScheme={currentView === 'newsletter' ? 'blue' : 'gray'}
            variant={currentView === 'newsletter' ? 'solid' : 'outline'}
          >
            Newsletter
          </Button>
          <Button 
            onClick={() => onViewChange('calendar')}
            colorScheme={currentView === 'calendar' ? 'blue' : 'gray'}
            variant={currentView === 'calendar' ? 'solid' : 'outline'}
          >
            Calendar
          </Button>
          <Button 
            onClick={() => onViewChange('analytics')}
            colorScheme={currentView === 'analytics' ? 'blue' : 'gray'}
            variant={currentView === 'analytics' ? 'solid' : 'outline'}
          >
            Analytics
          </Button>
          {user?.role === 'superadmin' && (
            <Button 
              onClick={() => onViewChange('staff')}
              colorScheme={currentView === 'staff' ? 'purple' : 'gray'}
              variant={currentView === 'staff' ? 'solid' : 'outline'}
            >
              Staff
            </Button>
          )}
          <ChangePasswordButton user={user} />
          <IconButton
            onClick={toggleColorMode}
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            aria-label="Toggle dark mode"
          />
          <Button colorScheme="red" onClick={handleLogout}>
            Logout
          </Button>
        </Stack>
      </Flex>

      {/* Main Content Area */}
      <Box flex="1" minH="0" display="flex" flexDirection="column">
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
