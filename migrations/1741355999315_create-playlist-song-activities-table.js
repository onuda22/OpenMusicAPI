/* eslint-disable camelcase */
/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = {
  id: { type: 'VARCHAR(50)', primaryKey: true },
  fkey: { type: 'VARCHAR(50)', notNull: true },
  time: { type: 'TEXT', notNull: true },
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('playlist_song_activities', {
    id: 'id',
    playlist_id: 'fkey',
    song_id: 'fkey',
    user_id: 'fkey',
    action: {
      type: 'VARCHAR(20)',
      notNull: true,
    },
    time: 'time',
  });

  pgm.addConstraint(
    'playlist_song_activities',
    'playlist_song_activities.playlist_id_fkey',
    {
      foreignKeys: {
        columns: 'playlist_id',
        references: 'playlists(id)',
        onDelete: 'CASCADE',
      },
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('playlist_song_activities');
};
