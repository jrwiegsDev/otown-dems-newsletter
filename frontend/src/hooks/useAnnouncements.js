// frontend/src/hooks/useAnnouncements.js

import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import * as announcementService from '../services/announcementService';

export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const toast = useToast();

  // Fetch all announcements
  const fetchAnnouncements = async () => {
    setIsLoadingAnnouncements(true);
    try {
      const data = await announcementService.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      toast({
        title: 'Error fetching announcements',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  // Create a new announcement
  const createAnnouncement = async (announcementData) => {
    try {
      await announcementService.createAnnouncement(announcementData);
      toast({
        title: 'Announcement Posted!',
        description: 'Your announcement is now live on the OADC site.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      await fetchAnnouncements();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to post announcement.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };

  // Update an announcement
  const updateAnnouncement = async (id, announcementData) => {
    try {
      await announcementService.updateAnnouncement(id, announcementData);
      toast({
        title: 'Announcement Updated',
        description: 'The announcement has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await fetchAnnouncements();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update announcement.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };

  // Delete an announcement
  const deleteAnnouncement = async (id) => {
    try {
      await announcementService.deleteAnnouncement(id);
      toast({
        title: 'Announcement Deleted',
        description: 'The announcement has been removed.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await fetchAnnouncements();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete announcement.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return {
    announcements,
    isLoadingAnnouncements,
    fetchAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  };
};
