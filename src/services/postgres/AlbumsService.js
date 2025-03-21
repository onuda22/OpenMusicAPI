const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { nanoid } = require('nanoid');
const { resGetAlbumsDTO } = require('../../utils/responseGetAlbumsDTO');
const { resGetAllSongsDTO } = require('../../utils/responseGetSongsDTO');

class AlbumService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
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

    if (!result.rowCount) {
      throw new NotFoundError('Data tidak ditemukan');
    }
  }

  //Add Cover
  async addAlbumCoverById(id, coverUrl) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET cover_url = $1, updated_at = $2 WHERE id = $3 RETURNING id',
      values: [coverUrl, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal upload sampul, album tidak ditemukan');
    }
  }

  /**
   * Album Likes Feature
   * Create, Delete, Get
   */
  async addAlbumLikes(albumId, userId) {
    await this.getAlbumById(albumId);
    const id = `likes-${nanoid(16)}`;
    const query = {
      text: `
        INSERT INTO user_album_likes (id, album_id, user_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (album_id, user_id) DO NOTHING
        RETURNING id;
      `,
      values: [id, albumId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError(
        'Gagal menyukai album, Anda sudah menyukai album ini sebelumnya.'
      );
    }

    await this._cacheService.delete(`likes:${albumId}`);
  }

  async deleteAlbumLikes(albumId, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError(
        'Gagal menghapus album like, data like pada album tidak ditemukan'
      );
    }

    await this._cacheService.delete(`likes:${albumId}`);
  }

  async getTotalAlbumLikes(albumId) {
    try {
      const data = await this._cacheService.get(`likes:${albumId}`);
      return data;
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(*)::INTEGER AS album_likes FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);
      const likes = result.rows[0].album_likes;

      await this._cacheService.set(`likes:${albumId}`, likes);

      return likes;
    }
  }
}

module.exports = AlbumService;
