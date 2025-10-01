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

  const handleSendConfirm = async () => {
    setIsLoading(true);
    try {
      await newsletterService.sendNewsletter(
        { subject, htmlContent: content },
        user.token
      );
      toast({
        title: 'Success!',
        description: 'Newsletter has been sent.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setSubject('');
      setContent('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send newsletter.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      onClose();
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

        <Box flex="1" h="100%">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
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
              <Button colorScheme="green" onClick={handleSendConfirm} ml={3}>
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