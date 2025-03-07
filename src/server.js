require('dotenv').config();

const ClientError = require('./exceptions/ClientError');

const Hapi = require('@hapi/hapi');
const song = require('./api/song');
const album = require('./api/albums');
const users = require('./api/users');
const authentications = require('./api/authentications');
const Jwt = require('@hapi/jwt');

const SongService = require('./services/postgres/SongService');
const AlbumService = require('./services/postgres/AlbumsService');
const UsersService = require('./services/postgres/UsersService');
const AuthService = require('./services/postgres/AuthService');

const SongValidator = require('./validator/songs');
const AlbumValidator = require('./validator/albums');
const UsersValidator = require('./validator/users');
const AuthenticationsValidator = require('./validator/authentications');

const TokenManager = require('./tokenize/TokenManager');
const PlaylistService = require('./services/postgres/PlaylistService');
const playlists = require('./api/playlists');
const PlaylistValidator = require('./validator/playlists');

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

  server.register([
    {
      plugin: Jwt,
    },
  ]);

  server.auth.strategy('musicapp_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
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
  const playlistService = new PlaylistService();

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
    {
      plugin: playlists,
      options: {
        playlistService,
        validator: PlaylistValidator,
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
