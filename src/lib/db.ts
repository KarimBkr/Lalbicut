import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Booking, LoyaltyConfig } from '../data/constants';

// Collection references
const bookingsRef = collection(db, 'bookings');
const settingsRef = collection(db, 'settings'); // For blocked slots

// Listen to bookings
export const subscribeToBookings = (callback: (bookings: Booking[]) => void) => {
  return onSnapshot(bookingsRef, (snapshot) => {
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    callback(bookings);
  });
};

export const subscribeToUserBookings = (userId: string, callback: (bookings: Booking[]) => void) => {
  const q = query(bookingsRef, where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    callback(bookings);
  });
};

// Add or Update a booking
export const saveBooking = async (booking: Booking) => {
  const docRef = doc(bookingsRef, booking.id);
  await setDoc(docRef, booking);
};

// Update booking status
export const updateBookingStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
  const docRef = doc(bookingsRef, id);
  await updateDoc(docRef, { status });
};

// Listen to blocked slots
export const subscribeToBlockedSlots = (callback: (slots: string[]) => void) => {
  const docRef = doc(settingsRef, 'blockedSlots');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().slots || []);
    } else {
      callback([]);
    }
  });
};

// Update blocked slots
export const saveBlockedSlots = async (slots: string[]) => {
  const docRef = doc(settingsRef, 'blockedSlots');
  await setDoc(docRef, { slots });
};

// Listen to loyalty program config
export const subscribeLoyaltyProgram = (callback: (config: LoyaltyConfig | null) => void) => {
  const docRef = doc(settingsRef, 'loyaltyProgram');
  return onSnapshot(docRef, (snap) => {
    callback(snap.exists() ? (snap.data() as LoyaltyConfig) : null);
  });
};

// Save loyalty program config
export const saveLoyaltyProgram = async (config: LoyaltyConfig) => {
  const docRef = doc(settingsRef, 'loyaltyProgram');
  await setDoc(docRef, config);
};
