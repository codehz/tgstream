import { PassThrough, Readable } from "stream";
import got from "got/dist/source/index.js";
import type {
  StreamAudioOptions,
  StreamVideoOptions,
} from "gram-tgcalls/lib/types";
import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { GramTGCalls } from "gram-tgcalls";

// deno-fmt-ignore
const VIDEOS = [
  136, 247, 398, 22, 45, 84, 95, 102, // 720p
  135, 168, 218, 244, 245, 246, 397, 35, 44, 83, 94, 101, // 480p
  134, 167, 243, 396, 18, 34, 43, 82, 93, 100, // 360p
];

const AUDIOS = [139, 140, 171, 141, 82];

interface MediaInfo<T> {
  readable: Readable;
  options: T;
}

interface AVInfo {
  audio?: MediaInfo<StreamAudioOptions>;
  video?: MediaInfo<StreamVideoOptions>;
}

export default async function get(id: string) {
  const info = await ytdl.getBasicInfo(id);
  const formats = info.formats;
  let video: ytdl.videoFormat;
  let audio: ytdl.videoFormat;
  let vidx = VIDEOS.length;
  let aidx = AUDIOS.length;
  for (const fmt of formats) {
    const vid = VIDEOS.indexOf(fmt.itag);
    if (vid != -1 && vid < vidx) {
      vidx = vid;
      video = fmt;
    }
    const aid = AUDIOS.indexOf(fmt.itag);
    if (aid != -1 && aid < aidx) {
      aidx = aid;
      audio = fmt;
    }
  }
  console.log(video, audio);
  const ret: AVInfo = {};
  if (video) {
    const source = ffmpeg(video.url).format("rawvideo");
    ret.video = {
      readable: source.pipe() as PassThrough,
      options: {
        width: video.width,
        height: video.height,
        framerate: video.fps,
      },
    };
  }
  if (audio) {
    const source = ffmpeg(audio.url)
      .format("s16le")
      .audioFrequency(32500)
      .audioChannels(1);
    ret.audio = {
      readable: source.pipe() as PassThrough,
      options: {
        bitsPerSample: 16,
        sampleRate: 32500,
        channelCount: 1,
      },
    };
  }
  return ret;
}