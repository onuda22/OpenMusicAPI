const resGetAlbumsDTO = ({ id, name, year }) => ({
  id,
  name,
  year,
});

const resGetOneAlbumsDTO = ({ id, name, year, songs }) => ({
  id,
  name,
  year,
  songs,
});

module.exports = { resGetAlbumsDTO, resGetOneAlbumsDTO };
