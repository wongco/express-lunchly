/** Customer for Lunchly */

const db = require('../db');
const Reservation = require('./reservation');

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
    this.fullName = `${firstName} ${lastName}`;
  }

  /** methods for getting/setting notes (keep as empty string, not NULL) */

  set fullName(val) {
    this._fullName = val || ``;
  }

  get fullName() {
    return this._fullName;
  }

  /** methods for getting/setting notes (keep as empty string, not NULL) */

  set notes(val) {
    this._notes = val || '';
  }

  get notes() {
    return this._notes;
  }

  /** methods for getting/setting phone #. */

  set phone(val) {
    this._phone = val || null;
  }

  get phone() {
    return this._phone;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async getByName(name) {
    // The string has to be prepared before use in Prepared Statement
    let queryTerm = `%${name}%`;
    const results = await db.query(
      `SELECT id, 
      first_name AS "firstName",  
      last_name AS "lastName", 
      phone, 
      notes FROM customers WHERE (first_name ILIKE $1 OR last_name ILIKE $1)`,
      [queryTerm]
    );
    return results.rows.map(item => new Customer(item));
  }

  /** find top10 customers */

  static async getTop10() {
    let result = await db.query(
      `SELECT c.id, 
         c.first_name AS "firstName",  
         c.last_name AS "lastName", 
         c.phone, 
         c.notes,
         COUNT(r.id) AS "count"
       FROM customers AS c
       JOIN reservations AS r
        ON r.customer_id = c.id
       GROUP BY c.id
        ORDER BY count(r.id) DESC
       LIMIT 10`
    );
    return result.rows.map(item => {
      let customer = new Customer(item);
      customer.count = item.count;
      return customer;
    });
  }

  /** get specific customer */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4)
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }
}

module.exports = Customer;
