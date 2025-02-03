/* eslint-disable camelcase */
const resGetAllSongsDTO = ({ id, title, performer }) => ({
  id,
  title,
  performer,
});

const resGetOneSongDTO = ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  album_id,
}) => ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId: album_id,
});

module.exports = { resGetAllSongsDTO, resGetOneSongDTO };
