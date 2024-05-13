import { validate } from "@eng-automation/js";
import Joi from "joi";

import { Command } from "./command";

const commandSchema = Joi.object<Command>().keys({
  name: Joi.string().trim().required(),
  description: Joi.string().optional(),
  machine: Joi.array().items(Joi.string()).optional(),
  timeout: Joi.number().min(1).optional(),
  commandStart: Joi.string().required(),
});

type JoiCommand = Omit<Command, "filename">;

export const validateConfig = (config: JoiCommand): JoiCommand | never =>
  validate<Command>(config, commandSchema, {
    message: "Command file is invalid",
  });
