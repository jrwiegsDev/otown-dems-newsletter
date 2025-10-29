import { useState, useEffect } from 'react';
import volunteerService from '../services/volunteerService';
import { useToast } from '@chakra-ui/react';

const useVolunteers = (user) => {
  const [volunteers, setVolunteers] = useState([]);
  const [isLoadingVolunteers, setIsLoadingVolunteers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  // Fetch all volunteers
  const fetchVolunteers = async () => {
    setIsLoadingVolunteers(true);
    try {
      if (user?.token) {
        const data = await volunteerService.getVolunteers(user.token);
        setVolunteers(data);
      }
    } catch (error) {
      console.error('Failed to fetch volunteers', error);
      toast({
        title: 'Error fetching volunteers',
        description: 'Could not load volunteers. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingVolunteers(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    if (user) {
      fetchVolunteers();
    }
  }, [user]);

  // Delete volunteer
  const deleteVolunteer = async (volunteerId) => {
    try {
      await volunteerService.deleteVolunteer(volunteerId, user.token);
      toast({
        title: 'Success!',
        description: 'Volunteer has been removed.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setVolunteers(volunteers.filter((vol) => vol._id !== volunteerId));
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete volunteer.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };

  // Update volunteer
  const updateVolunteer = async (volunteerId, volunteerData) => {
    try {
      const updatedVolunteer = await volunteerService.updateVolunteer(
        volunteerId, 
        volunteerData, 
        user.token
      );
      toast({
        title: 'Success!',
        description: 'Volunteer has been updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setVolunteers(volunteers.map(vol => 
        vol._id === updatedVolunteer._id ? updatedVolunteer : vol
      ));
      return updatedVolunteer;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update volunteer.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    }
  };

  // Filter volunteers based on search term
  const filteredVolunteers = (volunteers || []).filter((volunteer) => {
    const searchString = searchTerm.toLowerCase();
    return (
      volunteer.firstName?.toLowerCase().includes(searchString) ||
      volunteer.lastName?.toLowerCase().includes(searchString) ||
      volunteer.email?.toLowerCase().includes(searchString)
    );
  });

  return {
    volunteers,
    isLoadingVolunteers,
    searchTerm,
    setSearchTerm,
    filteredVolunteers,
    fetchVolunteers,
    deleteVolunteer,
    updateVolunteer,
  };
};

export default useVolunteers;
