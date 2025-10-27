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

const DashboardLayout = ({ currentView, onViewChange, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getViewTitle = () => {
    return currentView === 'newsletter' ? 'Newsletter Dashboard' : 'Calendar Dashboard';
  };

  const getViewButtonText = () => {
    return currentView === 'newsletter' ? 'Calendar' : 'Newsletter';
  };

  return (
    <Box p={5} h="100vh" display="flex" flexDirection="column">
      {/* Header */}
      <Flex justifyContent="space-between" alignItems="center" mb={8} flexShrink={0}>
        <Heading>{getViewTitle()}</Heading>
        <Stack direction="row" spacing={4} alignItems="center">
          {user && <Text>Welcome, {user.username}!</Text>}
          <Button onClick={onViewChange}>
            Switch to {getViewButtonText()} View
          </Button>
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
