const autoBind = require('auto-bind');

class UsersHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postUserHandler(req, h) {
    this._validator.validateUserPayload(req.payload);
    const { username, password, fullname } = req.payload;

    const userId = await this._service.addUser({
      username,
      password,
      fullname,
    });

    const response = h.response({
      status: 'success',
      message: 'User created successfully',
      data: {
        userId,
      },
    });

    response.code(201);
    return response;
  }
}

module.exports = UsersHandler;
