import { useState, useRef } from 'react';
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
  Image,
  IconButton,
  Text,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import LocationAutocomplete from './LocationAutocomplete';

const AddEventForm = ({ onEventAdded }) => {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
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
  const [eventImage, setEventImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

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

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image must be less than 2MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Check file type (allow images and PDFs)
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      if (!isImage && !isPDF) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image or PDF file',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Convert to Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setEventImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setEventImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        eventImage,
        recurrenceType,
        recurrenceEndDate: recurrenceType !== 'none' ? recurrenceEndDate : null,
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
      setEventImage(null);
      setImagePreview(null);
      setRecurrenceType('none');
      setRecurrenceEndDate('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
          <FormLabel>Repeat Event</FormLabel>
          <Select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value)}>
            <option value="none">Does not repeat</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
          </Select>
        </FormControl>

        {recurrenceType !== 'none' && (
          <FormControl isRequired>
            <FormLabel>Repeat Until</FormLabel>
            <Input
              type="date"
              value={recurrenceEndDate}
              onChange={(e) => setRecurrenceEndDate(e.target.value)}
              min={eventDate}
            />
            <Text fontSize="sm" color="gray.500" mt={1}>
              Event will repeat {recurrenceType === 'weekly' ? 'every week' : recurrenceType === 'biweekly' ? 'every 2 weeks' : 'every month'} until this date.
            </Text>
          </FormControl>
        )}
        
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
          <FormLabel>Event Description (max 500 characters)</FormLabel>
          <Textarea
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="Brief description of the event"
            maxLength={500}
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

        <FormControl>
          <FormLabel>Event Flyer/Image (optional)</FormLabel>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            onChange={handleImageChange}
            sx={{
              '::file-selector-button': {
                height: '40px',
                padding: '0 16px',
                marginRight: '16px',
                background: 'gray.600',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
              }
            }}
          />
          <Text fontSize="sm" color="gray.500" mt={1}>
            Max 2MB. Accepts images (JPG, PNG) or single-page PDF flyers.
          </Text>
          {imagePreview && (
            <Box position="relative" mt={3} maxW="300px">
              {imagePreview.startsWith('data:application/pdf') ? (
                <Box
                  p={4}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.600"
                  bg="gray.700"
                  textAlign="center"
                >
                  <Text fontSize="sm" color="gray.300">PDF Flyer Selected</Text>
                  <Text fontSize="xs" color="gray.500" mt={1}>Will be displayed to visitors</Text>
                </Box>
              ) : (
                <Image
                  src={imagePreview}
                  alt="Event preview"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.600"
                />
              )}
              <IconButton
                aria-label="Remove file"
                icon={<CloseIcon />}
                size="sm"
                colorScheme="red"
                position="absolute"
                top={2}
                right={2}
                onClick={handleRemoveImage}
              />
            </Box>
          )}
        </FormControl>

        <Button type="submit" colorScheme="blue" isLoading={isLoading} alignSelf="stretch">
          Add Event
        </Button>
      </VStack>
    </Box>
  );
};

export default AddEventForm;