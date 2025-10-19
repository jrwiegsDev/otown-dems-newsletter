import { useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import newsletterService from '../services/newsletterService';

const NewsletterEditor = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State for confirmation dialog
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const cancelRef = useRef();
  const onClose = () => setIsAlertOpen(false);

  // --- Define the COMPREHENSIVE toolbar configuration ---
  const modules = {
    toolbar: [
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
  };

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
      const response = await newsletterService.sendNewsletter(
        { subject, htmlContent: content },
        user.token
      );
      toast({
        title: 'Success!',
        description: response.message || "Newsletter sending initiated! You can close this window.",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setSubject('');
      setContent('');
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
        <FormControl isRequired>
          <FormLabel>Subject</FormLabel>
          <Input
            placeholder="Newsletter Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </FormControl>

        <Box flex="1" h="100%" overflow="hidden"> {/* Added overflow hidden */}
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules} // <-- Pass updated modules
            formats={formats} // <-- Pass updated formats
            style={{ height: 'calc(100% - 42px)' }}
          />
        </Box>

        <Button
          colorScheme="green"
          onClick={() => setIsAlertOpen(true)}
          isLoading={isLoading}
          isDisabled={!subject || !content}
        >
          Send Newsletter
        </Button>
      </VStack>

      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Send Newsletter
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to send this newsletter to all subscribers?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="green" onClick={handleSendConfirm} ml={3} isLoading={isLoading}>
                Confirm & Send
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default NewsletterEditor;