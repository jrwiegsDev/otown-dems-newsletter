import { useState, useEffect } from 'react';
import subscriberService from '../services/subscriberService';
import { useToast } from '@chakra-ui/react';

const useSubscribers = (user) => {
  const [subscribers, setSubscribers] = useState([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  // Fetch all subscribers
  const fetchSubscribers = async () => {
    setIsLoadingSubscribers(true);
    try {
      if (user?.token) {
        const data = await subscriberService.getSubscribers(user.token);
        setSubscribers(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscribers', error);
      toast({
        title: 'Error fetching subscribers',
        description: 'Could not load subscribers. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    if (user) {
      fetchSubscribers();
    }
  }, [user]);

  // Delete subscriber
  const deleteSubscriber = async (subscriberId) => {
    try {
      await subscriberService.deleteSubscriber(subscriberId, user.token);
      toast({
        title: 'Success!',
        description: 'Subscriber has been deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setSubscribers(subscribers.filter((sub) => sub._id !== subscriberId));
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete subscriber.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };

  // Update subscriber
  const updateSubscriber = async (subscriberId, subscriberData) => {
    try {
      const updatedSubscriber = await subscriberService.updateSubscriber(
        subscriberId, 
        subscriberData, 
        user.token
      );
      toast({
        title: 'Success!',
        description: 'Subscriber has been updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setSubscribers(subscribers.map(sub => 
        sub._id === updatedSubscriber._id ? updatedSubscriber : sub
      ));
      return updatedSubscriber;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update subscriber.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    }
  };

  // Filter subscribers based on search term
  const filteredSubscribers = (subscribers || []).filter((subscriber) => {
    const searchString = searchTerm.toLowerCase();
    return (
      subscriber.firstName?.toLowerCase().includes(searchString) ||
      subscriber.lastName?.toLowerCase().includes(searchString) ||
      subscriber.email?.toLowerCase().includes(searchString)
    );
  });

  return {
    subscribers,
    isLoadingSubscribers,
    searchTerm,
    setSearchTerm,
    filteredSubscribers,
    fetchSubscribers,
    deleteSubscriber,
    updateSubscriber,
  };
};

export default useSubscribers;
