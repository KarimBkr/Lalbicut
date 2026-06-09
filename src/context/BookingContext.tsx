import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking } from '../data/constants';
import { subscribeToBookings, subscribeToBlockedSlots } from '../lib/db';

interface BookingContextType {
  bookings: Booking[];
  blockedSlots: string[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: React.ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);

  useEffect(() => {
    const unsubBookings = subscribeToBookings((data) => {
      setBookings(data);
    });
    const unsubSlots = subscribeToBlockedSlots((data) => {
      setBlockedSlots(data);
    });
    
    return () => {
      unsubBookings();
      unsubSlots();
    };
  }, []);

  return (
    <BookingContext.Provider value={{ bookings, blockedSlots }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookingContext = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBookingContext must be used within a BookingProvider");
  return context;
};

