const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const AuthenticationError = require('../../exceptions/AuthenticationError');
const NotFoundError = require('../../exceptions/NotFoundError');

class UsersService {
  constructor() {
    this._pool = new Pool();
  }

  async addUser({ username, password, fullname }) {
    // TODO: Verifikasi username, pastikan belum terdaftar
    // TODO: Bila verifikasi lolos, maka masukkan user baru ke database
    await this.verifyNewUsername(username);

    const id = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    const query = {
      text: 'INSERT INTO users VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, username, hashedPassword, fullname, createdAt, createdAt],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('User failed to be added');
    }

    return result.rows[0].id;
  }

  //Cek user
  async getUserById(id) {
    const query = {
      text: 'SELECT users.id FROM users WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('User is Not Found');
    }
  }

  async verifyNewUsername(username) {
    const query = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    };

    const result = await this._pool.query(query);
    if (result.rowCount > 0) {
      throw new InvariantError('Failed to add user. Username already exists');
    }
  }

  async verifyUserCredential(username, password) {
    const query = {
      text: 'SELECT id, password FROM users WHERE username = $1',
      values: [username],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new AuthenticationError('Your Credential Username is Invalid');
    }

    const { id, password: hashedPassword } = result.rows[0];

    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      throw new AuthenticationError('Your Credential Password is Invalid');
    }

    return id;
  }
}

module.exports = UsersService;
