require('dotenv').config();

const Hapi = require('@hapi/hapi');
const song = require('./api/song');
const album = require('./api/album');

const SongService = null;
const AlbumService = null;

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

    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    return h.continue;
  });

  /**
   * Register plugin/service
   */
  await server.register([
    {
      plugin: song,
      options: {
        service: SongService,
        validator: null,
      },
    },
    {
      plugin: album,
      options: {
        service: AlbumService,
        validator: null,
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
