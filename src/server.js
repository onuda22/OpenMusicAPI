require('dotenv').config();

const Hapi = require('@hapi/hapi');
const song = require('./api/song');
const album = require('./api/albums');

const SongService = require('./services/postgres/SongService');
const AlbumService = require('./services/postgres/AlbumsService');

const SongValidator = require('./validator/songs');
const AlbumValidator = require('./validator/albums');

const ClientError = require('./exceptions/ClientError');

const init = async () => {
  /**
   * Initiate server
   */
  const server = Hapi.Server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  /**
   * Handle preResponse
   * usually a boilerplate for error handling
   */
  server.ext('onPreResponse', (req, h) => {
    const { response } = req;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      if (!response.isServer) {
        return h.continue;
      }

      const newResponse = h.response({
        status: 'error',
        message: 'Server Error',
      });
      newResponse.code(500);
      return newResponse;
    }

    return h.continue;
  });

  /**
   * Register plugin/service
   */
  const songsService = new SongService();
  const albumsService = new AlbumService();

  await server.register([
    {
      plugin: song,
      options: {
        service: songsService,
        validator: SongValidator,
      },
    },
    {
      plugin: album,
      options: {
        service: albumsService,
        validator: AlbumValidator,
      },
    },
  ]);

  /**
   * Start server
   */
  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

init();
