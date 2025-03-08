const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { nanoid } = require('nanoid');
const { resGetAlbumsDTO } = require('../../utils/responseGetAlbumsDTO');
const { resGetAllSongsDTO } = require('../../utils/responseGetSongsDTO');

class AlbumService {
  constructor() {
    this._pool = new Pool();
  }

  //Post
  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, createdAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Albums Failed to Create');
    }

    return result.rows[0].id;
  }

  //Get All - Not Implemented

  //Get One
  async getAlbumById(id) {
    //Refactor Query - Get Album and Song
    //Get Album
    const albumQuery = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const album = await this._pool.query(albumQuery);

    if (!album.rows.length) {
      throw new NotFoundError('Data album tidak ditemukan');
    }

    //Get Song according to albumId
    const songQuery = {
      text: 'SELECT * FROM songs WHERE album_id = $1',
      values: [id],
    };
    const song = (await this._pool.query(songQuery)).rows.map(
      resGetAllSongsDTO
    );

    //Combine two data
    const result = {
      ...album.rows.map(resGetAlbumsDTO)[0],
      songs: song,
    };

    return result;
  }

  //Put
  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: `UPDATE albums
             SET name = COALESCE($1, name),
                 year = COALESCE($2, year),
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
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Data tidak ditemukan');
    }
  }
}

module.exports = AlbumService;
