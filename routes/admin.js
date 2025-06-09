const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Reservation, Room, Guest, Payment, RoomType } = require('../config/models');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/admin/login');
  }
};

// Admin login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { 
    title: 'Admin Login - HotelIn',
    error: null
  });
});

// Process admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findByUsername(username);
    if (!user) {
      return res.render('admin/login', {
        title: 'Admin Login - HotelIn',
        error: 'Invalid username or password'
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.render('admin/login', {
        title: 'Admin Login - HotelIn',
        error: 'Invalid username or password'
      });
    }
    
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    
    res.redirect('/admin/dashboard');
    
  } catch (error) {
    console.error(error);
    res.render('admin/login', {
      title: 'Admin Login - HotelIn',
      error: 'Login failed. Please try again.'
    });
  }
});

// Admin logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Admin dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const reservations = await Reservation.getAll();
    const rooms = await Room.getAll();
    const payments = await Payment.getAll();
    
    // Calculate statistics
    const totalReservations = reservations.length;
    const activeReservations = reservations.filter(r => r.status === 'booked' || r.status === 'checked_in').length;
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.status === 'avaible').length;
    const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard - HotelIn',
      user: req.session.user,
      stats: {
        totalReservations,
        activeReservations,
        totalRooms,
        availableRooms,
        totalRevenue
      },
      recentReservations: reservations.slice(0, 5),
      recentPayments: payments.slice(0, 5)
    });
    
  } catch (error) {
    console.error(error);
    res.render('error', { 
      title: 'Dashboard Error',
      message: 'Unable to load dashboard',
      error
    });
  }
});

// Reservations management
router.get('/reservations', requireAuth, async (req, res) => {
  try {
    const reservations = await Reservation.getAll();
    res.render('admin/reservations', {
      title: 'Manage Reservations - HotelIn',
      user: req.session.user,
      reservations
    });
  } catch (error) {
    console.error(error);
    res.render('error', { 
      title: 'Error',
      message: 'Unable to load reservations',
      error
    });
  }
});

// Update reservation status
router.post('/reservations/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const reservationId = req.params.id;
    
    await Reservation.updateStatus(reservationId, status);
    
    // If checking out, make room available
    if (status === 'completed') {
      const reservation = await Reservation.findById(reservationId);
      if (reservation) {
        await Room.updateStatus(reservation.room_id, 'avaible');
      }
    }
    
    res.redirect('/admin/reservations');
  } catch (error) {
    console.error(error);
    res.redirect('/admin/reservations');
  }
});

// Rooms management
router.get('/rooms', requireAuth, async (req, res) => {
  try {
    const rooms = await Room.getAll();
    const roomTypes = await RoomType.getAll();
    res.render('admin/rooms', {
      title: 'Manage Rooms - HotelIn',
      user: req.session.user,
      rooms,
      roomTypes
    });
  } catch (error) {
    console.error(error);
    res.render('error', { 
      title: 'Error',
      message: 'Unable to load rooms',
      error
    });
  }
});

// Update room status
router.post('/rooms/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const roomId = req.params.id;
    
    await Room.updateStatus(roomId, status);
    res.redirect('/admin/rooms');
  } catch (error) {
    console.error(error);
    res.redirect('/admin/rooms');
  }
});

// Guests management
router.get('/guests', requireAuth, async (req, res) => {
  try {
    const guests = await Guest.getAll();
    res.render('admin/guests', {
      title: 'Manage Guests - HotelIn',
      user: req.session.user,
      guests
    });
  } catch (error) {
    console.error(error);
    res.render('error', { 
      title: 'Error',
      message: 'Unable to load guests',
      error
    });
  }
});

// Payments management
router.get('/payments', requireAuth, async (req, res) => {
  try {
    const payments = await Payment.getAll();
    res.render('admin/payments', {
      title: 'Manage Payments - HotelIn',
      user: req.session.user,
      payments
    });
  } catch (error) {
    console.error(error);
    res.render('error', { 
      title: 'Error',
      message: 'Unable to load payments',
      error
    });
  }
});

module.exports = router;

