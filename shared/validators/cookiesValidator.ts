import Joi from "joi"

export const CookiesSchema = Joi.object({
    access_token: Joi.string().required(),
    refresh_token: Joi.string().required(),
    user_id: Joi.string().required()
})