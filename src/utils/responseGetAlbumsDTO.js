/* eslint-disable camelcase */
const resGetAlbumsDTO = ({ id, name, year, cover_url }) => ({
  id,
  name,
  year,
  coverUrl: cover_url,
});

module.exports = { resGetAlbumsDTO };
