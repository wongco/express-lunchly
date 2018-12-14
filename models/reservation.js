/** Reservation for Lunchly */

const moment = require('moment');

const db = require('../db');

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    // arguments 0 is for the case where we passed in snake_case SQL result object
    this.id = id;
    this.customerId = customerId; // || arguments[0].customer_id;
    this.numGuests = numGuests; // || arguments[0].num_guests;
    this.startAt = startAt; // || arguments[0].start_at;
    this.notes = notes;
  }

  /** methods for setting/getting startAt time */

  set numGuests(val) {
    if (typeof val !== 'number' || val < 1) {
      this._numGuests = 1;
    } else {
      this._numGuests = val;
    }
    return this._numGuests;
  }

  get numGuests() {
    return this._numGuests;
  }

  set startAt(val) {
    if (val instanceof Date && !isNaN(val)) this._startAt = val;
    else throw new Error('Not a valid startAt.');
  }

  get startAt() {
    return this._startAt;
  }

  get formattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }

  /** methods for setting/getting notes (keep as a blank string, not NULL) */

  set notes(val) {
    this._notes = val || '';
  }

  get notes() {
    return this._notes;
  }

  /** methods for setting/getting customer ID: can only set once. */

  set customerId(val) {
    if (this._customerId && this._customerId !== val)
      throw new Error('Cannot change customer ID');
    this._customerId = val;
  }

  get customerId() {
    return this._customerId;
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  static async getReservationById(id) {
    const row = db.query(`SELECT * FROM reservations WHERE id=$1`, [id])[0];
    let reservation = new Reservation({
      id: row.id,
      customerId: row.customer_id,
      startAt: row.start_at,
      numGuests: row.num_guests,
      notes: row.notes
    });
    return reservation;
  }

  async save() {
    if (this.id === undefined) {
      var result = (await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
        VALUES ($1, $2, $3, $4) RETURNING *`,
        [this.customerId, this.startAt, this.numGuests, this.notes]
      )).rows[0];
      this.id = result.id;
    } else {
      var result = (await db.query(
        `UPDATE reservation SET customer_id=$1, start_at=$2, num_guests=$3, notes=$4 WHERE id=$5 RETURNING *`,
        [this.customerId, this.startAt, this.numGuests, this.notes, this.id]
      )).rows[0];
    }
    // return new Reservation(result);
  }
}

// async save() {
//   if (this.id === undefined) {
//     const result = await db.query(
//       `INSERT INTO customers (first_name, last_name, phone, notes)
//            VALUES ($1, $2, $3, $4)
//            RETURNING id`,
//       [this.firstName, this.lastName, this.phone, this.notes]
//     );
//     this.id = result.rows[0].id;
//   } else {
//     await db.query(
//       `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4)
//            WHERE id=$5`,
//       [this.firstName, this.lastName, this.phone, this.notes, this.id]
//     );
//   }
// }

module.exports = Reservation;
