const routes = require('./routes');
const PlaylistsHandler = require('./handler');

module.exports = {
  name: 'playlists',
  version: '1.0.0',
  register: async (server, { playlistService, songService, validator }) => {
    const playlistsHandler = new PlaylistsHandler(
      playlistService,
      songService,
      validator
    );
    server.route(routes(playlistsHandler));
  },
};
