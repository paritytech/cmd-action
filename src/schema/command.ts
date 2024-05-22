export interface Command {
  name: string;
  filename: string;
  location: string;
  description?: string;
  machine?: string[];
  timeout?: number;
  commandStart: string;
  parameters?: Parameters[];
}

export interface Parameters {
  name: string;
  description?: string;
  args: { arg: string; label: string; options: string }[];
}
