const express = require('express');
const router = express.Router();
const { Room, RoomType } = require('../config/models');

// Homepage
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.getAll();
    const roomTypes = await RoomType.getAll();
    
    res.render('index', { 
      title: 'HotelIn - Hotel Reservation System',
      rooms: rooms.slice(0, 6), // Show only 6 rooms on homepage
      roomTypes
    });
  } catch (error) {
    console.error(error);
    res.render('error', { 
      title: 'Error',
      message: 'Unable to load homepage',
      error
    });
  }
});

// Rooms page
router.get('/rooms', async (req, res) => {
  try {
    const { check_in, check_out, room_type } = req.query;
    let rooms;
    
    if (check_in && check_out) {
      rooms = await Room.getAvailable(check_in, check_out);
    } else {
      rooms = await Room.getAll();
    }
    
    if (room_type) {
      rooms = rooms.filter(room => room.room_type_id == room_type);
    }
    
    const roomTypes = await RoomType.getAll();
    
    res.render('rooms', { 
      title: 'Available Rooms - HotelIn',
      rooms,
      roomTypes,
      filters: { check_in, check_out, room_type }
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

// Room detail
router.get('/room/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).render('error', {
        title: 'Room Not Found',
        message: 'The room you are looking for does not exist.',
        error: { status: 404 }
      });
    }
    
    res.render('room-detail', { 
      title: `${room.type_name} - Room ${room.room_number}`,
      room
    });
  } catch (error) {
    console.error(error);
    res.render('error', { 
      title: 'Error',
      message: 'Unable to load room details',
      error
    });
  }
});

// About page
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'About Us - HotelIn'
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('contact', { 
    title: 'Contact Us - HotelIn'
  });
});

module.exports = router;

