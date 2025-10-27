// frontend/src/components/ManageAnnouncements.jsx

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Input,
  Textarea,
  Button,
  Text,
  IconButton,
  Spinner,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useColorModeValue,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';

const ManageAnnouncements = ({
  announcements,
  isLoadingAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();
  const cancelRef = React.useRef();

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsPosting(true);
    try {
      await createAnnouncement({ title, content });
      setTitle('');
      setContent('');
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsPosting(false);
    }
  };

  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    onEditModalOpen();
  };

  const handleUpdate = async () => {
    if (!editingAnnouncement) return;
    
    try {
      await updateAnnouncement(editingAnnouncement._id, {
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
      });
      onEditModalClose();
      setEditingAnnouncement(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const openDeleteAlert = (announcement) => {
    setAnnouncementToDelete(announcement);
    onDeleteAlertOpen();
  };

  const handleDelete = async () => {
    if (!announcementToDelete) return;
    
    await deleteAnnouncement(announcementToDelete._id);
    onDeleteAlertClose();
    setAnnouncementToDelete(null);
  };

  return (
    <Box
      bg={bgColor}
      p={4}
      borderRadius="md"
      border="1px"
      borderColor={borderColor}
      h="100%"
      display="flex"
      flexDirection="column"
    >
      <VStack spacing={4} align="stretch" flex="1" overflow="hidden">
        <Heading size="md">Manage Announcements</Heading>
        
        {/* Create Form */}
        <Box as="form" onSubmit={handleCreate}>
          <VStack spacing={2}>
            <Input
              placeholder="Announcement Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              size="sm"
              maxLength={100}
            />
            <Textarea
              placeholder="Announcement content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              size="sm"
              resize="none"
              rows={3}
            />
            <Button
              type="submit"
              colorScheme="blue"
              size="sm"
              isLoading={isPosting}
              loadingText="Posting..."
              width="100%"
            >
              Post Announcement
            </Button>
          </VStack>
        </Box>

        <Divider />

        {/* Announcements List */}
        <VStack spacing={2} align="stretch" flex="1" overflowY="auto">
          <Heading size="sm">Current Announcements ({announcements.length})</Heading>
          
          {isLoadingAnnouncements ? (
            <Spinner />
          ) : announcements.length === 0 ? (
            <Text color="gray.500" fontSize="sm" fontStyle="italic">No announcements yet</Text>
          ) : (
            announcements.map((announcement) => (
              <Box
                key={announcement._id}
                p={3}
                border="1px"
                borderColor={borderColor}
                borderRadius="md"
                _hover={{ bg: hoverBg }}
              >
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={1} flex="1">
                    <Text fontWeight="bold" fontSize="sm">{announcement.title}</Text>
                    <Text fontSize="xs" color="gray.600" noOfLines={2}>
                      {announcement.content}
                    </Text>
                    <Text fontSize="xs" color="gray.500" fontStyle="italic">
                      Posted {new Date(announcement.createdAt).toLocaleDateString()}
                    </Text>
                  </VStack>
                  <HStack spacing={1}>
                    <IconButton
                      icon={<EditIcon />}
                      size="sm"
                      colorScheme="yellow"
                      variant="ghost"
                      onClick={() => openEditModal(announcement)}
                      aria-label="Edit announcement"
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => openDeleteAlert(announcement)}
                      aria-label="Delete announcement"
                    />
                  </HStack>
                </HStack>
              </Box>
            ))
          )}
        </VStack>
      </VStack>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Announcement</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3}>
              <Input
                placeholder="Title"
                value={editingAnnouncement?.title || ''}
                onChange={(e) => setEditingAnnouncement({
                  ...editingAnnouncement,
                  title: e.target.value
                })}
              />
              <Textarea
                placeholder="Content"
                value={editingAnnouncement?.content || ''}
                onChange={(e) => setEditingAnnouncement({
                  ...editingAnnouncement,
                  content: e.target.value
                })}
                rows={8}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditModalClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleUpdate}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Alert */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Delete Announcement</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete "{announcementToDelete?.title}"?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ManageAnnouncements;
