import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_YUV444P, AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_S16, FilterPreset } from '../src/index.js';

describe('FilterPreset', () => {
  describe('chain()', () => {
    it('should create an empty filter chain', () => {
      const chain = FilterPreset.chain();
      const graph = chain.build();
      strictEqual(graph, '');
    });

    it('should create a chain with custom filter', () => {
      const chain = FilterPreset.chain();
      chain.custom('scale=640:480');
      const graph = chain.build();
      strictEqual(graph, 'scale=640:480');
    });
  });

  describe('Video Filters', () => {
    describe('scale()', () => {
      it('should add scale filter with dimensions', () => {
        const graph = FilterPreset.chain().scale(1920, 1080).build();
        strictEqual(graph, 'scale=1920:1080');
      });

      it('should add scale filter with options', () => {
        const graph = FilterPreset.chain().scale(1920, 1080, { flags: 'bicubic' }).build();
        strictEqual(graph, 'scale=1920:1080:flags=bicubic');
      });

      it('should handle -1 for maintaining aspect ratio', () => {
        const graph = FilterPreset.chain().scale(1920, -1).build();
        strictEqual(graph, 'scale=1920:-1');
      });
    });

    describe('format()', () => {
      it('should add format filter with pixel format', () => {
        const graph = FilterPreset.chain().format(AV_PIX_FMT_YUV420P).build();
        strictEqual(graph, 'format=yuv420p');
      });

      it('should handle multiple pixel formats', () => {
        const graph = FilterPreset.chain().format([AV_PIX_FMT_YUV420P, AV_PIX_FMT_YUV444P]).build();
        strictEqual(graph, 'format=yuv420p,format=yuv444p');
      });
    });

    describe('fps()', () => {
      it('should add fps filter with frame rate', () => {
        const graph = FilterPreset.chain().fps(30).build();
        strictEqual(graph, 'fps=30');
      });

      it('should handle decimal frame rate', () => {
        const graph = FilterPreset.chain().fps(29.97).build();
        strictEqual(graph, 'fps=29.97');
      });

      // fps() doesn't support options in current implementation
    });

    describe('crop()', () => {
      it('should add crop filter', () => {
        const graph = FilterPreset.chain().crop(640, 480, 100, 50).build();
        strictEqual(graph, 'crop=640:480:100:50');
      });

      it('should handle crop without position', () => {
        const graph = FilterPreset.chain().crop(640, 480).build();
        strictEqual(graph, 'crop=640:480:0:0');
      });
    });

    describe('pad()', () => {
      it('should add pad filter', () => {
        const graph = FilterPreset.chain().pad(1920, 1080, '100', '50').build();
        strictEqual(graph, 'pad=1920:1080:100:50:black');
      });

      it('should handle pad with color', () => {
        const graph = FilterPreset.chain().pad(1920, 1080, '0', '0', 'white').build();
        strictEqual(graph, 'pad=1920:1080:0:0:white');
      });
    });

    describe('rotate()', () => {
      it('should add rotate filter', () => {
        const graph = FilterPreset.chain()
          .rotate(90)
          .build();
        strictEqual(graph, 'rotate=90*PI/180');
      });

      // rotate() doesn't support options in current implementation
    });

    describe('flip()', () => {
      it('should add hflip', () => {
        const graph = FilterPreset.chain().flip('h').build();
        strictEqual(graph, 'hflip');
      });

      it('should add vflip', () => {
        const graph = FilterPreset.chain().flip('v').build();
        strictEqual(graph, 'vflip');
      });

      // flip() only supports 'h' or 'v', not 'both'
    });

    describe('overlay()', () => {
      it('should add overlay filter', () => {
        const graph = FilterPreset.chain().overlay(100, 50).build();
        strictEqual(graph, 'overlay=100:50');
      });

      it('should handle overlay with options', () => {
        const graph = FilterPreset.chain().overlay(100, 50, { format: 'rgb' }).build();
        strictEqual(graph, 'overlay=100:50:format=rgb');
      });
    });

    describe('drawtext()', () => {
      it('should add drawtext filter', () => {
        const graph = FilterPreset.chain().drawtext('Hello World', { x: 10, y: 10 }).build();
        strictEqual(graph, "drawtext=text='Hello World':x=10:y=10");
      });

      it('should handle complex text options', () => {
        const graph = FilterPreset.chain()
          .drawtext('Test', {
            x: 10,
            y: 10,
            fontsize: 24,
            fontcolor: 'white',
            fontfile: '/path/to/font.ttf',
          })
          .build();
        strictEqual(graph, "drawtext=text='Test':x=10:y=10:fontsize=24:fontcolor=white:fontfile='/path/to/font.ttf'");
      });
    });

    describe('setpts()', () => {
      it('should add setpts filter', () => {
        const graph = FilterPreset.chain().setpts('PTS*2').build();
        strictEqual(graph, 'setpts=PTS*2');
      });
    });

    describe('trim()', () => {
      it('should add trim filter', () => {
        const graph = FilterPreset.chain().trim(10, 20).build();
        strictEqual(graph, 'trim=start=10:end=20');
      });

      it('should handle trim with only start', () => {
        const graph = FilterPreset.chain().trim(10).build();
        strictEqual(graph, 'trim=start=10');
      });

      it('should handle trim with duration', () => {
        const graph = FilterPreset.chain().trim(10, undefined, 5).build();
        strictEqual(graph, 'trim=start=10:duration=5');
      });
    });

    describe('deinterlace()', () => {
      it('should add yadif filter', () => {
        const graph = FilterPreset.chain().deinterlace().build();
        strictEqual(graph, 'yadif');
      });

      it('should add bwdif filter', () => {
        const graph = FilterPreset.chain().deinterlace('bwdif').build();
        strictEqual(graph, 'bwdif');
      });

      it('should handle deinterlace options', () => {
        const graph = FilterPreset.chain().deinterlace('yadif', { mode: 1, parity: 0 }).build();
        strictEqual(graph, 'yadif=mode=1:parity=0');
      });
    });
  });

  describe('Audio Filters', () => {
    describe('aformat()', () => {
      it('should add aformat with sample format', () => {
        const graph = FilterPreset.chain().aformat(AV_SAMPLE_FMT_FLTP).build();
        strictEqual(graph, 'aformat=sample_fmts=fltp');
      });

      it('should add aformat with sample rate', () => {
        const graph = FilterPreset.chain().aformat(AV_SAMPLE_FMT_FLTP, 48000).build();
        strictEqual(graph, 'aformat=sample_fmts=fltp:sample_rates=48000');
      });

      it('should add aformat with channel layout', () => {
        const graph = FilterPreset.chain().aformat(AV_SAMPLE_FMT_FLTP, 48000, 'stereo').build();
        strictEqual(graph, 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo');
      });

      it('should combine all aformat options', () => {
        const graph = FilterPreset.chain().aformat(AV_SAMPLE_FMT_FLTP, 48000, 'stereo').build();
        strictEqual(graph, 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo');
      });

      it('should handle multiple sample formats', () => {
        const graph = FilterPreset.chain().aformat([AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_S16]).build();
        strictEqual(graph, 'aformat=sample_fmts=fltp|s16');
      });
    });

    describe('aresample()', () => {
      it('should add aresample filter', () => {
        const graph = FilterPreset.chain().aresample(48000).build();
        strictEqual(graph, 'aresample=48000');
      });

      // aresample() doesn't support options in current implementation
    });

    describe('volume()', () => {
      it('should add volume filter', () => {
        const graph = FilterPreset.chain().volume(0.5).build();
        strictEqual(graph, 'volume=0.5');
      });

      it('should handle volume factor', () => {
        const graph = FilterPreset.chain().volume(2.0).build();
        strictEqual(graph, 'volume=2');
      });
    });

    describe('atempo()', () => {
      it('should add atempo filter', () => {
        const graph = FilterPreset.chain().atempo(1.5).build();
        strictEqual(graph, 'atempo=1.5');
      });

      // atempo() doesn't automatically chain in current implementation
      // values must be between 0.5 and 2.0
    });

    describe('adelay()', () => {
      it('should add adelay filter', () => {
        const graph = FilterPreset.chain().adelay(100).build();
        strictEqual(graph, 'adelay=100');
      });

      it('should handle multiple channel delays', () => {
        const graph = FilterPreset.chain().adelay([100, 200]).build();
        strictEqual(graph, 'adelay=100|200');
      });
    });

    describe('aecho()', () => {
      it('should add aecho filter', () => {
        const graph = FilterPreset.chain().aecho(0.8, 0.9, 1000, 0.3).build();
        strictEqual(graph, 'aecho=0.8:0.9:1000:0.3');
      });
    });

    describe('highpass()', () => {
      it('should add highpass filter', () => {
        const graph = FilterPreset.chain().highpass(200).build();
        strictEqual(graph, 'highpass=f=200');
      });

      it('should handle highpass with options', () => {
        const graph = FilterPreset.chain().highpass(200, { width_type: 'q', width: 1 }).build();
        strictEqual(graph, 'highpass=f=200:width_type=q:width=1');
      });
    });

    describe('lowpass()', () => {
      it('should add lowpass filter', () => {
        const graph = FilterPreset.chain().lowpass(5000).build();
        strictEqual(graph, 'lowpass=f=5000');
      });
    });

    describe('bandpass()', () => {
      it('should add bandpass filter', () => {
        const graph = FilterPreset.chain().bandpass(1000).build();
        strictEqual(graph, 'bandpass=f=1000');
      });
    });

    describe('equalizer()', () => {
      it('should add equalizer filter', () => {
        const graph = FilterPreset.chain().equalizer(1000, 2, 5).build();
        strictEqual(graph, 'equalizer=f=1000:width=2:gain=5');
      });

      it('should handle equalizer with width_type', () => {
        const graph = FilterPreset.chain().equalizer(1000, 2, 5, 'q').build();
        strictEqual(graph, 'equalizer=f=1000:width_type=q:width=2:gain=5');
      });
    });

    describe('compressor()', () => {
      it('should add compressor filter with default options', () => {
        const graph = FilterPreset.chain().compressor().build();
        strictEqual(graph, 'acompressor');
      });

      it('should add compressor with options', () => {
        const graph = FilterPreset.chain()
          .compressor({
            threshold: 0.5,
            ratio: 4,
            attack: 5,
            release: 50,
          })
          .build();
        strictEqual(graph, 'acompressor=threshold=0.5:ratio=4:attack=5:release=50');
      });
    });

    describe('asetnsamples()', () => {
      it('should add asetnsamples filter with padding', () => {
        const graph = FilterPreset.chain().asetnsamples(1024).build();
        strictEqual(graph, 'asetnsamples=n=1024:p=1');
      });

      it('should add asetnsamples filter without padding', () => {
        const graph = FilterPreset.chain().asetnsamples(1024, false).build();
        strictEqual(graph, 'asetnsamples=n=1024:p=0');
      });
    });

    describe('asetpts()', () => {
      it('should add asetpts filter', () => {
        const graph = FilterPreset.chain().asetpts('PTS*2').build();
        strictEqual(graph, 'asetpts=PTS*2');
      });
    });

    describe('atrim()', () => {
      it('should add atrim filter', () => {
        const graph = FilterPreset.chain().atrim(10, 20).build();
        strictEqual(graph, 'atrim=start=10:end=20');
      });
    });
  });

  describe('Generic Filters', () => {
    describe('select()', () => {
      it('should add select filter', () => {
        const graph = FilterPreset.chain().select('eq(pict_type,I)').build();
        strictEqual(graph, "select='eq(pict_type,I)'");
      });
    });

    describe('concat()', () => {
      it('should add concat filter', () => {
        const graph = FilterPreset.chain().concat(2, 1, 1).build();
        strictEqual(graph, 'concat=n=2:v=1:a=1');
      });
    });

    describe('split()', () => {
      it('should add split filter', () => {
        const graph = FilterPreset.chain().split(2).build();
        strictEqual(graph, 'split=2');
      });

      it('should default to 2 outputs', () => {
        const graph = FilterPreset.chain().split().build();
        strictEqual(graph, 'split=2');
      });
    });

    describe('asplit()', () => {
      it('should add asplit filter', () => {
        const graph = FilterPreset.chain().asplit(3).build();
        strictEqual(graph, 'asplit=3');
      });
    });

    describe('custom()', () => {
      it('should add custom filter', () => {
        const graph = FilterPreset.chain().custom('customfilter=option1=value1:option2=value2').build();
        strictEqual(graph, 'customfilter=option1=value1:option2=value2');
      });
    });
  });

  describe('Complex Chains', () => {
    it('should chain multiple filters', () => {
      const graph = FilterPreset.chain().scale(1920, 1080).format(AV_PIX_FMT_YUV420P).fps(30).build();
      strictEqual(graph, 'scale=1920:1080,format=yuv420p,fps=30');
    });

    it('should handle mixed audio and video filters', () => {
      const graph = FilterPreset.chain().scale(1920, 1080).aformat(AV_SAMPLE_FMT_FLTP, 48000).volume(0.8).build();
      strictEqual(graph, 'scale=1920:1080,aformat=sample_fmts=fltp:sample_rates=48000,volume=0.8');
    });

    it('should handle complex filter chain', () => {
      const graph = FilterPreset.chain()
        .scale(1280, 720)
        .crop(1024, 576)
        .pad(1920, 1080, '448', '252')
        .format(AV_PIX_FMT_YUV420P)
        .fps(25)
        .build();

      strictEqual(graph, 'scale=1280:720,crop=1024:576:0:0,pad=1920:1080:448:252:black,format=yuv420p,fps=25');
    });
  });

  // Preset methods are not implemented in current FilterPreset class

  describe('Edge Cases', () => {
    it('should handle empty chain', () => {
      const graph = FilterPreset.chain().build();
      strictEqual(graph, '');
    });

    it('should handle filter with no options', () => {
      const graph = FilterPreset.chain().custom('simplefilter').build();
      strictEqual(graph, 'simplefilter');
    });

    it('should escape special characters in text', () => {
      const graph = FilterPreset.chain().drawtext("Test's \"quoted\" text", { x: 10, y: 10 }).build();
      strictEqual(graph, "drawtext=text='Test\\'s \\\"quoted\\\" text':x=10:y=10");
    });

    it('should handle undefined/null values gracefully', () => {
      const graph = FilterPreset.chain().scale(1920, -1).trim(0, undefined, 10).build();
      strictEqual(graph, 'scale=1920:-1,trim=start=0:duration=10');
    });
  });
});
