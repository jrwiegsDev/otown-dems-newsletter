import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useSubscribers from '../hooks/useSubscribers';
import useEvents from '../hooks/useEvents';
import { useAnnouncements } from '../hooks/useAnnouncements';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import NewsletterDashboard from './NewsletterDashboard';
import CalendarDashboard from './CalendarDashboard';
import AnalyticsDashboard from './AnalyticsDashboard';
import StaffManagement from '../components/StaffManagement';

const DashboardPage = () => {
  const { user } = useAuth();

  // Use custom hooks for data management
  const subscriberHook = useSubscribers(user);
  const eventHook = useEvents(user);
  const announcementHook = useAnnouncements();

  // State for dashboard view - now supports 4 views
  const [currentView, setCurrentView] = useState('newsletter');

  const renderView = () => {
    switch (currentView) {
      case 'newsletter':
        return <NewsletterDashboard {...subscriberHook} />;
      case 'calendar':
        return <CalendarDashboard {...eventHook} {...announcementHook} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'staff':
        return user?.role === 'superadmin' ? <StaffManagement user={user} /> : null;
      default:
        return <NewsletterDashboard {...subscriberHook} />;
    }
  };

  return (
    <DashboardLayout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </DashboardLayout>
  );
};

export default DashboardPage;