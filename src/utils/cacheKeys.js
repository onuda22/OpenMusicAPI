const cacheKeys = {
  playlists: {
    playlistByUser: (userId) => `playlist:${userId}`,
    playlistActivityById: (playlistId) => `playlistActivity:${playlistId}`,
    playlistSongById: (playlistId) => `playlistSong:${playlistId}`,
  },
  albumLikeById: (albumId) => `likes:${albumId}`,
  refreshToken: (token) => `refreshToken:${token}`,
};

module.exports = cacheKeys;
