import { validate } from "@eng-automation/js";
import Joi from "joi";

const generalSchema = Joi.bool();

export const validateConfig = <T>(config: T): T | never => {
    const validatedConfig = validate<T>(config, generalSchema, {
      message: "Configuration file is invalid",
    });

    return validatedConfig;
});
