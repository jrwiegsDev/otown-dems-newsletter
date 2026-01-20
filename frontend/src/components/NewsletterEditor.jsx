import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
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
  TableContainer,
  Text,
  VStack,
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';
import newsletterService from '../services/newsletterService';

// --- IMAGE COMPRESSION UTILITY ---
// Compresses images before embedding to prevent 413 errors and improve email deliverability
const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Use better image smoothing for quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed JPEG (or PNG if transparency needed)
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        
        // Log compression results
        const originalSize = (file.size / 1024).toFixed(1);
        const compressedSize = (compressedDataUrl.length * 0.75 / 1024).toFixed(1); // Base64 is ~33% larger
        console.log(`📸 Image compressed: ${originalSize}KB → ${compressedSize}KB (${Math.round((1 - compressedSize/originalSize) * 100)}% reduction)`);
        
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const NewsletterEditor = ({ selectedEmails = [], selectedCount = 0, totalSubscribers = 0 }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine if we're sending to selected subscribers only
  // Only true when some (but not all and not none) are selected
  const isSendingToSelected = selectedCount > 0 && selectedCount < totalSubscribers;
  
  // Draft state
  const [isDraft, setIsDraft] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null); // Track if editing existing draft
  const [draftToDelete, setDraftToDelete] = useState(null);

  // State for confirmation dialog
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const cancelRef = useRef();
  const onClose = () => setIsAlertOpen(false);
  
  // Drafts modal
  const { isOpen: isDraftsModalOpen, onOpen: onDraftsModalOpen, onClose: onDraftsModalClose } = useDisclosure();
  
  // Delete draft confirmation
  const [isDeleteDraftAlertOpen, setIsDeleteDraftAlertOpen] = useState(false);
  const deleteDraftCancelRef = useRef();
  
  // Quill editor ref for custom image handler
  const quillRef = useRef(null);

  // Fetch drafts when modal opens
  const fetchDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const data = await newsletterService.getDrafts(user.token);
      setDrafts(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch drafts',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingDrafts(false);
    }
  };

  // Fetch drafts count on mount
  useEffect(() => {
    const fetchDraftsCount = async () => {
      try {
        const data = await newsletterService.getDrafts(user.token);
        setDrafts(data);
      } catch (error) {
        // Silently fail on initial load
        console.error('Failed to fetch drafts count:', error);
      }
    };
    fetchDraftsCount();
  }, [user.token]);

  const handleOpenDraftsModal = () => {
    fetchDrafts();
    onDraftsModalOpen();
  };

  // Load a draft into the editor
  const handleLoadDraft = async (draftId) => {
    try {
      const draft = await newsletterService.getDraft(draftId, user.token);
      setSubject(draft.subject);
      setContent(draft.htmlContent);
      setCurrentDraftId(draft._id);
      setIsDraft(true); // Set as draft mode
      onDraftsModalClose();
      toast({
        title: 'Draft Loaded',
        description: 'Draft loaded into editor. Uncheck "Draft?" to send.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load draft',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Save or update draft
  const handleSaveDraft = async () => {
    if (!subject || !content) {
      toast({
        title: 'Error',
        description: 'Subject and content are required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      if (currentDraftId) {
        // Update existing draft
        await newsletterService.updateDraft(currentDraftId, { subject, htmlContent: content }, user.token);
        toast({
          title: 'Draft Updated',
          description: 'Your draft has been updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new draft
        await newsletterService.createDraft({ subject, htmlContent: content }, user.token);
        toast({
          title: 'Draft Saved',
          description: 'Your draft has been saved.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      // Reset the editor
      setSubject('');
      setContent('');
      setIsDraft(false);
      setCurrentDraftId(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save draft',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a draft
  const handleDeleteDraft = async () => {
    if (!draftToDelete) return;
    
    try {
      await newsletterService.deleteDraft(draftToDelete._id, user.token);
      toast({
        title: 'Draft Deleted',
        description: 'The draft has been deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // If we deleted the currently loaded draft, reset the editor
      if (currentDraftId === draftToDelete._id) {
        setSubject('');
        setContent('');
        setIsDraft(false);
        setCurrentDraftId(null);
      }
      // Refresh the drafts list
      fetchDrafts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete draft',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleteDraftAlertOpen(false);
      setDraftToDelete(null);
    }
  };

  const openDeleteDraftAlert = (draft) => {
    setDraftToDelete(draft);
    setIsDeleteDraftAlertOpen(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // --- CUSTOM IMAGE HANDLER WITH COMPRESSION ---
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      // Show loading toast for large images
      const isLargeImage = file.size > 500 * 1024; // 500KB
      let loadingToast;
      if (isLargeImage) {
        loadingToast = toast({
          title: 'Compressing image...',
          description: `Optimizing ${(file.size / 1024 / 1024).toFixed(1)}MB image for email`,
          status: 'info',
          duration: null,
          isClosable: false,
        });
      }

      try {
        // Compress the image
        const compressedDataUrl = await compressImage(file, 800, 800, 0.8);
        
        // Get the Quill editor instance and insert the image
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', compressedDataUrl);
          quill.setSelection(range.index + 1);
        }

        // Close loading toast and show success
        if (loadingToast) {
          toast.close(loadingToast);
        }
        toast({
          title: 'Image added',
          description: 'Image has been compressed and added to the newsletter',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error compressing image:', error);
        if (loadingToast) {
          toast.close(loadingToast);
        }
        toast({
          title: 'Error',
          description: 'Failed to process image. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
  }, [toast]);

  // --- Define the COMPREHENSIVE toolbar configuration ---
  // useMemo to prevent re-creating modules on every render
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler  // Use our custom compressed image handler
      }
    },
  }), [imageHandler]);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'color', 'background',
    'script',
    'blockquote', 'code-block',
    'list', 'bullet', 'indent', 'direction',
    'align',
    'link', 'image', 'video',
    'clean'
  ];
  // --- END OF NEW CONFIGURATION ---

  const handleSendConfirm = async () => {
    setIsLoading(true);
    onClose();
    try {
      // If sending to selected subscribers, include their emails
      const payload = {
        subject,
        htmlContent: content,
      };
      
      // Only include selectedEmails if we're sending to a subset
      if (isSendingToSelected) {
        payload.selectedEmails = selectedEmails;
      }
      
      const response = await newsletterService.sendNewsletter(payload, user.token);
      toast({
        title: 'Success!',
        description: response.message || "Newsletter sending initiated!",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setSubject('');
      setContent('');
      setIsDraft(false);
      setCurrentDraftId(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to initiate sending.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <VStack spacing={4} align="stretch" h="100%">
        {/* Header row with Draft checkbox and Drafts button */}
        <Flex justifyContent="space-between" alignItems="center">
          <HStack spacing={3}>
            <Checkbox 
              isChecked={isDraft} 
              onChange={(e) => setIsDraft(e.target.checked)}
              colorScheme="blue"
            >
              Draft?
            </Checkbox>
            {currentDraftId && (
              <Badge colorScheme="blue" fontSize="sm">Editing Draft</Badge>
            )}
          </HStack>
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={handleOpenDraftsModal}
          >
            📁 Drafts ({drafts.length})
          </Button>
        </Flex>

        <FormControl isRequired flexShrink={0}>
          <FormLabel>Subject</FormLabel>
          <Input
            placeholder="Newsletter Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </FormControl>

        <Box flex="1" minH="300px" display="flex" flexDirection="column">
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          />
        </Box>

        {isDraft ? (
          <HStack spacing={3}>
            <Button
              colorScheme="blue"
              onClick={handleSaveDraft}
              isLoading={isLoading}
              isDisabled={!subject || !content}
              flex="1"
            >
              {currentDraftId ? 'Update Draft' : 'Save Draft Newsletter'}
            </Button>
            <Button
              variant="outline"
              colorScheme="gray"
              onClick={() => {
                setSubject('');
                setContent('');
                setIsDraft(false);
                setCurrentDraftId(null);
              }}
              isDisabled={!subject && !content}
            >
              Clear
            </Button>
          </HStack>
        ) : (
          <HStack spacing={3}>
            <Button
              colorScheme={isSendingToSelected ? "orange" : "green"}
              onClick={() => setIsAlertOpen(true)}
              isLoading={isLoading}
              isDisabled={!subject || !content}
              flex="1"
            >
              {isSendingToSelected 
                ? `Email ${selectedCount} Selected Subscriber${selectedCount !== 1 ? 's' : ''}`
                : 'Send Newsletter'
              }
            </Button>
            <Button
              variant="outline"
              colorScheme="gray"
              onClick={() => {
                setSubject('');
                setContent('');
                setCurrentDraftId(null);
              }}
              isDisabled={!subject && !content}
            >
              Clear
            </Button>
          </HStack>
        )}
      </VStack>

      {/* Send Newsletter Confirmation Dialog */}
      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {isSendingToSelected ? 'Email Selected Subscribers' : 'Send Newsletter'}
            </AlertDialogHeader>
            <AlertDialogBody>
              {isSendingToSelected 
                ? `Are you sure you want to send this email to ${selectedCount} selected subscriber${selectedCount !== 1 ? 's' : ''}?`
                : 'Are you sure you want to send this newsletter to all subscribers?'
              }
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme={isSendingToSelected ? "orange" : "green"} 
                onClick={handleSendConfirm} 
                ml={3} 
                isLoading={isLoading}
              >
                Confirm & Send
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Drafts Modal */}
      <Modal isOpen={isDraftsModalOpen} onClose={onDraftsModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Newsletter Drafts</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {loadingDrafts ? (
              <Flex justify="center" py={8}>
                <Spinner size="lg" />
              </Flex>
            ) : drafts.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={8}>
                No drafts saved yet. Check "Draft?" and save a newsletter to create one.
              </Text>
            ) : (
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Subject</Th>
                      <Th>Created By</Th>
                      <Th>Last Updated</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {drafts.map((draft) => (
                      <Tr 
                        key={draft._id} 
                        _hover={{ bg: 'gray.700', cursor: 'pointer' }}
                        onClick={() => handleLoadDraft(draft._id)}
                      >
                        <Td maxW="200px" isTruncated>{draft.subject}</Td>
                        <Td>{draft.createdByName}</Td>
                        <Td fontSize="sm">{formatDate(draft.updatedAt)}</Td>
                        <Td onClick={(e) => e.stopPropagation()}>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<EditIcon />}
                              size="sm"
                              colorScheme="yellow"
                              aria-label="Edit draft"
                              onClick={() => handleLoadDraft(draft._id)}
                            />
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              aria-label="Delete draft"
                              onClick={() => openDeleteDraftAlert(draft)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </ModalBody>
          <ModalFooter>
            <Text fontSize="sm" color="gray.500" mr="auto">
              {drafts.length}/10 drafts used
            </Text>
            <Button variant="ghost" onClick={onDraftsModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Draft Confirmation */}
      <AlertDialog
        isOpen={isDeleteDraftAlertOpen}
        leastDestructiveRef={deleteDraftCancelRef}
        onClose={() => setIsDeleteDraftAlertOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Draft
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete the draft "{draftToDelete?.subject}"? This cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={deleteDraftCancelRef} onClick={() => setIsDeleteDraftAlertOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteDraft} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default NewsletterEditor;