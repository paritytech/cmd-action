export interface Command {
  name: string;
  description?: string;
  machine?: string[];
  timeout?: number;
  commandStart: string;
}
