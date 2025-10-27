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
import EventCalendar from '../components/EventCalendar';
import AddEventForm from '../components/AddEventForm';
import ManageAnnouncements from '../components/ManageAnnouncements';

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
  const { isOpen: isEventDetailModalOpen, onOpen: onEventDetailModalOpen, onClose: onEventDetailModalClose } = useDisclosure();
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [isEventDeleteAlertOpen, setIsEventDeleteAlertOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const { isOpen: isEventEditModalOpen, onOpen: onEventEditModalOpen, onClose: onEventEditModalClose } = useDisclosure();
  const [eventToEdit, setEventToEdit] = useState(null);
  const [editEventFormData, setEditEventFormData] = useState({ eventName: '', eventDate: '', eventTime: '', eventDescription: '' });

  const handleDateClick = (date) => {
    const eventsOnDate = getEventsForDate(date);
    if (eventsOnDate.length > 0) {
      setSelectedDateEvents(eventsOnDate);
      onEventDetailModalOpen();
    }
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
    setEditEventFormData({
      eventName: event.eventName,
      eventDate: new Date(event.eventDate).toISOString().split('T')[0],
      eventTime: event.eventTime || '',
      eventDescription: event.eventDescription || '',
    });
    onEventEditModalOpen();
  };

  const handleEventEditFormChange = (e) => {
    setEditEventFormData({ ...editEventFormData, [e.target.name]: e.target.value });
  };

  const handleEventEditSubmit = async () => {
    const result = await updateEvent(eventToEdit._id, editEventFormData);
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
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" display="flex" flexDirection="column" minH="500px">
            <Heading fontSize="xl" flexShrink={0} mb={4}>Calendar View</Heading>
            <Box flexShrink={0}>
              <EventCalendar events={events} onDateClick={handleDateClick} />
            </Box>
          </Box>
        </GridItem>

        {/* TOP RIGHT: Event Management (Create Event) */}
        <GridItem area="management" display="flex" flexDirection="column">
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" display="flex" flexDirection="column" minH="500px">
            <Heading fontSize="xl" flexShrink={0} mb={4}>Event Management</Heading>
            <Box flex="1" overflowY="auto">
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
                          {new Date(event.eventDate).toLocaleDateString('en-US', { timeZone: 'UTC' })} at {event.eventTime}
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
              <FormControl><FormLabel>Event Name</FormLabel><Input name="eventName" value={editEventFormData.eventName} onChange={handleEventEditFormChange} /></FormControl>
              <FormControl><FormLabel>Event Date</FormLabel><Input name="eventDate" type="date" value={editEventFormData.eventDate} onChange={handleEventEditFormChange} /></FormControl>
              <FormControl><FormLabel>Event Time</FormLabel><Input name="eventTime" value={editEventFormData.eventTime} onChange={handleEventEditFormChange} /></FormControl>
              <FormControl><FormLabel>Description / Location</FormLabel><Textarea name="eventDescription" value={editEventFormData.eventDescription} onChange={handleEventEditFormChange} /></FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEventEditModalClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleEventEditSubmit}>Save Changes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Event Detail Modal (for calendar date clicks) */}
      <Modal isOpen={isEventDetailModalOpen} onClose={onEventDetailModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Events for {selectedDateEvents.length > 0 && new Date(selectedDateEvents[0].eventDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {selectedDateEvents.map(event => (
                <Box key={event._id} p={4} borderWidth="1px" borderRadius="md">
                  <Heading fontSize="md">{event.eventName}</Heading>
                  <Text fontSize="sm" color="gray.500">{event.eventTime}</Text>
                  <Text mt={2}>{event.eventDescription}</Text>
                </Box>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onEventDetailModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CalendarDashboard;
