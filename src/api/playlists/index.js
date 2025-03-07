const routes = require('./routes');
const PlaylistsHandler = require('./handler');

module.exports = {
  name: 'playlists',
  version: '1.0.0',
  register: async (server, { playlistService, validator }) => {
    const playlistsHandler = new PlaylistsHandler(playlistService, validator);
    server.route(routes(playlistsHandler));
  },
};
