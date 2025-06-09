const { promisePool } = require('../config/database');

class Guest {
  static async create(guestData) {
    const { name, email, phone, address } = guestData;
    const [result] = await promisePool.execute(
      'INSERT INTO guest (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [name, email, phone, address]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await promisePool.execute(
      'SELECT * FROM guest WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await promisePool.execute(
      'SELECT * FROM guest WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async getAll() {
    const [rows] = await promisePool.execute('SELECT * FROM guest');
    return rows;
  }
}

class Room {
  static async getAll() {
    const [rows] = await promisePool.execute(`
      SELECT r.*, rt.type_name, rt.description 
      FROM rooms r 
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      ORDER BY r.room_number
    `);
    return rows;
  }

  static async getAvailable(checkIn, checkOut) {
    const [rows] = await promisePool.execute(`
      SELECT r.*, rt.type_name, rt.description 
      FROM rooms r 
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.status = 'avaible' 
      AND r.id NOT IN (
        SELECT room_id FROM reservations 
        WHERE status IN ('booked', 'checked_in') 
        AND ((check_in <= ? AND check_out > ?) OR (check_in < ? AND check_out >= ?))
      )
      ORDER BY r.price ASC
    `, [checkIn, checkIn, checkOut, checkOut]);
    return rows;
  }

  static async findById(id) {
    const [rows] = await promisePool.execute(`
      SELECT r.*, rt.type_name, rt.description 
      FROM rooms r 
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.id = ?
    `, [id]);
    return rows[0];
  }

  static async updateStatus(id, status) {
    const [result] = await promisePool.execute(
      'UPDATE rooms SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }
}

class RoomType {
  static async getAll() {
    const [rows] = await promisePool.execute('SELECT * FROM room_types ORDER BY type_name');
    return rows;
  }

  static async findById(id) {
    const [rows] = await promisePool.execute('SELECT * FROM room_types WHERE id = ?', [id]);
    return rows[0];
  }
}

class Reservation {
  static async create(reservationData) {
    const { guest_id, room_id, check_in, check_out } = reservationData;
    const [result] = await promisePool.execute(
      'INSERT INTO reservations (guest_id, room_id, check_in, check_out, status) VALUES (?, ?, ?, ?, ?)',
      [guest_id, room_id, check_in, check_out, 'booked']
    );
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await promisePool.execute(`
      SELECT r.*, g.name as guest_name, g.email, g.phone, 
             rm.room_number, rt.type_name, rm.price
      FROM reservations r
      LEFT JOIN guest g ON r.guest_id = g.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      LEFT JOIN room_types rt ON rm.room_type_id = rt.id
      ORDER BY r.created_at DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await promisePool.execute(`
      SELECT r.*, g.name as guest_name, g.email, g.phone, g.address,
             rm.room_number, rt.type_name, rm.price, rm.img
      FROM reservations r
      LEFT JOIN guest g ON r.guest_id = g.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      LEFT JOIN room_types rt ON rm.room_type_id = rt.id
      WHERE r.id = ?
    `, [id]);
    return rows[0];
  }

  static async updateStatus(id, status) {
    const [result] = await promisePool.execute(
      'UPDATE reservations SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  static async getByGuestId(guestId) {
    const [rows] = await promisePool.execute(`
      SELECT r.*, rm.room_number, rt.type_name, rm.price, rm.img
      FROM reservations r
      LEFT JOIN rooms rm ON r.room_id = rm.id
      LEFT JOIN room_types rt ON rm.room_type_id = rt.id
      WHERE r.guest_id = ?
      ORDER BY r.created_at DESC
    `, [guestId]);
    return rows;
  }
}

class Payment {
  static async create(paymentData) {
    const { reservation_id, amount, method } = paymentData;
    const [result] = await promisePool.execute(
      'INSERT INTO payments (reservation_id, amount, method, status) VALUES (?, ?, ?, ?)',
      [reservation_id, amount, method, 'paid']
    );
    return result.insertId;
  }

  static async getByReservationId(reservationId) {
    const [rows] = await promisePool.execute(
      'SELECT * FROM payments WHERE reservation_id = ?',
      [reservationId]
    );
    return rows;
  }

  static async getAll() {
    const [rows] = await promisePool.execute(`
      SELECT p.*, r.id as reservation_id, g.name as guest_name, rm.room_number
      FROM payments p
      LEFT JOIN reservations r ON p.reservation_id = r.id
      LEFT JOIN guest g ON r.guest_id = g.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      ORDER BY p.payment_date DESC
    `);
    return rows;
  }
}

class User {
  static async findByUsername(username) {
    const [rows] = await promisePool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows[0];
  }

  static async create(userData) {
    const { username, password, role } = userData;
    const [result] = await promisePool.execute(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, password, role]
    );
    return result.insertId;
  }
}

module.exports = {
  Guest,
  Room,
  RoomType,
  Reservation,
  Payment,
  User
};

