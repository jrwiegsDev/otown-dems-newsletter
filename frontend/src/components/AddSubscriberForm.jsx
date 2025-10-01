import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  useToast,
} from '@chakra-ui/react';
import subscriberService from '../services/subscriberService';
import { useAuth } from '../context/AuthContext';

const AddSubscriberForm = ({ onSubscriberAdded }) => {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subscriberService.addSubscriber(
        { firstName, lastName, email },
        user.token
      );
      toast({
        title: 'Success!',
        description: 'Subscriber has been added.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Clear the form and notify the parent component to refetch the list
      setFirstName('');
      setLastName('');
      setEmail('');
      onSubscriberAdded();
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to add subscriber.';
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} mt={4}>
      <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
        <FormControl>
          <FormLabel>First Name</FormLabel>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
          />
        </FormControl>
        <FormControl>
          <FormLabel>Last Name</FormLabel>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
          />
        </FormControl>
        <Button type="submit" colorScheme="blue" alignSelf="flex-end">
          Add
        </Button>
      </Stack>
    </Box>
  );
};

export default AddSubscriberForm;