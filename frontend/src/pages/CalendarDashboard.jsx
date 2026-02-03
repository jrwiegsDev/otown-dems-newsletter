import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Text,
  Grid,
  GridItem,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Stack,
  VStack,
  Textarea,
  Divider,
  Checkbox,
  Input,
  Image,
  useToast,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, CloseIcon } from '@chakra-ui/icons';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import '../components/FullCalendar.css';
import AddEventForm from '../components/AddEventForm';
import ManageAnnouncements from '../components/ManageAnnouncements';
import LocationAutocomplete from '../components/LocationAutocomplete';

const CalendarDashboard = ({
  events,
  isLoadingEvents,
  fetchEvents,
  deleteEvent,
  updateEvent,
  toggleBannerEvent,
  isEventPast,
  getEventsForDate,
  announcements,
  isLoadingAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
}) => {
  const cancelRef = useRef();
  const editEventImageRef = useRef(null);
  const toast = useToast();
  const [isEventDeleteAlertOpen, setIsEventDeleteAlertOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const { isOpen: isEventEditModalOpen, onOpen: onEventEditModalOpen, onClose: onEventEditModalClose } = useDisclosure();
  const { isOpen: isMultiEventModalOpen, onOpen: onMultiEventModalOpen, onClose: onMultiEventModalClose } = useDisclosure();
  const [eventToEdit, setEventToEdit] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [editEventImagePreview, setEditEventImagePreview] = useState(null);
  const [editEventFormData, setEditEventFormData] = useState({
    eventName: '',
    eventDate: '',
    isAllDay: false,
    startHour: '9',
    startMinute: '00',
    startPeriod: 'AM',
    endHour: '10',
    endMinute: '00',
    endPeriod: 'AM',
    eventLocation: '',
    eventCoordinates: { lat: null, lng: null },
    eventDescription: '',
    eventLink: '',
    eventLinkText: '',
    eventImage: null,
    recurrenceType: 'none',
    recurrenceEndDate: ''
  });

  // Generate options for dropdowns
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = ['00', '15', '30', '45'];
  const periods = ['AM', 'PM'];

  // Helper function to expand recurring events for calendar display
  const expandRecurringEvents = (events) => {
    const expandedEvents = [];
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);

    for (const event of events) {
      if (event.recurrenceType && event.recurrenceType !== 'none') {
        const startDate = new Date(event.eventDate);
        const endDate = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : maxDate;
        
        let intervalDays;
        switch (event.recurrenceType) {
          case 'weekly':
            intervalDays = 7;
            break;
          case 'biweekly':
            intervalDays = 14;
            break;
          case 'monthly':
            intervalDays = null;
            break;
          default:
            intervalDays = 7;
        }

        let currentDate = new Date(startDate);
        let instanceIndex = 0;

        while (currentDate <= endDate && currentDate <= maxDate) {
          const instance = {
            ...event,
            _id: instanceIndex === 0 ? event._id : `${event._id}_${instanceIndex}`,
            eventDate: new Date(currentDate).toISOString(),
            isRecurringInstance: instanceIndex > 0,
            originalEventId: event._id
          };
          expandedEvents.push(instance);

          if (intervalDays) {
            currentDate = new Date(currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
          } else {
            currentDate = new Date(currentDate);
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
          instanceIndex++;
        }
      } else {
        expandedEvents.push(event);
      }
    }

    return expandedEvents.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
  };

  // Expanded events for calendar display
  const calendarEvents = expandRecurringEvents(events);

  // Helper function to format time display (handles both old and new formats)
  const formatEventTime = (event) => {
    if (event.isAllDay) {
      return 'All Day';
    }
    if (event.startTime && event.endTime) {
      return `${event.startTime} - ${event.endTime}`;
    }
    if (event.eventTime) {
      return event.eventTime; // Legacy format
    }
    return 'Time TBD';
  };

  const handleBannerToggle = async (event) => {
    await toggleBannerEvent(event);
  };

  const openEventDeleteAlert = (event) => {
    setEventToDelete(event);
    setIsEventDeleteAlertOpen(true);
  };

  const closeEventDeleteAlert = () => setIsEventDeleteAlertOpen(false);

  const handleEventDeleteConfirm = async () => {
    const success = await deleteEvent(eventToDelete._id);
    if (success) {
      closeEventDeleteAlert();
    }
  };

  const openEventEditModal = (event) => {
    setEventToEdit(event);
    
    // Parse time fields - handle both old and new formats
    let startHour = '9', startMinute = '00', startPeriod = 'AM';
    let endHour = '10', endMinute = '00', endPeriod = 'AM';
    
    if (event.startTime) {
      // New format: "9:00 AM"
      const match = event.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        startHour = match[1];
        startMinute = match[2];
        startPeriod = match[3].toUpperCase();
      }
    }
    
    if (event.endTime) {
      // New format: "10:00 AM"
      const match = event.endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        endHour = match[1];
        endMinute = match[2];
        endPeriod = match[3].toUpperCase();
      }
    }
    
    setEditEventFormData({
      eventName: event.eventName,
      eventDate: new Date(event.eventDate).toISOString().split('T')[0],
      isAllDay: event.isAllDay || false,
      startHour,
      startMinute,
      startPeriod,
      endHour,
      endMinute,
      endPeriod,
      eventLocation: event.eventLocation || '',
      eventCoordinates: event.eventCoordinates || { lat: null, lng: null },
      eventDescription: event.eventDescription || '',
      eventLink: event.eventLink || '',
      eventLinkText: event.eventLinkText || 'Learn More',
      eventImage: event.eventImage || null,
      recurrenceType: event.recurrenceType || 'none',
      recurrenceEndDate: event.recurrenceEndDate ? new Date(event.recurrenceEndDate).toISOString().split('T')[0] : '',
    });
    setEditEventImagePreview(event.eventImage || null);
    onEventEditModalOpen();
  };

  const handleLocationChange = (locationData) => {
    setEditEventFormData({
      ...editEventFormData,
      eventLocation: locationData.address,
      eventCoordinates: locationData.lat && locationData.lng 
        ? { lat: locationData.lat, lng: locationData.lng }
        : { lat: null, lng: null }
    });
  };

  const handleEventEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditEventFormData({ 
      ...editEventFormData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  // Handle image file selection for edit event modal
  const handleEditEventImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'File must be less than 2MB',
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditEventFormData({
          ...editEventFormData,
          eventImage: reader.result
        });
        setEditEventImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image from edit event modal
  const handleRemoveEditEventImage = () => {
    setEditEventFormData({
      ...editEventFormData,
      eventImage: null
    });
    setEditEventImagePreview(null);
    if (editEventImageRef.current) {
      editEventImageRef.current.value = '';
    }
  };

  const handleEventEditSubmit = async () => {
    const updatedData = {
      eventName: editEventFormData.eventName,
      eventDate: editEventFormData.eventDate,
      eventLocation: editEventFormData.eventLocation,
      eventCoordinates: editEventFormData.eventCoordinates,
      eventDescription: editEventFormData.eventDescription,
      eventLink: editEventFormData.eventLink,
      eventLinkText: editEventFormData.eventLinkText,
      isAllDay: editEventFormData.isAllDay,
      eventImage: editEventFormData.eventImage,
      recurrenceType: editEventFormData.recurrenceType,
      recurrenceEndDate: editEventFormData.recurrenceType !== 'none' ? editEventFormData.recurrenceEndDate : null,
    };

    // Only add time fields if not all-day event
    if (!editEventFormData.isAllDay) {
      updatedData.startTime = `${editEventFormData.startHour}:${editEventFormData.startMinute} ${editEventFormData.startPeriod}`;
      updatedData.endTime = `${editEventFormData.endHour}:${editEventFormData.endMinute} ${editEventFormData.endPeriod}`;
    }

    const result = await updateEvent(eventToEdit._id, updatedData);
    if (result) {
      onEventEditModalClose();
    }
  };

  return (
    <>
      {/* 2x2 Grid Layout for Calendar Dashboard - Stacks on mobile */}
      <Grid 
        templateAreas={{
          base: `"calendar" "management" "events" "announcement"`,
          lg: `"calendar management" "events announcement"`
        }}
        gridTemplateColumns={{ base: '1fr', lg: '1fr 1fr' }}
        gridTemplateRows={'auto'}
        gap={{ base: 4, md: 8 }}
      >
        {/* TOP LEFT: Calendar */}
        <GridItem area="calendar" display="flex" flexDirection="column">
          <Box p={{ base: 3, md: 5 }} shadow="md" borderWidth="1px" borderRadius="md" display="flex" flexDirection="column" h={{ base: 'auto', lg: '700px' }} minH="400px">
            <Heading fontSize={{ base: 'lg', md: 'xl' }} flexShrink={0} mb={4}>Calendar View</Heading>
            <Box flexGrow={1} overflow="hidden">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={calendarEvents.map(event => ({
                  id: event._id,
                  title: event.eventName,
                  date: event.eventDate.slice(0, 10),
                  backgroundColor: event.isBannerEvent ? 'var(--chakra-colors-yellow-500)' : event.isRecurringInstance ? 'var(--chakra-colors-purple-500)' : 'var(--chakra-colors-blue-500)',
                  borderColor: event.isBannerEvent ? 'var(--chakra-colors-yellow-600)' : event.isRecurringInstance ? 'var(--chakra-colors-purple-600)' : 'var(--chakra-colors-blue-600)',
                  classNames: event.isBannerEvent ? ['banner-event'] : [],
                  extendedProps: {
                    description: event.eventDescription,
                    time: event.eventTime,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    isAllDay: event.isAllDay,
                    location: event.eventLocation,
                    coordinates: event.eventCoordinates,
                    link: event.eventLink,
                    linkText: event.eventLinkText,
                    isBannerEvent: event.isBannerEvent,
                    fullEvent: event
                  }
                }))}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,dayGridWeek'
                }}
                eventClick={(clickInfo) => {
                  const event = clickInfo.event.extendedProps.fullEvent;
                  openEventEditModal(event);
                }}
                dayMaxEventRows={true}
                dayMaxEvents={(arg) => {
                  // Count events for this day
                  const dateStr = arg.date.toISOString().split('T')[0];
                  const eventsOnThisDay = events.filter(event => 
                    event.eventDate.slice(0, 10) === dateStr
                  ).length;
                  // If only 1 event, show it; if 2+, show 0 (only the "X Events" link)
                  return eventsOnThisDay === 1 ? true : 0;
                }}
                moreLinkClick={(info) => {
                  // Get all events from the segments that were passed
                  const eventsOnDate = info.allSegs.map(seg => seg.event.extendedProps.fullEvent);
                  setSelectedDateEvents(eventsOnDate);
                  onMultiEventModalOpen();
                  info.jsEvent.preventDefault();
                  return 'none'; // Prevents the default popover
                }}
                moreLinkContent={(args) => {
                  // info.allSegs contains ALL events for that day (both shown and hidden)
                  // We want to show the total count from allSegs, not args.num
                  const totalEvents = args.allSegs ? args.allSegs.length : args.num;
                  return `${totalEvents} Event${totalEvents !== 1 ? 's' : ''}`;
                }}
                eventDisplay="block"
                height="100%"
              />
            </Box>
          </Box>
        </GridItem>

        {/* TOP RIGHT: Event Management (Create Event) */}
        <GridItem area="management" display="flex" flexDirection="column">
          <Box p={{ base: 3, md: 5 }} shadow="md" borderWidth="1px" borderRadius="md" display="flex" flexDirection="column" h={{ base: 'auto', lg: '700px' }}>
            <Heading fontSize={{ base: 'lg', md: 'xl' }} flexShrink={0} mb={4}>Event Management</Heading>
            <Box flex="1" overflowY="auto" pr={2}>
              <AddEventForm onEventAdded={fetchEvents} />
            </Box>
          </Box>
        </GridItem>

        {/* BOTTOM LEFT: Current Events List */}
        <GridItem area="events" display="flex" flexDirection="column">
          <Box p={{ base: 3, md: 5 }} shadow="md" borderWidth="1px" borderRadius="md" display="flex" flexDirection="column" minH={{ base: '300px', md: '500px' }} maxH={{ base: '400px', md: '500px' }}>
            <Heading fontSize={{ base: 'md', md: 'lg' }} flexShrink={0} mb={4}>Current Events</Heading>
            {isLoadingEvents ? (
              <Spinner />
            ) : (
              <VStack spacing={4} align="stretch" overflowY="auto" flex="1" pr={2}>
                {events
                  .filter(event => {
                    // Only show events from current month onwards
                    const now = new Date();
                    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const eventDate = new Date(event.eventDate);
                    return eventDate >= currentMonth;
                  })
                  .map((event) => (
                  <Box key={event._id} p={4} borderWidth="1px" borderRadius="md">
                    <Flex justifyContent="space-between" alignItems="flex-start">
                      <Box flex="1">
                        <Heading fontSize="md">
                          {event.eventName}
                          {event.recurrenceType && event.recurrenceType !== 'none' && (
                            <Text as="span" fontSize="xs" ml={2} color="purple.400" fontWeight="normal">
                              🔁 {event.recurrenceType === 'weekly' ? 'Weekly' : event.recurrenceType === 'biweekly' ? 'Biweekly' : 'Monthly'}
                            </Text>
                          )}
                        </Heading>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(event.eventDate).toLocaleDateString('en-US', { timeZone: 'UTC' })} at {formatEventTime(event)}
                          {event.recurrenceType && event.recurrenceType !== 'none' && event.recurrenceEndDate && (
                            <Text as="span" color="gray.600"> → {new Date(event.recurrenceEndDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}</Text>
                          )}
                        </Text>
                        <Text mt={2}>{event.eventDescription}</Text>
                      </Box>
                      <Flex direction="column" alignItems="flex-end" gap={2}>
                        <Flex alignItems="center" gap={2}>
                          <Text fontSize="sm" whiteSpace="nowrap">Banner Event?</Text>
                          <Checkbox 
                            isChecked={event.isBannerEvent || false}
                            onChange={() => handleBannerToggle(event)}
                            isDisabled={isEventPast(event.eventDate)}
                            colorScheme="blue"
                          />
                        </Flex>
                        <Stack direction="row">
                          <IconButton icon={<EditIcon />} size="sm" colorScheme="yellow" onClick={() => openEventEditModal(event)} />
                          <IconButton icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={() => openEventDeleteAlert(event)} />
                        </Stack>
                      </Flex>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        </GridItem>

        {/* BOTTOM RIGHT: Manage Announcements */}
        <GridItem area="announcement" display="flex" flexDirection="column">
          <Box display="flex" flexDirection="column" minH={{ base: '300px', md: '500px' }}>
            <ManageAnnouncements
              announcements={announcements}
              isLoadingAnnouncements={isLoadingAnnouncements}
              createAnnouncement={createAnnouncement}
              updateAnnouncement={updateAnnouncement}
              deleteAnnouncement={deleteAnnouncement}
            />
          </Box>
        </GridItem>
      </Grid>

      {/* Event Delete Alert */}
      <AlertDialog isOpen={isEventDeleteAlertOpen} leastDestructiveRef={cancelRef} onClose={closeEventDeleteAlert}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Delete Event</AlertDialogHeader>
            <AlertDialogBody>Are you sure you want to delete "{eventToDelete?.eventName}"?</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeEventDeleteAlert}>Cancel</Button>
              <Button colorScheme="red" onClick={handleEventDeleteConfirm} ml={3}>Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Multi-Event Selection Modal */}
      <Modal isOpen={isMultiEventModalOpen} onClose={onMultiEventModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Events on {selectedDateEvents.length > 0 && new Date(selectedDateEvents[0].eventDate).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={3} align="stretch">
              {selectedDateEvents.map((event) => (
                <Box
                  key={event._id}
                  p={4}
                  borderWidth="2px"
                  borderRadius="md"
                  borderColor={event.isBannerEvent ? 'yellow.400' : 'blue.400'}
                  cursor="pointer"
                  _hover={{ bg: 'gray.50', transform: 'translateY(-2px)', shadow: 'md' }}
                  transition="all 0.2s"
                  onClick={() => {
                    onMultiEventModalClose();
                    openEventEditModal(event);
                  }}
                >
                  <Flex alignItems="center" justifyContent="space-between">
                    <Box flex="1">
                      <Heading fontSize="md" mb={1}>
                        {event.eventName}
                        {event.isBannerEvent && (
                          <Text as="span" ml={2} fontSize="xs" color="yellow.600" fontWeight="bold">
                            ⭐ BANNER
                          </Text>
                        )}
                      </Heading>
                      <Text fontSize="sm" color="gray.600">
                        {formatEventTime(event)}
                      </Text>
                      {event.eventDescription && (
                        <Text fontSize="sm" color="gray.500" mt={2} noOfLines={2}>
                          {event.eventDescription}
                        </Text>
                      )}
                      {event.eventLocation && (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          📍 {event.eventLocation}
                        </Text>
                      )}
                    </Box>
                    <EditIcon color="gray.400" />
                  </Flex>
                </Box>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Event Edit Modal */}
      <Modal isOpen={isEventEditModalOpen} onClose={onEventEditModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Event</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Event Name</FormLabel>
                <Input name="eventName" value={editEventFormData.eventName} onChange={handleEventEditFormChange} />
              </FormControl>
              <FormControl>
                <FormLabel>Event Date</FormLabel>
                <Input name="eventDate" type="date" value={editEventFormData.eventDate} onChange={handleEventEditFormChange} />
              </FormControl>
              <FormControl>
                <FormLabel>Repeat Event</FormLabel>
                <Input as="select" name="recurrenceType" value={editEventFormData.recurrenceType} onChange={handleEventEditFormChange}>
                  <option value="none">Does not repeat</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Monthly</option>
                </Input>
              </FormControl>
              {editEventFormData.recurrenceType !== 'none' && (
                <FormControl>
                  <FormLabel>Repeat Until</FormLabel>
                  <Input 
                    name="recurrenceEndDate" 
                    type="date" 
                    value={editEventFormData.recurrenceEndDate} 
                    onChange={handleEventEditFormChange}
                    min={editEventFormData.eventDate}
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Event will repeat {editEventFormData.recurrenceType === 'weekly' ? 'every week' : editEventFormData.recurrenceType === 'biweekly' ? 'every 2 weeks' : 'every month'} until this date.
                  </Text>
                </FormControl>
              )}
              <FormControl>
                <Checkbox 
                  name="isAllDay"
                  isChecked={editEventFormData.isAllDay} 
                  onChange={handleEventEditFormChange}
                >
                  All-Day Event
                </Checkbox>
              </FormControl>
              {!editEventFormData.isAllDay && (
                <>
                  <FormControl>
                    <FormLabel>Start Time</FormLabel>
                    <Flex gap={2}>
                      <Input as="select" name="startHour" value={editEventFormData.startHour} onChange={handleEventEditFormChange}>
                        {hours.map(hour => <option key={hour} value={hour}>{hour}</option>)}
                      </Input>
                      <Input as="select" name="startMinute" value={editEventFormData.startMinute} onChange={handleEventEditFormChange}>
                        {minutes.map(min => <option key={min} value={min}>{min}</option>)}
                      </Input>
                      <Input as="select" name="startPeriod" value={editEventFormData.startPeriod} onChange={handleEventEditFormChange}>
                        {periods.map(period => <option key={period} value={period}>{period}</option>)}
                      </Input>
                    </Flex>
                  </FormControl>
                  <FormControl>
                    <FormLabel>End Time</FormLabel>
                    <Flex gap={2}>
                      <Input as="select" name="endHour" value={editEventFormData.endHour} onChange={handleEventEditFormChange}>
                        {hours.map(hour => <option key={hour} value={hour}>{hour}</option>)}
                      </Input>
                      <Input as="select" name="endMinute" value={editEventFormData.endMinute} onChange={handleEventEditFormChange}>
                        {minutes.map(min => <option key={min} value={min}>{min}</option>)}
                      </Input>
                      <Input as="select" name="endPeriod" value={editEventFormData.endPeriod} onChange={handleEventEditFormChange}>
                        {periods.map(period => <option key={period} value={period}>{period}</option>)}
                      </Input>
                    </Flex>
                  </FormControl>
                </>
              )}
              <FormControl>
                <FormLabel>Location</FormLabel>
                <LocationAutocomplete
                  value={editEventFormData.eventLocation}
                  onChange={handleLocationChange}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Event Description (max 500 characters)</FormLabel>
                <Textarea name="eventDescription" value={editEventFormData.eventDescription} onChange={handleEventEditFormChange} placeholder="Brief description of the event" maxLength={500} />
              </FormControl>
              <FormControl>
                <FormLabel>Event Link (optional)</FormLabel>
                <Input name="eventLink" type="url" value={editEventFormData.eventLink} onChange={handleEventEditFormChange} placeholder="https://eventbrite.com/..." />
              </FormControl>
              <FormControl>
                <FormLabel>Link Button Text (optional)</FormLabel>
                <Input name="eventLinkText" value={editEventFormData.eventLinkText} onChange={handleEventEditFormChange} placeholder="Buy Tickets" />
              </FormControl>
              <FormControl>
                <FormLabel>Event Flyer/Image (optional)</FormLabel>
                <Input
                  ref={editEventImageRef}
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleEditEventImageChange}
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
                {editEventImagePreview && (
                  <Box position="relative" mt={3} maxW="300px">
                    {editEventImagePreview.startsWith('data:application/pdf') ? (
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
                        src={editEventImagePreview}
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
                      onClick={handleRemoveEditEventImage}
                    />
                  </Box>
                )}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEventEditModalClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleEventEditSubmit}>Save Changes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CalendarDashboard;
