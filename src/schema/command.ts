export interface Command {
  name: string;
  filename: string;
  location: string;
  description?: string;
  machine?: string[];
  timeout?: number;
  commandStart: string;
  parameters?: Parameter[];
}

export interface Parameter {
  name: string;
  description?: string;
  args: ParameterArgument[];
}

export interface ParameterArgument {
  arg: string;
  label: string;
  options: string;
  example?: string;
  type: "string" | "one_of" | "regex";
  input: string | string[];
}
