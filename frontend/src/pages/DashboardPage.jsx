import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import subscriberService from '../services/subscriberService';
import AddSubscriberForm from '../components/AddSubscriberForm';
import NewsletterEditor from '../components/NewsletterEditor';
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
  VStack
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const cancelRef = useRef();

  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // State for Delete Dialog
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState(null);

  // State for Edit Modal
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const [subscriberToEdit, setSubscriberToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({ firstName: '', lastName: '', email: '' });

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      if (user?.token) {
        const data = await subscriberService.getSubscribers(user.token);
        setSubscribers(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscribers', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubscribers();
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

  // --- Delete Functions ---
  const openDeleteAlert = (subscriber) => {
    setSubscriberToDelete(subscriber);
    setIsAlertOpen(true);
  };
  const closeDeleteAlert = () => setIsAlertOpen(false);
  const handleDeleteConfirm = async () => {
    // ... (This function is complete and correct from your code)
  };

  // --- Edit Functions ---
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
      // Update the list in the UI
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

  return (
    <>
      <Grid
        minH="100vh"
        w="100%"
        p={5}
        templateAreas={`"header header"
                        "compose subscribers"`}
        gridTemplateRows={'auto 1fr'}
        gridTemplateColumns={'1fr 1fr'}
        gap="8"
      >
        <GridItem area="header">
          <Flex justifyContent="space-between" alignItems="center">
            <Heading>Newsletter Dashboard</Heading>
            <Flex alignItems="center">
              {user && <Text mr={4}>Welcome, {user.username}!</Text>}
              <IconButton
                onClick={toggleColorMode}
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                aria-label="Toggle dark mode"
                mr={4}
              />
              <Button colorScheme="red" onClick={handleLogout}>
                Logout
              </Button>
            </Flex>
          </Flex>
        </GridItem>

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
            {isLoading ? (
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={closeDeleteAlert}>
        {/* ... This component is complete and correct from your code ... */}
      </AlertDialog>

      {/* Edit Subscriber Modal */}
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
    </>
  );
};

export default DashboardPage;