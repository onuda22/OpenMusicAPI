const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistService {
  /**
   * TODO:
   * 1. Add
   * 2. Get
   * 3. Delete (id)
   */
  constructor() {
    this._pool = new Pool();
  }

  async addPlaylist(name, owner) {
    const id = `playlist-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, owner, createdAt, createdAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist has been failed to create');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    // Use Join table to get username
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username
      FROM playlists
      LEFT JOIN users ON users.id = playlists.owner
      WHERE playlists.owner = $1`,
      values: [owner],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError(
        'Failed to delete playlists. PlaylistsId not found'
      );
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist is not found');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('You are forbidden to access this resource');
    }
  }
}

module.exports = PlaylistService;
