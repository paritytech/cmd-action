export interface Command {
  name: string;
  filename: string;
  location: string;
  description?: string;
  machine?: string[];
  timeout?: number;
  commandStart: string;
}
