const { nanoid } = require('nanoid');
const { Pool } = require('pg');

const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const {
  resGetOneSongDTO,
  resGetAllSongsDTO,
} = require('../../utils/responseGetSongsDTO');

class SongService {
  constructor() {
    this._pool = new Pool();
  }

  //Post
  async addSong({
    title,
    year,
    genre,
    performer,
    duration = null,
    albumId = null,
  }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING Id',
      values: [
        id,
        title,
        year,
        genre,
        performer,
        duration,
        albumId,
        createdAt,
        updatedAt,
      ],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Song failed to add');
    }

    return result.rows[0].id;
  }

  //Get All
  async getSongs() {
    return (await this._pool.query('SELECT * FROM songs')).rows.map(
      resGetAllSongsDTO
    );
  }

  //Get One
  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Songs Not Found');
    }

    return result.rows.map(resGetOneSongDTO)[0];
  }

  //Put
  async editSongById(id, { title, year, genre, performer, duration, albumId }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: `UPDATE songs 
             SET title = COALESCE($1, title), 
                 year = COALESCE($2, year), 
                 genre = COALESCE($3, genre), 
                 performer = COALESCE($4, performer), 
                 duration = COALESCE($5, duration), 
                 album_id = COALESCE($6, album_id), 
                 updated_at = $7
             WHERE id = $8 RETURNING id`,
      values: [title, year, genre, performer, duration, albumId, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Failed to edit song. Song not found');
    }
  }

  //Delete
  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Song Not Found');
    }
  }

  /**
   * Get Data by Query Parameters
   */
  async getSongByQueryParams(title, performer) {
    const query = {
      text: 'SELECT * FROM songs WHERE title ILIKE $1 AND performer ILIKE $2',
      values: [`%${title.toLowerCase()}%`, `%${performer.toLowerCase()}%`],
    };

    const result = await this._pool.query(query);

    return result.rows.map(resGetAllSongsDTO);
  }
}

module.exports = SongService;
