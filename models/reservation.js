/** Reservation for Lunchly */

const moment = require('moment');

const db = require('../db');

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** methods for setting/getting startAt time */

  set numGuests(val) {
    this._numGuests = typeof val !== 'number' || val < 1 ? 1 : val;
    // if (typeof val !== 'number' || val < 1) {
    //   this._numGuests = 1;
    // } else {
    //   this._numGuests = val;
    // }
    // return this._numGuests;
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

  /** given a reservation id, find the reservation. */

  static async getReservationById(id) {
    // const row = db.query(`SELECT * FROM reservations WHERE id=$1`, [id])[0];
    // let reservation = new Reservation({
    //   id: row.id,
    //   customerId: row.customer_id,
    //   startAt: row.start_at,
    //   numGuests: row.num_guests,
    //   notes: row.notes
    // });
    // return reservation;
    const reservation = await db.query(
      `SELECT id,
           customer_id as "customerId",
           start_at as "startAt",
           num_guests as "numGuests",
           notes
         FROM reservations
         WHERE id=$1`,
      [id]
    )[0];

    if (reservation === undefined) {
      const err = new Error(`No such reservation: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Reservation(reservation);
  }

  /** save this reservation. */

  async save() {
    let result;
    if (this.id === undefined) {
      result = (await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
        VALUES ($1, $2, $3, $4) RETURNING *`,
        [this.customerId, this.startAt, this.numGuests, this.notes]
      )).rows[0];
      this.id = result.id;
    } else {
      result = (await db.query(
        `UPDATE reservation SET customer_id=$1, start_at=$2, num_guests=$3, notes=$4 WHERE id=$5 RETURNING *`,
        [this.customerId, this.startAt, this.numGuests, this.notes, this.id]
      )).rows[0];
    }
  }
}

module.exports = Reservation;
