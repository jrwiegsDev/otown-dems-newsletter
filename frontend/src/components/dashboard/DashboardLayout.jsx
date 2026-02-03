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
  useColorModeValue,
  useToast,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Show,
  Hide,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, HamburgerIcon } from '@chakra-ui/icons';
import ChangePasswordButton from '../ChangePasswordButton';
import api from '../../api/axiosConfig';

const DashboardLayout = ({ currentView, onViewChange, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const [snowfallEnabled, setSnowfallEnabled] = useState(false);
  const [isTogglingSnow, setIsTogglingSnow] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  const handleNavClick = (view) => {
    onViewChange(view);
    onClose();
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      {/* Header - Sticky */}
      <Flex 
        justifyContent="space-between" 
        alignItems="center" 
        p={{ base: 2, md: 5 }}
        pb={{ base: 2, md: 4 }}
        flexShrink={0}
        flexWrap="wrap"
        gap={2}
        position="sticky"
        top={0}
        zIndex={10}
        bg={useColorModeValue('white', 'gray.800')}
        borderBottom="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <Heading fontSize={{ base: 'lg', md: 'xl', lg: '2xl' }}>{getViewTitle()}</Heading>
        
        {/* Desktop Navigation - Hidden on mobile */}
        <Hide below="lg">
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
        </Hide>

        {/* Mobile Navigation - Hamburger + essential buttons */}
        <Show below="lg">
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton
              onClick={toggleColorMode}
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              aria-label="Toggle dark mode"
              size="sm"
            />
            <IconButton
              icon={<HamburgerIcon />}
              onClick={onOpen}
              aria-label="Open menu"
              size="sm"
            />
          </Stack>
        </Show>
      </Flex>

      {/* Mobile Drawer Menu */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            {user && `Welcome, ${user.username}!`}
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={3} align="stretch" mt={4}>
              <Button 
                onClick={() => handleNavClick('newsletter')}
                colorScheme={currentView === 'newsletter' ? 'blue' : 'gray'}
                variant={currentView === 'newsletter' ? 'solid' : 'outline'}
                w="100%"
              >
                Newsletter
              </Button>
              <Button 
                onClick={() => handleNavClick('calendar')}
                colorScheme={currentView === 'calendar' ? 'blue' : 'gray'}
                variant={currentView === 'calendar' ? 'solid' : 'outline'}
                w="100%"
              >
                Calendar
              </Button>
              <Button 
                onClick={() => handleNavClick('analytics')}
                colorScheme={currentView === 'analytics' ? 'blue' : 'gray'}
                variant={currentView === 'analytics' ? 'solid' : 'outline'}
                w="100%"
              >
                Analytics
              </Button>
              {user?.role === 'superadmin' && (
                <Button 
                  onClick={() => handleNavClick('staff')}
                  colorScheme={currentView === 'staff' ? 'purple' : 'gray'}
                  variant={currentView === 'staff' ? 'solid' : 'outline'}
                  w="100%"
                >
                  Staff
                </Button>
              )}
              
              {/* Snowfall Toggle - Superadmin Only */}
              {user?.role === 'superadmin' && (
                <FormControl display="flex" alignItems="center" justifyContent="space-between" py={2}>
                  <FormLabel htmlFor="snowfall-toggle-mobile" mb="0" fontSize="sm">
                    Snowfall Feature
                  </FormLabel>
                  <Switch
                    id="snowfall-toggle-mobile"
                    isChecked={snowfallEnabled}
                    onChange={handleSnowfallToggle}
                    isDisabled={isTogglingSnow}
                    colorScheme="blue"
                  />
                </FormControl>
              )}
              
              <Box pt={4} borderTopWidth="1px">
                <ChangePasswordButton user={user} />
              </Box>
              
              <Button colorScheme="red" onClick={handleLogout} w="100%">
                Logout
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content Area */}
      <Box flex="1" minH="0" display="flex" flexDirection="column" overflow="auto" p={{ base: 2, md: 5 }} pt={{ base: 4, md: 6 }}>
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
