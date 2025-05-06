import Joi from "joi"

export const UserEntrySchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    confirm_password: Joi.ref('password'),
    email: Joi.string().email({ tlds: { allow: false }})
}).with('password', 'confirm_password')

const UserCredentialsSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
}).unknown(true)

export default UserCredentialsSchema