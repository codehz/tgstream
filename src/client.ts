import config from "./config.js";
import { StringSession } from "telegram/sessions/index.js";
import { TelegramClient } from "telegram";

const client = new TelegramClient(
  new StringSession(config.SESSION),
  config.API_ID,
  config.API_HASH,
  {
    connectionRetries: 10,
  },
);

await client.start({ botAuthToken: "" });

export default client;
