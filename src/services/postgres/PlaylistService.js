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

  async getPlaylistById(id) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username
      FROM playlists
      LEFT JOIN users ON users.id = playlists.owner
      WHERE playlists.id = $1`,
      values: [id],
    };

    return (await this._pool.query(query)).rows[0];
  }

  // Playlist Songs Feature
  /**
   * TODO:
   * uri: playlists/{id}/songs
   * 1. POST song (songId) return id
   * 2. GET song playlists return []
   * 3. DELETE song (songId) return void
   * Auth required
   */

  //POST
  async addPlaylistSong(playlistId, songId, userId) {
    const id = `ps-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, playlistId, songId, createdAt, createdAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Song failed to be added to playlists');
    }

    const action = 'add';
    await this.addPlaylistActivity(playlistId, songId, userId, action);
  }

  //GET ALL
  async getAllPlaylistSong(playlistId) {
    const playlistData = await this.getPlaylistById(playlistId);

    const query = {
      text: `SELECT songs.id, songs.title, songs.performer
		          FROM playlist_songs
		          RIGHT JOIN songs ON songs.id = playlist_songs.song_id
		          WHERE playlist_songs.playlist_id = $1`,
      values: [playlistId],
    };

    const songsData = await this._pool.query(query);
    playlistData.songs = songsData.rows;

    return playlistData;
  }

  //DELETE
  async deleteSongFromPlaylistById(playlistId, songId, userId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Song Not Found');
    }

    const action = 'delete';
    await this.addPlaylistActivity(playlistId, songId, userId, action);
  }

  /**
   * Playlist Song Activities
   */
  async addPlaylistActivity(playlistId, songId, userId, action) {
    const id = `playActivity-${nanoid(16)}`;
    const time = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, playlistId, songId, userId, action, time],
    };

    await this._pool.query(query);
  }

  async getPlaylistActivityByPlaylistId(playlistId) {
    const query = {
      text: `SELECT users.username, songs.title,
                    psa.action, psa.time
	           FROM playlist_song_activities psa
             LEFT JOIN users ON users.id = psa.user_id
             LEFT JOIN songs ON songs.id = psa.song_id
             WHERE psa.playlist_id = $1
             ORDER BY time`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }
}

module.exports = PlaylistService;
