const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const cacheKeys = require('../../utils/cacheKeys');

class AuthService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addRefreshToken(token) {
    const query = {
      text: 'INSERT INTO authentications VALUES($1)',
      values: [token],
    };

    await this._pool.query(query);
    await this._cacheService.set(cacheKeys.refreshToken(token), token, 3600);
  }

  async verifyRefreshToken(token) {
    try {
      await this._cacheService.get(cacheKeys.refreshToken(token));
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      const query = {
        text: 'SELECT token FROM authentications WHERE token = $1',
        values: [token],
      };

      const result = await this._pool.query(query);

      if (!result.rowCount) {
        throw new InvariantError('RefreshToken not valid');
      }

      await this._cacheService.set(cacheKeys.refreshToken(token), token, 3600);
    }
  }

  async deleteRefreshToken(token) {
    const query = {
      text: 'DELETE FROM authentications WHERE token = $1',
      values: [token],
    };

    await this._pool.query(query);
    await this._cacheService.delete(cacheKeys.refreshToken(token));
  }
}

module.exports = AuthService;
