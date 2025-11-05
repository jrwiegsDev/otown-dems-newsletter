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
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
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
  const [isEventDeleteAlertOpen, setIsEventDeleteAlertOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const { isOpen: isEventEditModalOpen, onOpen: onEventEditModalOpen, onClose: onEventEditModalClose } = useDisclosure();
  const [eventToEdit, setEventToEdit] = useState(null);
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
    eventLinkText: ''
  });

  // Generate options for dropdowns
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = ['00', '15', '30', '45'];
  const periods = ['AM', 'PM'];

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
    });
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
      {/* 2x2 Grid Layout for Calendar Dashboard */}
      <Grid 
        templateAreas={`"calendar management" "events announcement"`} 
        gridTemplateColumns={'1fr 1fr'} 
        gridTemplateRows={'auto auto'}
        gap="8"
      >
        {/* TOP LEFT: Calendar */}
        <GridItem area="calendar" display="flex" flexDirection="column">
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" display="flex" flexDirection="column" h="700px">
            <Heading fontSize="xl" flexShrink={0} mb={4}>Calendar View</Heading>
            <Box flexGrow={1} overflow="hidden">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={events.map(event => ({
                  id: event._id,
                  title: event.eventName,
                  date: event.eventDate.slice(0, 10),
                  backgroundColor: event.isBannerEvent ? 'var(--chakra-colors-yellow-500)' : 'var(--chakra-colors-blue-500)',
                  borderColor: event.isBannerEvent ? 'var(--chakra-colors-yellow-600)' : 'var(--chakra-colors-blue-600)',
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
                height="100%"
              />
            </Box>
          </Box>
        </GridItem>

        {/* TOP RIGHT: Event Management (Create Event) */}
        <GridItem area="management" display="flex" flexDirection="column">
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" display="flex" flexDirection="column" h="700px">
            <Heading fontSize="xl" flexShrink={0} mb={4}>Event Management</Heading>
            <Box flex="1" overflowY="auto" pr={2}>
              <AddEventForm onEventAdded={fetchEvents} />
            </Box>
          </Box>
        </GridItem>

        {/* BOTTOM LEFT: Current Events List */}
        <GridItem area="events" display="flex" flexDirection="column">
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" display="flex" flexDirection="column" minH="500px" maxH="500px">
            <Heading fontSize="lg" flexShrink={0} mb={4}>Current Events</Heading>
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
                        <Heading fontSize="md">{event.eventName}</Heading>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(event.eventDate).toLocaleDateString('en-US', { timeZone: 'UTC' })} at {formatEventTime(event)}
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
          <Box display="flex" flexDirection="column" minH="500px">
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
                <FormLabel>Event Description (max 300 characters)</FormLabel>
                <Textarea name="eventDescription" value={editEventFormData.eventDescription} onChange={handleEventEditFormChange} placeholder="Brief description of the event" maxLength={300} />
              </FormControl>
              <FormControl>
                <FormLabel>Event Link (optional)</FormLabel>
                <Input name="eventLink" type="url" value={editEventFormData.eventLink} onChange={handleEventEditFormChange} placeholder="https://eventbrite.com/..." />
              </FormControl>
              <FormControl>
                <FormLabel>Link Button Text (optional)</FormLabel>
                <Input name="eventLinkText" value={editEventFormData.eventLinkText} onChange={handleEventEditFormChange} placeholder="Buy Tickets" />
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
