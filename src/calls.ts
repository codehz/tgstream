import { GramTGCalls } from "gram-tgcalls";
import { Api } from "telegram";
import client from "./client.js";

const mapped = new Map<number, GramTGCalls>();

export default async (id: number) => {
  if (mapped.has(id)) return mapped.get(id);
  const chat = await client.getEntity(id) as Api.Chat;
  if (!chat.callActive) return null;
  const ret = new GramTGCalls(client, id);
  mapped.set(id, ret);
  return ret;
};
