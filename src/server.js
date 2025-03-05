require('dotenv').config();

const ClientError = require('./exceptions/ClientError');

const Hapi = require('@hapi/hapi');
const song = require('./api/song');
const album = require('./api/albums');
const users = require('./api/users');
const authentications = require('./api/authentications');

const SongService = require('./services/postgres/SongService');
const AlbumService = require('./services/postgres/AlbumsService');
const UsersService = require('./services/postgres/UsersService');
const AuthService = require('./services/postgres/AuthService');

const SongValidator = require('./validator/songs');
const AlbumValidator = require('./validator/albums');
const UsersValidator = require('./validator/users');
const AuthenticationsValidator = require('./validator/authentications');

const TokenManager = require('./tokenize/TokenManager');

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
  const usersService = new UsersService();
  const authService = new AuthService();

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
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
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
