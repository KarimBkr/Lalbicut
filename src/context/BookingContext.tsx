import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking, WorkingHours, DEFAULT_WORKING_HOURS } from '../data/constants';
import { subscribeToBookings, subscribeToBlockedSlots, subscribeToWorkingHours } from '../lib/db';

interface BookingContextType {
  bookings: Booking[];
  blockedSlots: string[];
  workingHours: WorkingHours;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: React.ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS);

  useEffect(() => {
    const unsubBookings = subscribeToBookings(setBookings);
    const unsubSlots = subscribeToBlockedSlots(setBlockedSlots);
    const unsubHours = subscribeToWorkingHours(setWorkingHours);
    return () => {
      unsubBookings();
      unsubSlots();
      unsubHours();
    };
  }, []);

  return (
    <BookingContext.Provider value={{ bookings, blockedSlots, workingHours }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookingContext = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBookingContext must be used within a BookingProvider");
  return context;
};
