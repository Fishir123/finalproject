const express = require('express');
const router = express.Router();
const { Guest, Room, Reservation, Payment } = require('../config/models');

// Middleware to check if room is available
const checkRoomAvailability = async (req, res, next) => {
  try {
    const { room_id, check_in, check_out } = req.body;
    const availableRooms = await Room.getAvailable(check_in, check_out);
    const isAvailable = availableRooms.some(room => room.id == room_id);
    
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Room is not available for the selected dates'
      });
    }
    
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error checking room availability'
    });
  }
};

// Show reservation form
router.get('/book/:roomId', async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
      return res.status(404).render('error', {
        title: 'Room Not Found',
        message: 'The room you are trying to book does not exist.',
        error: { status: 404 }
      });
    }
    
    res.render('reservation-form', { 
      title: `Book ${room.type_name} - Room ${room.room_number}`,
      room
    });
  } catch (error) {
    console.error(error);
    res.render('error', { 
      title: 'Error',
      message: 'Unable to load booking form',
      error
    });
  }
});

// Process reservation
router.post('/book', checkRoomAvailability, async (req, res) => {
  try {
    const { 
      room_id, 
      check_in, 
      check_out, 
      guest_name, 
      guest_email, 
      guest_phone, 
      guest_address,
      payment_method 
    } = req.body;
    
    // Calculate total amount
    const room = await Room.findById(room_id);
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalAmount = room.price * nights;
    
    // Check if guest exists
    let guest = await Guest.findByEmail(guest_email);
    if (!guest) {
      // Create new guest
      const guestId = await Guest.create({
        name: guest_name,
        email: guest_email,
        phone: guest_phone,
        address: guest_address
      });
      guest = await Guest.findById(guestId);
    }
    
    // Create reservation
    const reservationId = await Reservation.create({
      guest_id: guest.id,
      room_id: room_id,
      check_in: check_in,
      check_out: check_out
    });
    
    // Create payment record
    await Payment.create({
      reservation_id: reservationId,
      amount: totalAmount,
      method: payment_method
    });
    
    // Update room status
    await Room.updateStatus(room_id, 'booked');
    
    res.render('reservation-success', {
      title: 'Booking Confirmed - HotelIn',
      reservation: {
        id: reservationId,
        guest_name,
        room_number: room.room_number,
        room_type: room.type_name,
        check_in,
        check_out,
        nights,
        total_amount: totalAmount
      }
    });
    
  } catch (error) {
    console.error(error);
    res.render('error', { 
      title: 'Booking Error',
      message: 'Unable to process your booking. Please try again.',
      error
    });
  }
});

// Check reservation status
router.get('/status', (req, res) => {
  res.render('reservation-status', {
    title: 'Check Reservation Status - HotelIn'
  });
});

// Get reservation details
router.post('/status', async (req, res) => {
  try {
    const { email, reservation_id } = req.body;
    
    let reservation;
    if (reservation_id) {
      reservation = await Reservation.findById(reservation_id);
    } else if (email) {
      const guest = await Guest.findByEmail(email);
      if (guest) {
        const reservations = await Reservation.getByGuestId(guest.id);
        reservation = reservations[0]; // Get latest reservation
      }
    }
    
    if (!reservation) {
      return res.render('reservation-status', {
        title: 'Check Reservation Status - HotelIn',
        error: 'No reservation found with the provided information.'
      });
    }
    
    const payments = await Payment.getByReservationId(reservation.id);
    
    res.render('reservation-details', {
      title: 'Reservation Details - HotelIn',
      reservation,
      payments
    });
    
  } catch (error) {
    console.error(error);
    res.render('error', { 
      title: 'Error',
      message: 'Unable to check reservation status',
      error
    });
  }
});

module.exports = router;

