import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  useColorModeValue,
  Badge,
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import api from '../api/axiosConfig';

const StaffManagement = ({ user }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'admin'
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/staff', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: 'Error loading staff',
        description: error.response?.data?.message || 'Failed to load staff members',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!formData.username || !formData.email || !formData.fullName || !formData.password) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Invalid password',
        description: 'Password must be at least 6 characters',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSaving(true);
      await api.post('/api/users/staff', formData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      await fetchStaff();
      setShowAddModal(false);
      setFormData({ username: '', email: '', fullName: '', password: '', role: 'admin' });
      
      toast({
        title: 'Staff member added',
        description: `${formData.fullName} has been added to the team`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding staff:', error);
      toast({
        title: 'Error adding staff',
        description: error.response?.data?.message || 'Failed to add staff member',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditStaff = async () => {
    try {
      setSaving(true);
      await api.put(`/api/users/staff/${selectedStaff._id}`, formData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      await fetchStaff();
      setShowEditModal(false);
      setSelectedStaff(null);
      setFormData({ username: '', email: '', fullName: '', password: '', role: 'admin' });
      
      toast({
        title: 'Staff member updated',
        description: 'Staff information has been updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating staff:', error);
      toast({
        title: 'Error updating staff',
        description: error.response?.data?.message || 'Failed to update staff member',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async () => {
    try {
      setSaving(true);
      await api.delete(`/api/users/staff/${selectedStaff._id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      await fetchStaff();
      setShowDeleteModal(false);
      setSelectedStaff(null);
      
      toast({
        title: 'Staff member removed',
        description: `${selectedStaff.fullName} has been removed`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast({
        title: 'Error deleting staff',
        description: error.response?.data?.message || 'Failed to delete staff member',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = () => {
    setFormData({ username: '', email: '', fullName: '', password: '', role: 'admin' });
    setShowPassword(false); // Reset visibility toggle
    setShowAddModal(true);
  };

  const openEditModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData({
      username: staffMember.username,
      email: staffMember.email,
      fullName: staffMember.fullName,
      password: '', // Always empty - don't show existing password
      role: staffMember.role
    });
    setShowPassword(false); // Reset visibility toggle
    setShowEditModal(true);
  };

  const openDeleteModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading staff...</Text>
      </Box>
    );
  }

  return (
    <Box maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="md">Staff Management</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            size="sm"
            onClick={openAddModal}
          >
            Add Staff Member
          </Button>
        </HStack>

        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">Staff Access Control</AlertTitle>
            <AlertDescription fontSize="xs">
              Manage staff accounts and permissions. Only super admins can access this page.
            </AlertDescription>
          </Box>
        </Alert>

        <Box 
          bg={bgColor} 
          border="1px" 
          borderColor={borderColor} 
          borderRadius="md" 
          overflowX="auto"
        >
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Username</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Joined</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {staff.map((member) => (
                <Tr key={member._id}>
                  <Td fontWeight="medium">{member.fullName}</Td>
                  <Td>{member.username}</Td>
                  <Td>{member.email}</Td>
                  <Td>
                    <Badge colorScheme={member.role === 'superadmin' ? 'purple' : 'blue'}>
                      {member.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                    </Badge>
                  </Td>
                  <Td fontSize="sm">{new Date(member.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <HStack spacing={1}>
                      <IconButton
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        aria-label="Edit staff"
                        onClick={() => openEditModal(member)}
                        isDisabled={saving}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        aria-label="Delete staff"
                        onClick={() => openDeleteModal(member)}
                        isDisabled={saving || member._id === user._id}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      {/* Add Staff Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Staff Member</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Role</FormLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleAddStaff}
              isLoading={saving}
            >
              Add Staff
            </Button>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Staff Member</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Role</FormLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>New Password (Optional)</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Leave blank to keep current password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <Alert status="info" fontSize="sm">
                <AlertIcon />
                Leave password blank to keep current password
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleEditStaff}
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Staff Member</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription fontSize="sm">
                    This will permanently delete {selectedStaff?.fullName}'s account.
                    This action cannot be undone.
                  </AlertDescription>
                </Box>
              </Alert>
              <Text fontSize="sm">
                Are you sure you want to remove this staff member?
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="red"
              mr={3}
              onClick={handleDeleteStaff}
              isLoading={saving}
            >
              Delete
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

export default StaffManagement;
