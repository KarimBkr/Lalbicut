import emailjs from '@emailjs/browser';
import type { Booking } from '../data/constants';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const TEMPLATE_CONFIRMATION = import.meta.env.VITE_EMAILJS_TEMPLATE_CONFIRMATION as string;
const TEMPLATE_CUSTOM = import.meta.env.VITE_EMAILJS_TEMPLATE_CUSTOM as string;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;

// La clé privée EmailJS est server-side uniquement — ne jamais l'exposer côté client
const emailjsOptions = PUBLIC_KEY;

const ADMIN_NOTIFY_EMAIL = 'lalbicuttz74@gmail.com';

export const isEmailConfigured = () =>
  !!(SERVICE_ID && TEMPLATE_CONFIRMATION && PUBLIC_KEY &&
    SERVICE_ID !== 'service_xxxxxxx');

export const sendConfirmationEmail = async (booking: Booking): Promise<void> => {
  if (!isEmailConfigured()) return;
  await emailjs.send(SERVICE_ID, TEMPLATE_CONFIRMATION, {
    to_email: booking.clientEmail,
    to_name: booking.clientName.split(' ')[0],
    service_name: booking.service.name,
    booking_date: booking.date,
    booking_slot: booking.slot,
    booking_price: `${booking.price}€`,
  }, emailjsOptions);
};

export const sendAdminNotification = async (booking: Booking): Promise<void> => {
  if (!isEmailConfigured()) return;
  await emailjs.send(SERVICE_ID, TEMPLATE_CUSTOM, {
    to_email: ADMIN_NOTIFY_EMAIL,
    to_name: 'Lalbi',
    message: `Nouvelle réservation — ${booking.clientName} · ${booking.service.name} · ${booking.date} à ${booking.slot} · ${booking.price}€\nTél : ${booking.clientPhone}`,
    service_name: booking.service.name,
    booking_date: booking.date,
    booking_slot: booking.slot,
    booking_price: `${booking.price}€`,
  }, emailjsOptions);
};

export const sendCustomEmail = async (booking: Booking, message: string): Promise<void> => {
  if (!isEmailConfigured()) throw new Error('EmailJS non configuré');
  await emailjs.send(SERVICE_ID, TEMPLATE_CUSTOM, {
    to_email: booking.clientEmail,
    to_name: booking.clientName.split(' ')[0],
    message,
    service_name: booking.service.name,
    booking_date: booking.date,
    booking_slot: booking.slot,
    booking_price: `${booking.price}€`,
  }, emailjsOptions);
};

export const openWhatsApp = (phone: string, message: string): void => {
  const cleaned = phone.replace(/[\s\-.]/g, '').replace(/^0/, '+33');
  window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, '_blank');
};
