import { PassThrough, Transform, TransformCallback } from "stream";

export default class Buffered extends Transform {
  #stream = new PassThrough();
  // #

  constructor(bps: number) {
    super({ highWaterMark: 100 });
    this.#stream.pause();
    this.#stream.read();
  }

  start() {
  }

  _transform(
    chunk: Uint8Array,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
    this.#stream.write(chunk, encoding, callback);
  }
}
