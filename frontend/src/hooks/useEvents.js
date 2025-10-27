import { useState, useEffect } from 'react';
import eventService from '../services/eventService';
import { useToast } from '@chakra-ui/react';

const useEvents = (user) => {
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const toast = useToast();

  // Fetch all events
  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const data = await eventService.getAllEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events', error);
      toast({
        title: 'Error fetching events',
        description: 'Could not load events. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  // Delete event
  const deleteEvent = async (eventId) => {
    try {
      await eventService.deleteEvent(eventId, user.token);
      setEvents(events.filter((event) => event._id !== eventId));
      toast({ 
        title: 'Event Deleted', 
        status: 'success', 
        duration: 3000, 
        isClosable: true 
      });
      return true;
    } catch (error) {
      toast({ 
        title: 'Error deleting event', 
        status: 'error', 
        duration: 5000, 
        isClosable: true 
      });
      return false;
    }
  };

  // Update event
  const updateEvent = async (eventId, eventData) => {
    try {
      const updatedEvent = await eventService.updateEvent(eventId, eventData, user.token);
      setEvents(events.map(event => event._id === updatedEvent._id ? updatedEvent : event));
      toast({ 
        title: 'Event Updated', 
        status: 'success', 
        duration: 3000, 
        isClosable: true 
      });
      return updatedEvent;
    } catch (error) {
      toast({ 
        title: 'Error updating event', 
        status: 'error', 
        duration: 5000, 
        isClosable: true 
      });
      return null;
    }
  };

  // Toggle banner event
  const toggleBannerEvent = async (event) => {
    // Check if event is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(event.eventDate);
    const correctedDate = new Date(
      eventDate.getUTCFullYear(), 
      eventDate.getUTCMonth(), 
      eventDate.getUTCDate()
    );
    
    if (correctedDate < today) {
      toast({ 
        title: 'Cannot set past events as banner event', 
        status: 'warning', 
        duration: 3000, 
        isClosable: true 
      });
      return false;
    }

    try {
      const updatedEvent = await eventService.toggleBannerEvent(event._id, user.token);
      // Update the events list
      setEvents(events.map(e => {
        if (e._id === updatedEvent._id) {
          return updatedEvent;
        } else if (updatedEvent.isBannerEvent && e.isBannerEvent) {
          // If the updated event is now banner, unset others
          return { ...e, isBannerEvent: false };
        }
        return e;
      }));
      toast({ 
        title: updatedEvent.isBannerEvent ? 'Banner event set' : 'Banner event removed', 
        status: 'success', 
        duration: 3000, 
        isClosable: true 
      });
      return true;
    } catch (error) {
      toast({ 
        title: 'Error toggling banner event', 
        description: error.response?.data?.message || 'An error occurred',
        status: 'error', 
        duration: 5000, 
        isClosable: true 
      });
      return false;
    }
  };

  // Helper to check if event is in the past
  const isEventPast = (eventDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(eventDate);
    const correctedDate = new Date(
      date.getUTCFullYear(), 
      date.getUTCMonth(), 
      date.getUTCDate()
    );
    return correctedDate < today;
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.eventDate);
      const correctedDate = new Date(
        eventDate.getUTCFullYear(), 
        eventDate.getUTCMonth(), 
        eventDate.getUTCDate()
      );
      return correctedDate.toDateString() === date.toDateString();
    });
  };

  return {
    events,
    isLoadingEvents,
    fetchEvents,
    deleteEvent,
    updateEvent,
    toggleBannerEvent,
    isEventPast,
    getEventsForDate,
  };
};

export default useEvents;
