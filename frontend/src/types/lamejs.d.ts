declare module "@breezystack/lamejs" {
  export interface WavHeaderResult {
    channels: number;
    sampleRate: number;
    dataLen: number;
    dataOffset: number;
  }

  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
    flush(): Int8Array;
  }

  export const WavHeader: {
    readHeader(dataView: DataView): WavHeaderResult;
  };

  const lamejs: {
    Mp3Encoder: typeof Mp3Encoder;
    WavHeader: typeof WavHeader;
  };

  export default lamejs;
}
