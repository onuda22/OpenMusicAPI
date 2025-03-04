/* eslint-disable camelcase */
/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = {
  id: { type: 'VARCHAR(50)', primaryKey: true },
  created_at: { type: 'TEXT', notNull: true },
  updated_at: { type: 'TEXT', notNull: true },
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('playlist_songs', {
    id: 'id',
    playlist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    song_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    created_at: 'created_at',
    updated_at: 'updated_at',
  });

  //Menghindari duplikasi kombinasi playlist_id dengan song_id
  pgm.addConstraint(
    'playlist_songs',
    'unique_playlist_id_and_song_id',
    'UNIQUE(playlist_id, song_id)'
  );

  pgm.addConstraint('playlist_songs', 'playlist_songs.playlist_id_fkey', {
    foreignKeys: {
      columns: 'playlist_id',
      references: 'playlists(id)',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint('playlist_songs', 'playlists_song.song_id_fkey', {
    foreignKeys: {
      columns: 'song_id',
      references: 'songs(id)',
      onDelete: 'CASCADE',
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('playlist_songs');
};
