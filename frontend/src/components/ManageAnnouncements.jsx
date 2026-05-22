// frontend/src/components/ManageAnnouncements.jsx

import React, { useState, useRef } from 'react';
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
  Image,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, CloseIcon, WarningIcon } from '@chakra-ui/icons';

const ANNOUNCEMENTS_PER_PAGE = 5;

const ManageAnnouncements = ({
  announcements,
  isLoadingAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [expiresAt, setExpiresAt] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [page, setPage] = useState(1);
  
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const toast = useToast();
  
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();
  const cancelRef = React.useRef();

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  // Handle image file selection for create form
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image must be less than 2MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image file selection for edit modal
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image must be less than 2MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingAnnouncement({
          ...editingAnnouncement,
          image: reader.result
        });
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image from create form
  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove image from edit modal
  const handleRemoveEditImage = () => {
    setEditingAnnouncement({
      ...editingAnnouncement,
      image: null
    });
    setEditImagePreview(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsPosting(true);
    try {
      await createAnnouncement({ title, content, image, expiresAt: expiresAt || null });
      setTitle('');
      setContent('');
      setImage(null);
      setImagePreview(null);
      setExpiresAt('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsPosting(false);
    }
  };

  const openEditModal = (announcement) => {
    setEditingAnnouncement({
      ...announcement,
      expiresAt: announcement.expiresAt ? announcement.expiresAt.slice(0, 10) : ''
    });
    setEditImagePreview(announcement.image || null);
    onEditModalOpen();
  };

  const handleUpdate = async () => {
    if (!editingAnnouncement) return;
    
    try {
      await updateAnnouncement(editingAnnouncement._id, {
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        image: editingAnnouncement.image,
        expiresAt: editingAnnouncement.expiresAt || null,
      });
      onEditModalClose();
      setEditingAnnouncement(null);
      setEditImagePreview(null);
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
            <Box width="100%">
              <Text fontSize="xs" color="gray.500" mb={1}>Image/Flyer (optional, max 2MB)</Text>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                size="sm"
                sx={{
                  '::file-selector-button': {
                    height: '32px',
                    padding: '0 12px',
                    marginRight: '12px',
                    background: 'gray.600',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }
                }}
              />
              {imagePreview && (
                <Box position="relative" mt={2} maxW="200px">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.600"
                  />
                  <IconButton
                    aria-label="Remove image"
                    icon={<CloseIcon />}
                    size="xs"
                    colorScheme="red"
                    position="absolute"
                    top={1}
                    right={1}
                    onClick={handleRemoveImage}
                  />
                </Box>
              )}
            </Box>
            <Box width="100%">
              <Text fontSize="xs" color="gray.500" mb={1}>Expiration Date (optional — announcement auto-hides after this date)</Text>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                size="sm"
              />
            </Box>
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

        {/* Announcements List — Tabs (Current / Past) with pagination */}
        {(() => {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          const currentAnnouncements = (announcements || []).filter((a) => {
            if (a.isArchived) return false;
            return new Date(a.createdAt) >= startOfMonth;
          });
          const pastAnnouncements = (announcements || []).filter((a) => {
            if (a.isArchived) return true;
            return new Date(a.createdAt) < startOfMonth;
          });

          const activeList = tabIndex === 0 ? currentAnnouncements : pastAnnouncements;
          const totalPages = Math.max(1, Math.ceil(activeList.length / ANNOUNCEMENTS_PER_PAGE));
          const safePage = Math.min(page, totalPages);
          const startIdx = (safePage - 1) * ANNOUNCEMENTS_PER_PAGE;
          const pageItems = activeList.slice(startIdx, startIdx + ANNOUNCEMENTS_PER_PAGE);
          const pageStartLabel = activeList.length === 0 ? 0 : startIdx + 1;
          const pageEndLabel = startIdx + pageItems.length;

          const listScrollStyles = {
            '&::-webkit-scrollbar': { width: '10px' },
            '&::-webkit-scrollbar-track': { background: 'gray.100', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb': { background: '#a0aec0', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb:hover': { background: '#718096' },
            scrollbarWidth: 'thin',
            scrollbarColor: '#a0aec0 #edf2f7',
          };

          const renderCard = (announcement) => {
            const isArchived = announcement.isArchived;
            return (
              <Box
                key={announcement._id}
                p={3}
                border="1px"
                borderColor={isArchived ? 'whiteAlpha.300' : borderColor}
                borderRadius="md"
                bg={isArchived ? 'whiteAlpha.100' : 'transparent'}
                _hover={!isArchived ? { bg: hoverBg } : undefined}
              >
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={1} flex="1">
                    <HStack spacing={2} flexWrap="wrap">
                      <Text fontWeight="bold" fontSize="sm">{announcement.title}</Text>
                      {isArchived && (
                        <Text fontSize="xs" color="gray.500" fontWeight="normal">📦 Past</Text>
                      )}
                    </HStack>
                    <Text fontSize="xs" color="gray.600" noOfLines={2}>
                      {announcement.content}
                    </Text>
                    <Text fontSize="xs" color="gray.500" fontStyle="italic">
                      Posted {new Date(announcement.createdAt).toLocaleDateString()}
                      {announcement.expiresAt && ` • Expires ${new Date(announcement.expiresAt).toLocaleDateString()}`}
                    </Text>
                    {!isArchived && announcement.expiresAt && new Date(announcement.expiresAt) < new Date() && (
                      <HStack spacing={1}>
                        <WarningIcon color="orange.400" boxSize={3} />
                        <Text fontSize="xs" color="orange.400" fontWeight="bold">Expired — hidden from public site</Text>
                      </HStack>
                    )}
                  </VStack>
                  {!isArchived && (
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
                  )}
                </HStack>
              </Box>
            );
          };

          return (
            <Tabs
              index={tabIndex}
              onChange={(idx) => { setTabIndex(idx); setPage(1); }}
              variant="line"
              colorScheme="blue"
              display="flex"
              flexDirection="column"
              flex="1"
              minH={0}
            >
              <TabList flexShrink={0}>
                <Tab>Current ({currentAnnouncements.length})</Tab>
                <Tab>Past ({pastAnnouncements.length})</Tab>
              </TabList>
              <TabPanels flex="1" display="flex" flexDirection="column" minH={0}>
                <TabPanel px={0} pt={3} pb={0} flex="1" display="flex" flexDirection="column" minH={0}>
                  <Text fontSize="xs" color="gray.500" flexShrink={0} mb={2}>
                    {activeList.length === 0
                      ? 'No announcements this month yet.'
                      : `Showing ${pageStartLabel}${pageItems.length > 1 ? `–${pageEndLabel}` : ''} of ${activeList.length} current announcement${activeList.length === 1 ? '' : 's'}`}
                  </Text>
                  {isLoadingAnnouncements ? (
                    <Spinner />
                  ) : (
                    <VStack spacing={2} align="stretch" overflowY="auto" flex="1" pr={2} sx={listScrollStyles}>
                      {pageItems.map(renderCard)}
                    </VStack>
                  )}
                </TabPanel>
                <TabPanel px={0} pt={3} pb={0} flex="1" display="flex" flexDirection="column" minH={0}>
                  <Text fontSize="xs" color="gray.500" flexShrink={0} mb={2}>
                    {activeList.length === 0
                      ? 'No past announcements yet. Announcements automatically move here at the start of each new month, and any you delete are preserved here too.'
                      : `Showing ${pageStartLabel}${pageItems.length > 1 ? `–${pageEndLabel}` : ''} of ${activeList.length} past announcement${activeList.length === 1 ? '' : 's'}`}
                  </Text>
                  {isLoadingAnnouncements ? (
                    <Spinner />
                  ) : (
                    <VStack spacing={2} align="stretch" overflowY="auto" flex="1" pr={2} sx={listScrollStyles}>
                      {pageItems.map(renderCard)}
                    </VStack>
                  )}
                </TabPanel>
              </TabPanels>
              {totalPages > 1 && (
                <Flex justifyContent="center" alignItems="center" gap={2} pt={3} flexShrink={0}>
                  <Button size="xs" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} isDisabled={safePage === 1}>Prev</Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <Button
                      key={n}
                      size="xs"
                      variant={n === safePage ? 'solid' : 'outline'}
                      colorScheme={n === safePage ? 'blue' : 'gray'}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </Button>
                  ))}
                  <Button size="xs" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} isDisabled={safePage === totalPages}>Next</Button>
                </Flex>
              )}
            </Tabs>
          );
        })()}
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
              <Box width="100%">
                <Text fontSize="sm" color="gray.500" mb={1}>Expiration Date (optional)</Text>
                <Input
                  type="date"
                  value={editingAnnouncement?.expiresAt || ''}
                  onChange={(e) => setEditingAnnouncement({
                    ...editingAnnouncement,
                    expiresAt: e.target.value
                  })}
                />
              </Box>
              <Box width="100%">
                <Text fontSize="sm" color="gray.500" mb={1}>Image/Flyer (optional, max 2MB)</Text>
                <Input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  size="sm"
                  sx={{
                    '::file-selector-button': {
                      height: '32px',
                      padding: '0 12px',
                      marginRight: '12px',
                      background: 'gray.600',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }
                  }}
                />
                {editImagePreview && (
                  <Box position="relative" mt={2} maxW="250px">
                    <Image
                      src={editImagePreview}
                      alt="Preview"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.600"
                    />
                    <IconButton
                      aria-label="Remove image"
                      icon={<CloseIcon />}
                      size="xs"
                      colorScheme="red"
                      position="absolute"
                      top={1}
                      right={1}
                      onClick={handleRemoveEditImage}
                    />
                  </Box>
                )}
              </Box>
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
