import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- Import for redirection
import { useAuth } from '../context/AuthContext'; // <-- Import our custom hook
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  VStack,
  useToast,
} from '@chakra-ui/react';
import authService from '../services/authService';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth(); // <-- Get the login function from context
  const navigate = useNavigate(); // <-- Hook for redirection
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await authService.login({ username, password });
      login(userData); // <-- Use context's login function
      toast({
        title: 'Login Successful.',
        description: `Welcome, ${userData.username}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/'); // <-- Redirect to the dashboard
    } catch (error) {
      // ... (error handling remains the same)
      const message =
        error.response?.data?.message || 'An error occurred during login.';
      toast({
        title: 'Login Failed.',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // ... (the return JSX remains the same)
  return (
    <Flex width="100vw" height="100vh" align="center" justify="center">
      <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg">
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <Heading>Admin Login</Heading>
            <FormControl isRequired>
              <FormLabel>Username</FormLabel>
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>
            <Button type="submit" colorScheme="blue" width="full" mt={4}>
              Login
            </Button>
          </VStack>
        </form>
      </Box>
    </Flex>
  );
};

export default LoginPage;