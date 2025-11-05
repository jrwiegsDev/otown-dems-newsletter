import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  Select,
  Checkbox,
  useToast,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import LocationAutocomplete from './LocationAutocomplete';

const AddEventForm = ({ onEventAdded }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [startHour, setStartHour] = useState('9');
  const [startMinute, setStartMinute] = useState('00');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');
  const [endPeriod, setEndPeriod] = useState('AM');
  const [eventLocation, setEventLocation] = useState('');
  const [eventCoordinates, setEventCoordinates] = useState({ lat: null, lng: null });
  const [eventDescription, setEventDescription] = useState('');
  const [eventLink, setEventLink] = useState('');
  const [eventLinkText, setEventLinkText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Generate options for dropdowns
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = ['00', '15', '30', '45'];
  const periods = ['AM', 'PM'];

  const handleLocationChange = (locationData) => {
    setEventLocation(locationData.address);
    if (locationData.lat && locationData.lng) {
      setEventCoordinates({ lat: locationData.lat, lng: locationData.lng });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const eventData = {
        eventName,
        eventDate,
        eventLocation,
        eventCoordinates,
        eventDescription,
        eventLink,
        eventLinkText,
        isAllDay,
      };

      // Only add time fields if not all-day event
      if (!isAllDay) {
        eventData.startTime = `${startHour}:${startMinute} ${startPeriod}`;
        eventData.endTime = `${endHour}:${endMinute} ${endPeriod}`;
      }

      await eventService.createEvent(eventData, user.token);
      
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
      setIsAllDay(false);
      setStartHour('9');
      setStartMinute('00');
      setStartPeriod('AM');
      setEndHour('10');
      setEndMinute('00');
      setEndPeriod('AM');
      setEventLocation('');
      setEventCoordinates({ lat: null, lng: null });
      setEventDescription('');
      setEventLink('');
      setEventLinkText('');
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
          <Checkbox 
            isChecked={isAllDay} 
            onChange={(e) => setIsAllDay(e.target.checked)}
          >
            All-Day Event
          </Checkbox>
        </FormControl>

        {!isAllDay && (
          <>
            <FormControl isRequired>
              <FormLabel>Start Time</FormLabel>
              <HStack>
                <Select value={startHour} onChange={(e) => setStartHour(e.target.value)}>
                  {hours.map(hour => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </Select>
                <Select value={startMinute} onChange={(e) => setStartMinute(e.target.value)}>
                  {minutes.map(min => (
                    <option key={min} value={min}>{min}</option>
                  ))}
                </Select>
                <Select value={startPeriod} onChange={(e) => setStartPeriod(e.target.value)}>
                  {periods.map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </Select>
              </HStack>
            </FormControl>

            <FormControl>
              <FormLabel>End Time</FormLabel>
              <HStack>
                <Select value={endHour} onChange={(e) => setEndHour(e.target.value)}>
                  {hours.map(hour => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </Select>
                <Select value={endMinute} onChange={(e) => setEndMinute(e.target.value)}>
                  {minutes.map(min => (
                    <option key={min} value={min}>{min}</option>
                  ))}
                </Select>
                <Select value={endPeriod} onChange={(e) => setEndPeriod(e.target.value)}>
                  {periods.map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </Select>
              </HStack>
            </FormControl>
          </>
        )}

        <FormControl isRequired>
          <FormLabel>Location</FormLabel>
          <LocationAutocomplete
            value={eventLocation}
            onChange={handleLocationChange}
            isRequired={true}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Event Description (max 300 characters)</FormLabel>
          <Textarea
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="Brief description of the event"
            maxLength={300}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Event Link (optional)</FormLabel>
          <Input
            type="url"
            value={eventLink}
            onChange={(e) => setEventLink(e.target.value)}
            placeholder="https://eventbrite.com/..."
          />
        </FormControl>
        <FormControl>
          <FormLabel>Link Button Text (optional)</FormLabel>
          <Input
            value={eventLinkText}
            onChange={(e) => setEventLinkText(e.target.value)}
            placeholder="Buy Tickets"
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