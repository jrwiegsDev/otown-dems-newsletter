import Calendar from 'react-calendar';
import { Box } from '@chakra-ui/react';

const EventCalendar = ({ events, colorMode, onDateClick }) => {
  const eventDates = new Set(
    events.map(event => {
      const date = new Date(event.eventDate);
      const correctedDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      return correctedDate.toDateString();
    })
  );

  const tileClassName = ({ date, view }) => {
    if (view === 'month' && eventDates.has(date.toDateString())) {
      return 'event-day';
    }
  };

  return (
    <Box className={colorMode} mt={4}>
      <Calendar 
        tileClassName={tileClassName} 
        onClickDay={(date) => onDateClick(date)} // <-- ADD THIS LINE
      />
    </Box>
  );
};

export default EventCalendar;