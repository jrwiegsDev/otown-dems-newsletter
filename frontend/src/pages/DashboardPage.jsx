import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useSubscribers from '../hooks/useSubscribers';
import useEvents from '../hooks/useEvents';
import { useAnnouncements } from '../hooks/useAnnouncements';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import NewsletterDashboard from './NewsletterDashboard';
import CalendarDashboard from './CalendarDashboard';
import 'react-calendar/dist/Calendar.css';

const DashboardPage = () => {
  const { user } = useAuth();

  // Use custom hooks for data management
  const subscriberHook = useSubscribers(user);
  const eventHook = useEvents(user);
  const announcementHook = useAnnouncements();

  // State for dashboard view
  const [currentView, setCurrentView] = useState('newsletter');

  const handleViewChange = () => {
    setCurrentView(currentView === 'newsletter' ? 'calendar' : 'newsletter');
  };

  return (
    <DashboardLayout currentView={currentView} onViewChange={handleViewChange}>
      {currentView === 'newsletter' ? (
        <NewsletterDashboard {...subscriberHook} />
      ) : (
        <CalendarDashboard {...eventHook} {...announcementHook} />
      )}
    </DashboardLayout>
  );
};

export default DashboardPage;