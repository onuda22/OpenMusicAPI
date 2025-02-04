const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { nanoid } = require('nanoid');
const { resGetAlbumsDTO } = require('../../utils/responseGetAlbumsDTO');

class AlbumService {
  constructor() {
    this._pool = new Pool();
  }

  //Post
  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Albums Failed to Create');
    }

    return result.rows[0].id;
  }

  //Get All
  async getAlbums() {
    return (await this._pool.query('SELECT * FROM albums')).rows.map(
      resGetAlbumsDTO
    );
  }

  //Get One
  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Data album tidak ditemukan');
    }

    return result.rows.map(resGetAlbumsDTO);
  }

  //Put
  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: `UPDATE albums
             SET name = COALESCE($1, name)
                 year = COALESCE($2, year)
                 updated_at = $3
             WHERE id = $4 RETURNING id`,
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal update, data tidak ditemukan');
    }
  }

  //Delete
  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Data tidak ditemukan');
    }
  }
}

module.exports = AlbumService;
