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
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, DeleteIcon } from '@chakra-ui/icons';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const cancelRef = useRef();

  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState(null);

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

  const openDeleteAlert = (subscriber) => {
    setSubscriberToDelete(subscriber);
    setIsAlertOpen(true);
  };

  const closeDeleteAlert = () => {
    setIsAlertOpen(false);
    setSubscriberToDelete(null);
  };

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
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderRadius="md"
            h="100%"
            display="flex"
            flexDirection="column"
          >
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
                          <IconButton
                            icon={<DeleteIcon />}
                            colorScheme="red"
                            aria-label="Delete subscriber"
                            size="sm"
                            onClick={() => openDeleteAlert(subscriber)}
                          />
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
      
      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeDeleteAlert}
      >
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
    </>
  );
};

export default DashboardPage;