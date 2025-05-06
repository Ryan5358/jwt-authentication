import Joi from "joi"

export const errorMessages = (err: Joi.ValidationError) => {
    const errMessages: string[] = [] 
    err.details.forEach(detail => {
        errMessages.push(detail.message)
    })

    return errMessages
}

export const validateValueWith = (schema: Joi.ObjectSchema, value: any, options?: Joi.ValidationOptions) => {
    return schema.validate(value, { abortEarly: false, ...options })
}