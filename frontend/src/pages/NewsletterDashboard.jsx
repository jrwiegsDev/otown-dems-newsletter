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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Input,
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
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import AddSubscriberForm from '../components/AddSubscriberForm';
import NewsletterEditor from '../components/NewsletterEditor';

const NewsletterDashboard = ({
  subscribers,
  isLoadingSubscribers,
  searchTerm,
  setSearchTerm,
  filteredSubscribers,
  fetchSubscribers,
  deleteSubscriber,
  updateSubscriber,
}) => {
  const cancelRef = useRef();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState(null);
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const [subscriberToEdit, setSubscriberToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({ firstName: '', lastName: '', email: '' });

  const openDeleteAlert = (subscriber) => {
    setSubscriberToDelete(subscriber);
    setIsDeleteAlertOpen(true);
  };

  const closeDeleteAlert = () => setIsDeleteAlertOpen(false);

  const handleDeleteConfirm = async () => {
    if (!subscriberToDelete) return;
    const success = await deleteSubscriber(subscriberToDelete._id);
    if (success) {
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
    const result = await updateSubscriber(subscriberToEdit._id, editFormData);
    if (result) {
      onEditModalClose();
    }
  };

  const handleExportSignInSheet = () => {
    // Sort subscribers alphabetically by last name, then first name
    const sortedSubscribers = [...subscribers].sort((a, b) => {
      const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '');
      if (lastNameCompare !== 0) return lastNameCompare;
      return (a.firstName || '').localeCompare(b.firstName || '');
    });

    // Create CSV content with headers and padding for better column widths
    let csvContent = 'First Name,Last Name,Provide Email if Desired,Check-In\n';
    
    // Add each subscriber as a row with empty cells padded with spaces
    sortedSubscribers.forEach(subscriber => {
      const firstName = (subscriber.firstName || '').replace(/,/g, '');
      const lastName = (subscriber.lastName || '').replace(/,/g, '');
      // Add padding spaces to make columns wider when opened in spreadsheet apps
      csvContent += `${firstName}${' '.repeat(Math.max(0, 20 - firstName.length))},${lastName}${' '.repeat(Math.max(0, 20 - lastName.length))},${''.padEnd(40)},${''.padEnd(15)}\n`;
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Use current date for filename
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `meeting-sign-in-sheet-${date}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Grid templateAreas={`"compose subscribers"`} gridTemplateColumns={'1fr 1fr'} gap="8" flex="1" minH="0">
        <GridItem area="compose" display="flex" flexDirection="column" minH="0">
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" h="100%" display="flex" flexDirection="column" minH="0">
            <Heading fontSize="xl" mb={4} flexShrink={0}>Compose Newsletter</Heading>
            <Box flex="1" minH="0">
              <NewsletterEditor />
            </Box>
          </Box>
        </GridItem>
        
        <GridItem area="subscribers" display="flex" flexDirection="column" minH="0">
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" h="100%" display="flex" flexDirection="column" minH="0">
            <Flex justifyContent="space-between" alignItems="center" flexShrink={0} mb={4}>
              <Heading fontSize="xl">Subscriber Management</Heading>
              <Flex gap={3} alignItems="center">
                <Text fontSize="lg" fontWeight="semibold" color="blue.400">
                  Total Subscribers: {subscribers.length}
                </Text>
                <Button
                  colorScheme="teal"
                  size="sm"
                  onClick={handleExportSignInSheet}
                >
                  📋 Export Sign-In Sheet
                </Button>
              </Flex>
            </Flex>
            <Box flexShrink={0}>
              <AddSubscriberForm onSubscriberAdded={fetchSubscribers} />
            </Box>
            <Flex mt={4} flexShrink={0} gap={2}>
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                flex="1"
              />
              {searchTerm && (
                <Button
                  onClick={() => setSearchTerm('')}
                  colorScheme="gray"
                  size="md"
                >
                  Clear
                </Button>
              )}
            </Flex>
            {isLoadingSubscribers ? (
              <Flex justify="center" align="center" flex="1" minH="0">
                <Spinner />
              </Flex>
            ) : (
              <TableContainer mt={4} flex="1" overflowY="auto" minH="0">
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

      {/* Delete Alert Dialog */}
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

      {/* Edit Modal */}
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

export default NewsletterDashboard;
