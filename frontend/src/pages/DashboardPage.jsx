import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import subscriberService from '../services/subscriberService';
import eventService from '../services/eventService';
import AddSubscriberForm from '../components/AddSubscriberForm';
import NewsletterEditor from '../components/NewsletterEditor';
import AddEventForm from '../components/AddEventForm';
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Text,
  useColorMode,
  Grid,
  GridItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Input,
  useToast,
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
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import EventCalendar from '../components/EventCalendar';
import 'react-calendar/dist/Calendar.css';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const cancelRef = useRef();

  // State for subscribers
  const [subscribers, setSubscribers] = useState([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState(null);
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const [subscriberToEdit, setSubscriberToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({ firstName: '', lastName: '', email: '' });

  // State for events
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const { isOpen: isEventDetailModalOpen, onOpen: onEventDetailModalOpen, onClose: onEventDetailModalClose } = useDisclosure();
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [isEventDeleteAlertOpen, setIsEventDeleteAlertOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const { isOpen: isEventEditModalOpen, onOpen: onEventEditModalOpen, onClose: onEventEditModalClose } = useDisclosure();
  const [eventToEdit, setEventToEdit] = useState(null);
  const [editEventFormData, setEditEventFormData] = useState({ eventName: '', eventDate: '', eventTime: '', eventDescription: '' });
  
  // State for dashboard view
  const [currentView, setCurrentView] = useState('newsletter');

  // --- Data Fetching ---
  const fetchSubscribers = async () => {
    setIsLoadingSubscribers(true);
    try {
      if (user?.token) {
        const data = await subscriberService.getSubscribers(user.token);
        setSubscribers(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscribers', error);
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const data = await eventService.getAllEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubscribers();
      fetchEvents();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredSubscribers = (subscribers || []).filter((subscriber) => {
    const searchString = searchTerm.toLowerCase();
    return (
      subscriber.firstName?.toLowerCase().includes(searchString) ||
      subscriber.lastName?.toLowerCase().includes(searchString) ||
      subscriber.email?.toLowerCase().includes(searchString)
    );
  });

  const openDeleteAlert = (subscriber) => {
    setSubscriberToDelete(subscriber);
    setIsDeleteAlertOpen(true);
  };
  const closeDeleteAlert = () => setIsDeleteAlertOpen(false);
  const handleDeleteConfirm = async () => {
    if (!subscriberToDelete) return;
    try {
      await subscriberService.deleteSubscriber(subscriberToDelete._id, user.token);
      toast({
        title: 'Success!',
        description: 'Subscriber has been deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setSubscribers(subscribers.filter((sub) => sub._id !== subscriberToDelete._id));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete subscriber.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      closeDeleteAlert();
    }
  };

  const openEditModal = (subscriber) => {
    setSubscriberToEdit(subscriber);
    setEditFormData({
      firstName: subscriber.firstName || '',
      lastName: subscriber.lastName || '',
      email: subscriber.email || ''
    });
    onEditModalOpen();
  };
  const handleEditFormChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };
  const handleEditSubmit = async () => {
    try {
      const updatedSubscriber = await subscriberService.updateSubscriber(subscriberToEdit._id, editFormData, user.token);
      toast({
        title: 'Success!',
        description: 'Subscriber has been updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setSubscribers(subscribers.map(sub => sub._id === updatedSubscriber._id ? updatedSubscriber : sub));
      onEditModalClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update subscriber.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // --- Event CRUD Handlers ---
  const openEventDeleteAlert = (event) => {
    setEventToDelete(event);
    setIsEventDeleteAlertOpen(true);
  };
  const closeEventDeleteAlert = () => setIsEventDeleteAlertOpen(false);
  const handleEventDeleteConfirm = async () => {
    try {
      await eventService.deleteEvent(eventToDelete._id, user.token);
      setEvents(events.filter((event) => event._id !== eventToDelete._id));
      toast({ title: 'Event Deleted', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      toast({ title: 'Error deleting event', status: 'error', duration: 5000, isClosable: true });
    } finally {
      closeEventDeleteAlert();
    }
  };

  const openEventEditModal = (event) => {
    setEventToEdit(event);
    setEditEventFormData({
      eventName: event.eventName,
      eventDate: new Date(event.eventDate).toISOString().split('T')[0], // Format date for input
      eventTime: event.eventTime || '',
      eventDescription: event.eventDescription || '',
    });
    onEventEditModalOpen();
  };
  const handleEventEditFormChange = (e) => {
    setEditEventFormData({ ...editEventFormData, [e.target.name]: e.target.value });
  };
  const handleEventEditSubmit = async () => {
    try {
      const updatedEvent = await eventService.updateEvent(eventToEdit._id, editEventFormData, user.token);
      setEvents(events.map(event => event._id === updatedEvent._id ? updatedEvent : event));
      toast({ title: 'Event Updated', status: 'success', duration: 3000, isClosable: true });
      onEventEditModalClose();
    } catch (error) {
      toast({ title: 'Error updating event', status: 'error', duration: 5000, isClosable: true });
    }
  };

  // --- NEW: Handler for clicking a date on the calendar ---
  const handleDateClick = (date) => {
    const eventsOnDate = events.filter(event => {
      const eventDate = new Date(event.eventDate);
      const correctedDate = new Date(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate());
      return correctedDate.toDateString() === date.toDateString();
    });

    if (eventsOnDate.length > 0) {
      setSelectedDateEvents(eventsOnDate);
      onEventDetailModalOpen();
    }
  };

  return (
    <Box p={5}>
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <Heading>
          {currentView === 'newsletter' ? 'Newsletter Dashboard' : 'Calendar Dashboard'}
        </Heading>
        <Stack direction="row" spacing={4} alignItems="center">
          {user && <Text>Welcome, {user.username}!</Text>}
          <Button onClick={() => setCurrentView(currentView === 'newsletter' ? 'calendar' : 'newsletter')}>
            Switch to {currentView === 'newsletter' ? 'Calendar' : 'Newsletter'} View
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

      {currentView === 'newsletter' ? (
        <Grid templateAreas={`"compose subscribers"`} gridTemplateColumns={'1fr 1fr'} gap="8">
          <GridItem area="compose" display="flex" flexDirection="column">
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" h="100%" display="flex" flexDirection="column">
              <Heading fontSize="xl" mb={4}>Compose Newsletter</Heading>
              <NewsletterEditor />
            </Box>
          </GridItem>
          <GridItem area="subscribers">
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" h="100%" display="flex" flexDirection="column">
              <Heading fontSize="xl">Subscriber Management</Heading>
              <AddSubscriberForm onSubscriberAdded={fetchSubscribers} />
              <Input
                placeholder="Search by name or email..."
                mt={4}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {isLoadingSubscribers ? (
                <Flex justify="center" align="center" flex="1">
                  <Spinner />
                </Flex>
              ) : (
                <TableContainer mt={4} maxH="60vh" overflowY="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>First Name</Th>
                        <Th>Last Name</Th>
                        <Th>Email</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredSubscribers.map((subscriber) => (
                        <Tr key={subscriber._id}>
                          <Td>{subscriber.firstName}</Td>
                          <Td>{subscriber.lastName}</Td>
                          <Td>{subscriber.email}</Td>
                          <Td>
                            <Stack direction="row">
                              <IconButton
                                icon={<EditIcon />}
                                colorScheme="yellow"
                                aria-label="Edit subscriber"
                                size="sm"
                                onClick={() => openEditModal(subscriber)}
                              />
                              <IconButton
                                icon={<DeleteIcon />}
                                colorScheme="red"
                                aria-label="Delete subscriber"
                                size="sm"
                                onClick={() => openDeleteAlert(subscriber)}
                              />
                            </Stack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </GridItem>
        </Grid>
      ) : (
        // --- CALENDAR DASHBOARD GRID ---
        <Grid templateAreas={`"calendar management"`} gridTemplateColumns={'1fr 1fr'} gap="8">
          {/* --- LEFT COLUMN --- */}
          <GridItem area="calendar">
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" h="100%" display="flex" flexDirection="column">
              <Heading fontSize="xl">Calendar View</Heading>
              <EventCalendar events={events} colorMode={colorMode} onDateClick={handleDateClick} />

              <Divider my={4} />

              <Heading fontSize="lg" mt={2} mb={4}>Current Events</Heading>
              {isLoadingEvents ? (
                <Spinner />
              ) : (
                <VStack spacing={4} align="stretch" flex="1" overflowY="auto" minH="0" pr={2}>
                  {events.map((event) => (
                    <Box key={event._id} p={4} borderWidth="1px" borderRadius="md">
                      <Flex justifyContent="space-between" alignItems="center">
                        <Box>
                          <Heading fontSize="md">{event.eventName}</Heading>
                          <Text fontSize="sm" color="gray.500">
                            {new Date(event.eventDate).toLocaleDateString('en-US', { timeZone: 'UTC' })} at {event.eventTime}
                          </Text>
                        </Box>
                        <Stack direction="row">
                          <IconButton icon={<EditIcon />} size="sm" colorScheme="yellow" onClick={() => openEventEditModal(event)} />
                          <IconButton icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={() => openEventDeleteAlert(event)} />
                        </Stack>
                      </Flex>
                      <Text mt={2}>{event.eventDescription}</Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </GridItem>

          {/* --- RIGHT COLUMN --- */}
          <GridItem area="management">
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" h="100%">
              <Heading fontSize="xl">Event Management</Heading>
              <AddEventForm onEventAdded={fetchEvents} />
            </Box>
          </GridItem>
        </Grid>
      )}
      {/* --- DELETE & EDIT MODALS/ALERTS --- */}
      <AlertDialog isOpen={isDeleteAlertOpen} leastDestructiveRef={cancelRef} onClose={closeDeleteAlert}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Subscriber
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete {subscriberToDelete?.email}? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeDeleteAlert}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Subscriber</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>First Name</FormLabel>
                <Input name="firstName" value={editFormData.firstName} onChange={handleEditFormChange} />
              </FormControl>
              <FormControl>
                <FormLabel>Last Name</FormLabel>
                <Input name="lastName" value={editFormData.lastName} onChange={handleEditFormChange} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input name="email" type="email" value={editFormData.email} onChange={handleEditFormChange} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditModalClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

{/* Event Delete Confirmation Dialog */}
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

      {/* --- NEW: Event Detail Modal --- */}
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
    </Box>
  );
};

export default DashboardPage;