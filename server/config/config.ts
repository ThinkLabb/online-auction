import * as dotenv from 'dotenv';

dotenv.config();

export default class Config {
  public readonly PORT: number;

  constructor() {
    this.PORT = Number(process.env.PORT);
  }
}
