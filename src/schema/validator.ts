import { validate } from "@eng-automation/js";
import Joi from "joi";

import { Command } from "./command";

const commandSchema = Joi.object<Command>().keys({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  machine: Joi.array().items(Joi.string()).optional(),
  timeout: Joi.number().min(1).optional(),
  commandStart: Joi.string().required(),
});

export const validateConfig = (config: Command): Command | never =>
  validate<Command>(config, commandSchema, {
    message: "Command file is invalid",
  });
