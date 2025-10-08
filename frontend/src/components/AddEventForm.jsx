import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';

const AddEventForm = ({ onEventAdded }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await eventService.createEvent(
        { eventName, eventDate, eventTime, eventDescription },
        user.token
      );
      toast({
        title: 'Success!',
        description: 'Event has been created.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Clear the form and notify the parent to refetch
      setEventName('');
      setEventDate('');
      setEventTime('');
      setEventDescription('');
      onEventAdded();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create event.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} mt={4}>
      <VStack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Event Name</FormLabel>
          <Input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Event Date</FormLabel>
          <Input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Event Time</FormLabel>
          <Input
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            placeholder="e.g., 9:00 AM - 10:30 AM"
          />
        </FormControl>
        <FormControl>
          <FormLabel>Description / Location</FormLabel>
          <Textarea
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="e.g., O'Fallon City Hall"
          />
        </FormControl>
        <Button type="submit" colorScheme="blue" isLoading={isLoading} alignSelf="stretch">
          Add Event
        </Button>
      </VStack>
    </Box>
  );
};

export default AddEventForm;