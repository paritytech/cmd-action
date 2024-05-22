import { validate } from "@eng-automation/js";
import Joi from "joi";

import { Command, Parameters } from "./command";

const parameters = Joi.array<Parameters>().items({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  args: Joi.array<Parameters["args"]>().items({
    arg: Joi.string().required(),
    label: Joi.string().optional(),
    options: Joi.string(),
  }),
});

const commandSchema = Joi.object<Command>().keys({
  name: Joi.string().trim().required(),
  description: Joi.string().optional(),
  machine: Joi.array().items(Joi.string()).optional(),
  timeout: Joi.number().min(1).optional(),
  commandStart: Joi.string().required(),
  parameters,
});

type JoiCommand = Omit<Command, "filename">;

export const validateConfig = (config: JoiCommand): JoiCommand | never =>
  validate<Command>(config, commandSchema, {
    message: "Command file is invalid",
  });
