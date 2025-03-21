const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const cacheKeys = require('../../utils/cacheKeys');

class PlaylistService {
  /**
   * TODO:
   * 1. Add
   * 2. Get
   * 3. Delete (id)
   */
  constructor(collaborationService, cacheService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
    this._cacheService = cacheService;
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

    //Cache Redis
    await this._cacheService.delete(cacheKeys.playlists.playlistByUser(owner));

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    try {
      //Cache Redis
      const result = await this._cacheService.get(
        cacheKeys.playlists.playlistByUser(owner)
      );

      return JSON.parse(result);
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      // Use Join table to get username
      const query = {
        text: `SELECT playlists.id, playlists.name, users.username
        FROM playlists
        LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
        LEFT JOIN users ON users.id = playlists.owner
        WHERE playlists.owner = $1 OR collaborations.user_id = $1
        GROUP BY playlists.id, playlists.name, users.username`,
        values: [owner],
      };

      const result = await this._pool.query(query);

      //Cache Redis
      await this._cacheService.set(
        cacheKeys.playlists.playlistByUser(owner),
        JSON.stringify(result.rows),
        600
      );
      return result.rows;
    }
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id, owner',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError(
        'Failed to delete playlists. PlaylistsId not found'
      );
    }
    const { owner } = result.rows[0];

    //Cache Redis
    await this._cacheService.delete(cacheKeys.playlists.playlistByUser(owner));
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT owner FROM playlists WHERE id = $1',
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

    //Cache Redis
    await this._cacheService.delete(
      cacheKeys.playlists.playlistSongById(playlistId)
    );
  }

  //GET ALL
  async getAllPlaylistSong(playlistId) {
    try {
      const result = JSON.parse(
        await this._cacheService.get(
          cacheKeys.playlists.playlistSongById(playlistId)
        )
      );

      return result;
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
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

      //Cache Redis
      await this._cacheService.set(
        cacheKeys.playlists.playlistSongById(playlistId),
        JSON.stringify(playlistData),
        600
      );

      return playlistData;
    }
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

    //Cache Redis
    await this._cacheService.delete(
      cacheKeys.playlists.playlistSongById(playlistId)
    );
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

    //Cache Redis
    await this._cacheService.delete(
      cacheKeys.playlists.playlistActivityById(playlistId)
    );
  }

  async getPlaylistActivityByPlaylistId(playlistId) {
    try {
      const result = await this._cacheService.get(
        cacheKeys.playlists.playlistActivityById(playlistId)
      );

      return JSON.parse(result);
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
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

      //Cache Redis
      await this._cacheService.set(
        cacheKeys.playlists.playlistActivityById(playlistId),
        JSON.stringify(result.rows),
        300
      );

      return result.rows;
    }
  }

  //Collaborations feature service need
  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistService;
