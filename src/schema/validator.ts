import { validate } from "@eng-automation/js";
import Joi from "joi";

import { Command, Parameter, ParameterArgument } from "./command";

const parametersArgs = {
  arg: Joi.string().required(),
  label: Joi.string().optional(),
  example: Joi.string().optional(),
};

const stringParameter = Joi.object<ParameterArgument>().keys({
  ...parametersArgs,
  type: Joi.string().equal("string").required(),
  input: Joi.string().required(),
});

const oneOfParameter = Joi.object<ParameterArgument>().keys({
  ...parametersArgs,
  type: Joi.string().equal("one_of").required(),
  input: Joi.array().items(Joi.string().required()).min(1).required(),
});

const regexParameter = Joi.object<ParameterArgument>().keys({
  ...parametersArgs,
  type: Joi.string().equal("regex").required(),
  input: Joi.array().items(Joi.string().required()),
});

const parameters = Joi.array<Parameter>().items({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  args: Joi.array<Parameter["args"]>().items(
    Joi.alternatives().try(stringParameter, oneOfParameter, regexParameter),
  ),
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
