import { PassThrough, Readable } from "stream";
import type {
  StreamAudioOptions,
  StreamVideoOptions,
} from "gram-tgcalls/lib/types";
import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import config from "./config.js";

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

const cfg = config.COOKIES
  ? {
    requestOptions: {
      headers: {
        cookie: config.COOKIES,
      },
    },
  }
  : {};

export default async function get(id: string) {
  const info = await ytdl.getInfo(id, cfg);
  const formats: Array<ytdl.videoFormat & { signatureCipher?: string }> =
    info.formats;
  let video: ytdl.videoFormat & { signatureCipher?: string };
  let audio: ytdl.videoFormat & { signatureCipher?: string };
  let vidx = VIDEOS.length;
  let aidx = AUDIOS.length;
  for (const fmt of formats) {
    if (!fmt.url) {
      if (!fmt.signatureCipher) continue;
      const search = new URLSearchParams(fmt.signatureCipher);
      fmt.url = search.get("url");
      if (!fmt.url) continue;
    }
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
  const ret: AVInfo = {};
  if (video) {
    const download = ytdl.downloadFromInfo(info, { filter: (x) => x == video });
    const source = ffmpeg(download)
      .size(`${video.width}x${video.height}`)
      .fps(video.fps)
      .format("rawvideo");
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
    const download = ytdl.downloadFromInfo(info, { filter: (x) => x == audio });
    const sampleRate = +audio.audioSampleRate || 32500;
    const source = ffmpeg(download)
      .audioCodec("pcm_s16le")
      .format("s16le")
      .audioFrequency(sampleRate)
      .audioChannels(1);
    ret.audio = {
      readable: source.pipe() as PassThrough,
      options: {
        bitsPerSample: 16,
        sampleRate,
        channelCount: 1,
      },
    };
  }
  return ret;
}
