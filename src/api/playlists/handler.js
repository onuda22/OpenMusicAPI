const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(playlistService, validator) {
    this._playlistService = playlistService;
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
}

module.exports = PlaylistsHandler;
