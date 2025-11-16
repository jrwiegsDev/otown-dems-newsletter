import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Switch,
  Heading,
  useColorModeValue,
  Badge,
  Divider,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Input,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Grid,
  GridItem,
  SimpleGrid,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import api from '../api/axiosConfig';

const PollIssueManager = ({ user }) => {
  const [allIssues, setAllIssues] = useState([]);
  const [activeIssues, setActiveIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newIssueName, setNewIssueName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [deletingIssue, setDeletingIssue] = useState(null);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const [activeResponse, allResponse] = await Promise.all([
        api.get('/api/poll/active-issues'),
        api.get('/api/poll/all-issues', {
          headers: { Authorization: `Bearer ${user.token}` }
        })
      ]);
      
      setActiveIssues(activeResponse.data.issues || []);
      setAllIssues(allResponse.data.issues || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast({
        title: 'Error loading issues',
        description: error.response?.data?.message || 'Failed to load poll issues',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIssue = async (issue) => {
    const isActive = activeIssues.includes(issue);
    const newActiveIssues = isActive
      ? activeIssues.filter(i => i !== issue)
      : [...activeIssues, issue];

    try {
      setSaving(true);
      await api.post('/api/poll/update-active-issues', 
        { activeIssues: newActiveIssues },
        { headers: { Authorization: `Bearer ${user.token}` }}
      );
      
      setActiveIssues(newActiveIssues);
      
      toast({
        title: isActive ? 'Issue deactivated' : 'Issue activated',
        description: `"${issue}" is now ${isActive ? 'hidden from' : 'available for'} voting`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating issue:', error);
      toast({
        title: 'Error updating issue',
        description: error.response?.data?.message || 'Failed to update issue status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddIssue = async () => {
    if (!newIssueName.trim()) {
      toast({
        title: 'Invalid issue name',
        description: 'Please enter a name for the new issue',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (allIssues.includes(newIssueName.trim())) {
      toast({
        title: 'Issue already exists',
        description: 'This issue is already in the list',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSaving(true);
      await api.post('/api/poll/add-issue',
        { issueName: newIssueName.trim() },
        { headers: { Authorization: `Bearer ${user.token}` }}
      );
      
      await fetchIssues();
      setNewIssueName('');
      setShowAddModal(false);
      
      toast({
        title: 'Issue added',
        description: `"${newIssueName}" has been added to the poll`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding issue:', error);
      toast({
        title: 'Error adding issue',
        description: error.response?.data?.message || 'Failed to add new issue',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditIssue = async () => {
    if (!editedName.trim()) {
      toast({
        title: 'Invalid issue name',
        description: 'Please enter a name for the issue',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (editedName.trim() === editingIssue) {
      setShowEditModal(false);
      return;
    }

    if (allIssues.includes(editedName.trim()) && editedName.trim() !== editingIssue) {
      toast({
        title: 'Issue already exists',
        description: 'This issue name is already in use',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSaving(true);
      await api.put('/api/poll/edit-issue',
        { oldName: editingIssue, newName: editedName.trim() },
        { headers: { Authorization: `Bearer ${user.token}` }}
      );
      
      await fetchIssues();
      setShowEditModal(false);
      setEditingIssue(null);
      setEditedName('');
      
      toast({
        title: 'Issue updated',
        description: `Issue renamed to "${editedName}"`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error editing issue:', error);
      toast({
        title: 'Error editing issue',
        description: error.response?.data?.message || 'Failed to update issue',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIssue = async () => {
    try {
      setSaving(true);
      await api.delete('/api/poll/delete-issue',
        { 
          headers: { Authorization: `Bearer ${user.token}` },
          data: { issueName: deletingIssue }
        }
      );
      
      await fetchIssues();
      setShowDeleteModal(false);
      setDeletingIssue(null);
      
      toast({
        title: 'Issue deleted',
        description: `"${deletingIssue}" has been removed from the poll`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast({
        title: 'Error deleting issue',
        description: error.response?.data?.message || 'Failed to delete issue',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (issue) => {
    setEditingIssue(issue);
    setEditedName(issue);
    setShowEditModal(true);
  };

  const openDeleteModal = (issue) => {
    setDeletingIssue(issue);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading poll issues...</Text>
      </Box>
    );
  }

  return (
    <Box maxW="1400px" mx="auto">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="md">Manage Poll Issues</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            Add New Issue
          </Button>
        </HStack>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
          {/* Left Column: Issue List */}
          <GridItem>
            <VStack spacing={4} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">Issue Management</AlertTitle>
                  <AlertDescription fontSize="xs">
                    Toggle issues on/off to control what appears on the public voting form.
                    Historical data is always preserved.
                  </AlertDescription>
                </Box>
              </Alert>

              <Box 
                bg={bgColor} 
                border="1px" 
                borderColor={borderColor} 
                borderRadius="md" 
                p={4}
                maxH="600px"
                overflowY="auto"
              >
                <VStack spacing={3} align="stretch">
                  {allIssues.map((issue) => {
                    const isActive = activeIssues.includes(issue);
                    return (
                      <HStack
                        key={issue}
                        justify="space-between"
                        p={3}
                        bg={useColorModeValue(
                          isActive ? 'green.50' : 'gray.50',
                          isActive ? 'green.900' : 'gray.700'
                        )}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={isActive ? 'green.200' : 'gray.300'}
                      >
                        <HStack flex={1}>
                          <Text fontSize="sm" fontWeight="medium">{issue}</Text>
                          <Badge colorScheme={isActive ? 'green' : 'gray'} fontSize="xs">
                            {isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </HStack>
                        <HStack spacing={1}>
                          <IconButton
                            icon={<EditIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            aria-label="Edit issue"
                            onClick={() => openEditModal(issue)}
                            isDisabled={saving}
                          />
                          <IconButton
                            icon={<DeleteIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            aria-label="Delete issue"
                            onClick={() => openDeleteModal(issue)}
                            isDisabled={saving}
                          />
                          <Switch
                            isChecked={isActive}
                            onChange={() => handleToggleIssue(issue)}
                            isDisabled={saving}
                            colorScheme="green"
                            size="md"
                          />
                        </HStack>
                      </HStack>
                    );
                  })}
                </VStack>
              </Box>
            </VStack>
          </GridItem>

          {/* Right Column: Stats and Quick Actions */}
          <GridItem>
            <VStack spacing={4} align="stretch">
              {/* Quick Stats Card */}
              <Box 
                bg={bgColor} 
                border="1px" 
                borderColor={borderColor} 
                borderRadius="md" 
                p={4}
              >
                <Heading size="sm" mb={3}>Quick Stats</Heading>
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">Total Issues:</Text>
                    <Badge colorScheme="blue" fontSize="md">{allIssues.length}</Badge>
                  </HStack>
                  <Divider />
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">Active:</Text>
                    <Badge colorScheme="green" fontSize="md">{activeIssues.length}</Badge>
                  </HStack>
                  <Divider />
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">Inactive:</Text>
                    <Badge colorScheme="gray" fontSize="md">{allIssues.length - activeIssues.length}</Badge>
                  </HStack>
                </VStack>
              </Box>

              {/* Active Issues Preview */}
              <Box 
                bg={bgColor} 
                border="1px" 
                borderColor={borderColor} 
                borderRadius="md" 
                p={4}
              >
                <Heading size="sm" mb={3}>Currently Active</Heading>
                {activeIssues.length > 0 ? (
                  <VStack spacing={2} align="stretch">
                    {activeIssues.map((issue) => (
                      <HStack key={issue} fontSize="sm">
                        <Badge colorScheme="green" variant="solid" fontSize="xs">✓</Badge>
                        <Text fontSize="xs">{issue}</Text>
                      </HStack>
                    ))}
                  </VStack>
                ) : (
                  <Text fontSize="sm" color="gray.500" fontStyle="italic">
                    No active issues. Toggle some on to enable voting.
                  </Text>
                )}
              </Box>

              {/* Info Box */}
              <Box 
                bg={useColorModeValue('blue.50', 'blue.900')} 
                border="1px" 
                borderColor={useColorModeValue('blue.200', 'blue.700')}
                borderRadius="md" 
                p={4}
              >
                <Heading size="xs" mb={2} color={useColorModeValue('blue.800', 'blue.200')}>
                  💡 Pro Tip
                </Heading>
                <Text fontSize="xs" color={useColorModeValue('blue.700', 'blue.300')}>
                  Use the toggle switches to quickly activate or deactivate issues. 
                  Edit names to fix typos, and delete only when necessary.
                </Text>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </VStack>

      {/* Add Issue Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Poll Issue</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.600">
                Enter the name of the new issue. It will be added to the master list
                and activated for voting.
              </Text>
              <Input
                placeholder="e.g., 2026 Midterm Elections"
                value={newIssueName}
                onChange={(e) => setNewIssueName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddIssue();
                  }
                }}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleAddIssue}
              isLoading={saving}
            >
              Add Issue
            </Button>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Issue Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Poll Issue</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.600">
                Edit the issue name. This will update the issue across all historical data.
              </Text>
              <Input
                placeholder="Issue name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleEditIssue();
                  }
                }}
                autoFocus
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleEditIssue}
              isLoading={saving}
            >
              Save Changes
            </Button>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Issue Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Poll Issue</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription fontSize="sm">
                    This will permanently delete "{deletingIssue}" from the master list.
                    Historical voting data for this issue will remain in the database but 
                    may not display correctly in charts.
                  </AlertDescription>
                </Box>
              </Alert>
              <Text fontSize="sm" color="gray.600">
                Are you sure you want to delete this issue?
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="red"
              mr={3}
              onClick={handleDeleteIssue}
              isLoading={saving}
            >
              Delete Issue
            </Button>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PollIssueManager;
