import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Text,
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
  Badge,
  Wrap,
  WrapItem,
  useColorModeValue,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, DownloadIcon } from '@chakra-ui/icons';

const VolunteerManagement = ({
  volunteers,
  isLoadingVolunteers,
  searchTerm,
  setSearchTerm,
  filteredVolunteers,
  fetchVolunteers,
  deleteVolunteer,
  updateVolunteer,
}) => {
  const cancelRef = useRef();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [volunteerToDelete, setVolunteerToDelete] = useState(null);
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const [volunteerToEdit, setVolunteerToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '',
    interestedPrograms: []
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const VOLUNTEER_PROGRAMS = [
    'Adopt A Highway',
    'Christmas Toy Drive',
    'Thanksgiving Meal Drive',
    'Food Pantry Support',
    'Community Garden',
    'Literacy Tutoring',
    'Senior Outreach',
    'Voter Registration',
    'School Supply Drive',
    'Winter Coat Drive',
    'Book Drive',
    'Community Clean-Up Events'
  ];

  const openDeleteAlert = (volunteer) => {
    setVolunteerToDelete(volunteer);
    setIsDeleteAlertOpen(true);
  };

  const closeDeleteAlert = () => setIsDeleteAlertOpen(false);

  const handleDeleteConfirm = async () => {
    if (!volunteerToDelete) return;
    const success = await deleteVolunteer(volunteerToDelete._id);
    if (success) {
      closeDeleteAlert();
    }
  };

  const openEditModal = (volunteer) => {
    setVolunteerToEdit(volunteer);
    setEditFormData({
      firstName: volunteer.firstName || '',
      lastName: volunteer.lastName || '',
      email: volunteer.email || '',
      interestedPrograms: volunteer.interestedPrograms || []
    });
    onEditModalOpen();
  };

  const handleEditFormChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleProgramToggle = (program) => {
    setEditFormData(prev => {
      const interestedPrograms = prev.interestedPrograms.includes(program)
        ? prev.interestedPrograms.filter(p => p !== program)
        : [...prev.interestedPrograms, program];
      return { ...prev, interestedPrograms };
    });
  };

  const handleEditSubmit = async () => {
    const result = await updateVolunteer(volunteerToEdit._id, editFormData);
    if (result) {
      onEditModalClose();
    }
  };

  const handleExportVolunteerList = () => {
    // Sort volunteers alphabetically by last name, then first name
    const sortedVolunteers = [...volunteers].sort((a, b) => {
      const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '');
      if (lastNameCompare !== 0) return lastNameCompare;
      return (a.firstName || '').localeCompare(b.firstName || '');
    });

    // Create CSV content with headers
    const headers = ['First Name', 'Last Name', 'Email', 'Programs of Interest', 'Signed Up'];
    const csvRows = [headers.join(',')];

    sortedVolunteers.forEach(volunteer => {
      const row = [
        volunteer.firstName || '',
        volunteer.lastName || '',
        volunteer.email || '',
        (volunteer.interestedPrograms || []).join('; '),
        new Date(volunteer.createdAt).toLocaleDateString()
      ];
      csvRows.push(row.map(field => `"${field}"`).join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `OADC-Volunteers-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <VStack spacing={6} align="stretch" w="100%">
      {/* Header Section */}
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
        <Heading size="lg">
          Volunteer Management
          <Text as="span" fontSize="xl" color="blue.500" ml={3}>
            Total Volunteers: {volunteers.length}
          </Text>
        </Heading>
        <Button
          leftIcon={<DownloadIcon />}
          colorScheme="teal"
          onClick={handleExportVolunteerList}
          isDisabled={volunteers.length === 0}
        >
          Export Volunteer List
        </Button>
      </Flex>

      {/* Search Bar */}
      <Input
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        size="lg"
        bg={bgColor}
      />

      {/* Volunteers Table */}
      <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md" overflowX="auto">
        {isLoadingVolunteers ? (
          <Flex justify="center" align="center" p={10}>
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : filteredVolunteers.length === 0 ? (
          <Box p={10} textAlign="center">
            <Text fontSize="lg" color="gray.500">
              {searchTerm ? 'No volunteers found matching your search.' : 'No volunteers yet.'}
            </Text>
          </Box>
        ) : (
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>First Name</Th>
                  <Th>Last Name</Th>
                  <Th>Email</Th>
                  <Th>Programs of Interest</Th>
                  <Th>Signed Up</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredVolunteers.map((volunteer) => (
                  <Tr key={volunteer._id}>
                    <Td>{volunteer.firstName}</Td>
                    <Td>{volunteer.lastName}</Td>
                    <Td>{volunteer.email}</Td>
                    <Td>
                      <Wrap spacing={1}>
                        {volunteer.interestedPrograms && volunteer.interestedPrograms.map(program => (
                          <WrapItem key={program}>
                            <Badge colorScheme="blue" fontSize="0.7em">
                              {program}
                            </Badge>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </Td>
                    <Td>{new Date(volunteer.createdAt).toLocaleDateString()}</Td>
                    <Td>
                      <Flex gap={2}>
                        <IconButton
                          aria-label="Edit volunteer"
                          icon={<EditIcon />}
                          colorScheme="yellow"
                          size="sm"
                          onClick={() => openEditModal(volunteer)}
                        />
                        <IconButton
                          aria-label="Delete volunteer"
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          size="sm"
                          onClick={() => openDeleteAlert(volunteer)}
                        />
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeDeleteAlert}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Volunteer
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete{' '}
              <strong>
                {volunteerToDelete?.firstName} {volunteerToDelete?.lastName}
              </strong>{' '}
              ({volunteerToDelete?.email})?
              <br />
              This action cannot be undone.
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

      {/* Edit Volunteer Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Volunteer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>First Name</FormLabel>
                <Input
                  name="firstName"
                  value={editFormData.firstName}
                  onChange={handleEditFormChange}
                  placeholder="First Name"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Last Name</FormLabel>
                <Input
                  name="lastName"
                  value={editFormData.lastName}
                  onChange={handleEditFormChange}
                  placeholder="Last Name"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  placeholder="Email"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Programs of Interest</FormLabel>
                <Wrap spacing={2}>
                  {VOLUNTEER_PROGRAMS.map(program => (
                    <WrapItem key={program}>
                      <Button
                        size="sm"
                        colorScheme={editFormData.interestedPrograms.includes(program) ? 'blue' : 'gray'}
                        onClick={() => handleProgramToggle(program)}
                      >
                        {program}
                      </Button>
                    </WrapItem>
                  ))}
                </Wrap>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleEditSubmit}
              isDisabled={
                !editFormData.firstName || 
                !editFormData.lastName || 
                !editFormData.email ||
                editFormData.interestedPrograms.length === 0
              }
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default VolunteerManagement;
