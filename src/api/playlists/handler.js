const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(playlistService, songService, validator) {
    this._playlistService = playlistService;
    this._songService = songService;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(req, h) {
    this._validator.validatePlaylistPayload(req.payload);
    const { id: credentialId } = req.auth.credentials;
    const { name } = req.payload;

    const playlistId = await this._playlistService.addPlaylist(
      name,
      credentialId
    );

    const response = h.response({
      status: 'success',
      message: 'Playlist Created Successfully',
      data: { playlistId },
    });

    response.code(201);
    return response;
  }

  async getPlaylistHandler(req) {
    const { id: credentialId } = req.auth.credentials;
    const playlists = await this._playlistService.getPlaylists(credentialId);

    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistHandler(req) {
    const { id: credentialId } = req.auth.credentials;
    const { id: playlistId } = req.params;

    await this._playlistService.verifyPlaylistOwner(playlistId, credentialId);
    await this._playlistService.deletePlaylistById(playlistId);

    return {
      status: 'success',
      message: 'Playlist deleted successfully',
    };
  }

  /**
   * Playlist Songs Handler
   */
  async postPlaylistSongHandler(req, h) {
    this._validator.validatePlaylistSongPayload(req.payload);
    const { id: credentialId } = req.auth.credentials;
    const { id: playlistId } = req.params;

    await this._playlistService.verifyPlaylistOwner(playlistId, credentialId);

    const { songId } = req.payload;
    await this._songService.getSongById(songId);
    await this._playlistService.addPlaylistSong(playlistId, songId);

    const result = h.response({
      status: 'success',
      message: 'Song added to playlists successfully',
    });

    result.code(201);
    return result;
  }

  async getPlaylistSongsHandler(req) {
    const { id: credentialId } = req.auth.credentials;
    const { id: playlistId } = req.params;

    await this._playlistService.verifyPlaylistOwner(playlistId, credentialId);

    const playlist = await this._playlistService.getAllPlaylistSong(playlistId);

    return {
      status: 'success',
      data: { playlist },
    };
  }

  async deletePlaylistSongHandler(req) {
    this._validator.validatePlaylistSongPayload(req.payload);
    const { id: credentialId } = req.auth.credentials;
    const { id: playlistId } = req.params;

    await this._playlistService.verifyPlaylistOwner(playlistId, credentialId);

    const { songId } = req.payload;
    await this._playlistService.deleteSongFromPlaylistById(playlistId, songId);

    return {
      status: 'success',
      message: 'Song deleted successfully from your playlist',
    };
  }
}

module.exports = PlaylistsHandler;
