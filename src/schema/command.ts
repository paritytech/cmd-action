export interface Command {
  name: string;
  location: string;
  description?: string;
  machine?: string[];
  timeout?: number;
  commandStart: string;
}
