import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Stack,
  Switch,
  Text,
  FormControl,
  FormLabel,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import ChangePasswordButton from '../ChangePasswordButton';
import api from '../../api/axiosConfig';

const DashboardLayout = ({ currentView, onViewChange, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const [snowfallEnabled, setSnowfallEnabled] = useState(false);
  const [isTogglingSnow, setIsTogglingSnow] = useState(false);

  // Fetch initial snowfall status
  useEffect(() => {
    const fetchSnowfallStatus = async () => {
      try {
        const response = await api.get('/api/config/snowfall');
        setSnowfallEnabled(response.data.snowfallEnabled);
      } catch (error) {
        console.error('Error fetching snowfall status:', error);
      }
    };
    
    if (user?.role === 'superadmin') {
      fetchSnowfallStatus();
    }
  }, [user]);

  // Handle snowfall toggle
  const handleSnowfallToggle = async () => {
    setIsTogglingSnow(true);
    try {
      const response = await api.post('/api/config/snowfall', {
        snowfallEnabled: !snowfallEnabled
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      
      setSnowfallEnabled(response.data.snowfallEnabled);
      toast({
        title: response.data.snowfallEnabled ? 'Snowfall Enabled' : 'Snowfall Disabled',
        description: response.data.snowfallEnabled 
          ? 'The "Let It Snow!" button is now visible on the public site' 
          : 'The "Let It Snow!" button has been hidden from the public site',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error toggling snowfall:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to toggle snowfall feature',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsTogglingSnow(false);
    }
  };

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
          
          {/* Snowfall Toggle - Superadmin Only */}
          {user?.role === 'superadmin' && (
            <FormControl display="flex" alignItems="center" width="auto">
              <FormLabel htmlFor="snowfall-toggle" mb="0" mr={2} fontSize="sm">
                Snowfall
              </FormLabel>
              <Switch
                id="snowfall-toggle"
                isChecked={snowfallEnabled}
                onChange={handleSnowfallToggle}
                isDisabled={isTogglingSnow}
                colorScheme="blue"
              />
            </FormControl>
          )}
          
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
