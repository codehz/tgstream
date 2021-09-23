import { NewMessage, NewMessageEvent } from "telegram/events/index.js";
import ytdl from "./ytdl.js";
import calls, { clearCalls } from "./calls.js";
import client from "./client.js";

const ytb =
  /^(?:https?:\/\/)?(?:www\.|m\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/;

client.addEventHandler(async (e: NewMessageEvent) => {
  const msg = e.message;
  await msg.delete({});
  const text = msg.message;
  const link = /^stream (.*)/.exec(text)[1];
  const ytbm = link.match(ytb);
  const call = await calls(e.chatId);
  if (!call) return console.log("no active voice chat session");
  try {
    if (ytbm) {
      const id = ytbm[1];
      const { audio, video } = await ytdl(id);
      const maxCount = (audio ? 1 : 0) + (video ? 1 : 0);
      if (maxCount) throw new Error("no video or audio found");
      let expires = false;
      let readyCount = 0;
      const base = {
        onError(e: Error) {
          console.log("error");
          if (expires) return;
          expires = true;
          console.error(e);
          call.stop().catch(console.error);
        },
        onReady() {
          console.log("ready");
          readyCount++;
          if (readyCount == maxCount) {
            if (audio) {
              call.audio.unmute();
              call.audio.stream.resume();
            }
            if (video) {
              call.video.unmute();
              call.video.stream.resume();
            }
          }
        },
        onAlmostFinished() {
          console.log("almost-finished");
          readyCount--;
          if (audio) {
            call.audio.mute();
            call.audio.stream.pause();
          }
          if (video) {
            call.video.mute();
            call.video.stream.pause();
          }
        },
        onFinish() {
          console.log("finish");
          if (expires) return;
          expires = true;
          call.stop().catch(console.error);
        },
      } as const;
      await call.start({
        audio: base,
        video: base,
      });
      if (audio) {
        call.audio.stream.update(
          audio.readable,
          Object.assign({ buffer: 5, maxbuffer: 120 }, audio.options),
        );
      }
      if (video) {
        call.video.stream.update(
          video.readable,
          Object.assign({ buffer: 5, maxbuffer: 120 }, video.options),
        );
      }
    }
  } catch (e) {
    console.error(e);
  }
}, new NewMessage({ outgoing: true, forwards: false, pattern: /^stream .*/ }));

client.addEventHandler(
  async (e: NewMessageEvent) => {
    const msg = e.message;
    await msg.delete({});
    const call = await calls(e.chatId);
    if (!call) return console.log("no active voice chat session");
    await call.stop();
  },
  new NewMessage({ outgoing: true, forwards: false, pattern: /^stopstream$/ }),
);

process.on("SIGINT", async () => {
  console.log("shutdowning");
  await clearCalls();
  await client.disconnect();
  console.log("disconnected");
  process.exit(0);
});
