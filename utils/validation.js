const Joi = require('joi');

const imagePath = Joi.string().trim().max(512);

module.exports = {
  register: Joi.object({
    name: Joi.string().trim().min(3).max(100)
      .required(),
    email: Joi.string().trim().lowercase().email()
      .max(255)
      .required(),
    address: Joi.string().trim().min(5).max(512)
      .required(),
    password: Joi.string().min(8).max(72).required(),
  }),
  login: Joi.object({
    email: Joi.string().trim().lowercase().email()
      .required(),
    password: Joi.string().max(72).required(),
  }),
  updateProfile: Joi.object({
    name: Joi.string().trim().min(3).max(100),
    email: Joi.string().trim().lowercase().email()
      .max(255),
    address: Joi.string().trim().min(5).max(512),
  }).min(1),
  kelas: Joi.object({
    title: Joi.string().trim().min(5).max(255)
      .required(),
    pathImg: imagePath.required(),
  }),
  paket: Joi.object({
    pathImg: imagePath.required(),
    pic: Joi.string().trim().max(255).required(),
    title: Joi.string().trim().min(5).max(255)
      .required(),
    desc: Joi.string().trim().min(5).max(255)
      .required(),
    price: Joi.number().integer().min(0).required(),
    isFav: Joi.boolean().default(false),
  }),
  person: Joi.object({
    pathImg: imagePath.required(),
    name: Joi.string().trim().max(255).required(),
    desc: Joi.string().trim().min(5).max(511)
      .required(),
    role: Joi.string().trim().min(3).max(255)
      .required(),
  }),
};
