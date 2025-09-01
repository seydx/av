import assert from 'node:assert';
import { describe, it } from 'node:test';

import { HardwareFilterPresets } from '../src/api/filter-presets.js';
import {
  AV_HWDEVICE_TYPE_CUDA,
  AV_HWDEVICE_TYPE_QSV,
  AV_HWDEVICE_TYPE_VAAPI,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_PIX_FMT_NV12,
  AV_PIX_FMT_YUV420P,
  AV_SAMPLE_FMT_FLTP,
  AV_SAMPLE_FMT_S16,
  FilterPresets,
} from '../src/index.js';
import { prepareTestEnvironment } from './index.js';

prepareTestEnvironment();

describe('FilterPresets', () => {
  describe('Software Filter Presets', () => {
    it('should create scale filter', () => {
      const filter = FilterPresets.scale(1920, 1080);
      assert.strictEqual(filter, 'scale=1920:1080');

      const filterWithFlags = FilterPresets.scale(1280, 720, 'bicubic');
      assert.strictEqual(filterWithFlags, 'scale=1280:720:flags=bicubic');
    });

    it('should create crop filter', () => {
      const filter = FilterPresets.crop(640, 480, 100, 50);
      assert.strictEqual(filter, 'crop=640:480:100:50');

      const filterNoOffset = FilterPresets.crop(640, 480);
      assert.strictEqual(filterNoOffset, 'crop=640:480:0:0');
    });

    it('should create fps filter', () => {
      const filter = FilterPresets.fps(30);
      assert.strictEqual(filter, 'fps=30');
    });

    it('should create format filter with single format', () => {
      const filterString = FilterPresets.format('yuv420p');
      assert.strictEqual(filterString, 'format=yuv420p');

      const filterEnum = FilterPresets.format(AV_PIX_FMT_YUV420P);
      assert.strictEqual(filterEnum, 'format=yuv420p');
    });

    it('should create format filter with multiple formats', () => {
      const filter = FilterPresets.format([AV_PIX_FMT_NV12, AV_PIX_FMT_YUV420P]);
      assert.strictEqual(filter, 'format=nv12,format=yuv420p');

      const filterMixed = FilterPresets.format(['nv12', AV_PIX_FMT_YUV420P]);
      assert.strictEqual(filterMixed, 'format=nv12,format=yuv420p');
    });

    it('should create rotate filter', () => {
      const filter = FilterPresets.rotate(90);
      assert.strictEqual(filter, 'rotate=90*PI/180');
    });

    it('should create flip filters', () => {
      const hflip = FilterPresets.hflip();
      assert.strictEqual(hflip, 'hflip');

      const vflip = FilterPresets.vflip();
      assert.strictEqual(vflip, 'vflip');
    });

    it('should create fade filter', () => {
      const fadeIn = FilterPresets.fade('in', 0, 2);
      assert.strictEqual(fadeIn, 'fade=t=in:st=0:d=2');

      const fadeOut = FilterPresets.fade('out', 10, 1);
      assert.strictEqual(fadeOut, 'fade=t=out:st=10:d=1');
    });

    it('should create overlay filter', () => {
      const basic = FilterPresets.overlay();
      assert.strictEqual(basic, 'overlay=0:0');

      const positioned = FilterPresets.overlay(100, 50);
      assert.strictEqual(positioned, 'overlay=100:50');

      // Note: Static method doesn't support options, only instance method does
      // For options, use chain builder
      const chain = FilterPresets.chain().overlay(10, 10, { format: 'rgb' }).build();
      assert.strictEqual(chain, 'overlay=10:10:format=rgb');
    });
  });

  describe('Audio Filter Presets', () => {
    it('should create volume filter', () => {
      const filter = FilterPresets.volume(0.5);
      assert.strictEqual(filter, 'volume=0.5');
    });

    it('should create aformat filter', () => {
      const basic = FilterPresets.aformat('s16');
      assert.strictEqual(basic, 'aformat=sample_fmts=s16');

      const withEnum = FilterPresets.aformat(AV_SAMPLE_FMT_S16);
      assert.strictEqual(withEnum, 'aformat=sample_fmts=s16');

      const withRate = FilterPresets.aformat('fltp', 48000);
      assert.strictEqual(withRate, 'aformat=sample_fmts=fltp:sample_rates=48000');

      const full = FilterPresets.aformat(AV_SAMPLE_FMT_FLTP, 44100, 'stereo');
      assert.strictEqual(full, 'aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo');
    });

    it('should create atempo filter', () => {
      const filter = FilterPresets.atempo(1.5);
      assert.strictEqual(filter, 'atempo=1.5');
    });

    it('should create afade filter', () => {
      const fadeIn = FilterPresets.afade('in', 0, 3);
      assert.strictEqual(fadeIn, 'afade=t=in:st=0:d=3');

      const fadeOut = FilterPresets.afade('out', 20, 2);
      assert.strictEqual(fadeOut, 'afade=t=out:st=20:d=2');
    });

    it('should create amix filter', () => {
      const basic = FilterPresets.amix();
      assert.strictEqual(basic, 'amix=inputs=2:duration=longest');

      const custom = FilterPresets.amix(3, 'first');
      assert.strictEqual(custom, 'amix=inputs=3:duration=first');
    });
  });

  describe('Filter Chain Builder', () => {
    it('should build simple filter chain', () => {
      const chain = FilterPresets.chain().scale(1920, 1080).format(AV_PIX_FMT_YUV420P).build();

      assert.strictEqual(chain, 'scale=1920:1080,format=yuv420p');
    });

    it('should build complex filter chain', () => {
      const chain = FilterPresets.chain().scale(1280, 720).crop(640, 480, 320, 120).fps(30).format(['nv12', 'yuv420p']).fade('in', 0, 1).build();

      assert.strictEqual(chain, 'scale=1280:720,crop=640:480:320:120,fps=30,format=nv12,format=yuv420p,fade=t=in:st=0:d=1');
    });

    it('should support custom filters in chain', () => {
      const chain = FilterPresets.chain().scale(1920, 1080).custom('unsharp=5:5:1.0').format('yuv420p').build();

      assert.strictEqual(chain, 'scale=1920:1080,unsharp=5:5:1.0,format=yuv420p');
    });

    it('should build audio filter chain', () => {
      const chain = FilterPresets.chain().volume(0.8).aformat('fltp', 48000, 'stereo').atempo(1.25).afade('in', 0, 2).build();

      assert.strictEqual(chain, 'volume=0.8,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,atempo=1.25,afade=t=in:st=0:d=2');
    });

    it('should handle mixed video and audio filters', () => {
      const chain = FilterPresets.chain().scale(1920, 1080).volume(0.5).format('yuv420p').aformat('s16', 44100).build();

      assert.strictEqual(chain, 'scale=1920:1080,volume=0.5,format=yuv420p,aformat=sample_fmts=s16:sample_rates=44100');
    });

    it('should support custom separator', () => {
      const chain = FilterPresets.chain().scale(1920, 1080).format('yuv420p').build(';');

      assert.strictEqual(chain, 'scale=1920:1080;format=yuv420p');
    });

    it('should return filter array', () => {
      const filters = FilterPresets.chain().scale(1920, 1080).format('yuv420p').fps(30).toArray();

      assert.deepStrictEqual(filters, ['scale=1920:1080', 'format=yuv420p', 'fps=30']);
    });

    it('should skip null filters', () => {
      const chain = FilterPresets.chain();
      chain.add('scale=1920:1080');
      chain.add(null);
      chain.add(undefined);
      chain.add('format=yuv420p');

      assert.strictEqual(chain.build(), 'scale=1920:1080,format=yuv420p');
    });

    it('should support hardware upload/download in chain', () => {
      const chain = FilterPresets.chain().hwupload().scale(1920, 1080).hwdownload().format('yuv420p').build();

      assert.strictEqual(chain, 'hwupload,scale=1920:1080,hwdownload,format=yuv420p');
    });
  });

  describe('Hardware Filter Presets', () => {
    describe('CUDA', () => {
      const cuda = new HardwareFilterPresets(AV_HWDEVICE_TYPE_CUDA, 'cuda');

      it('should create CUDA scale filter', () => {
        const filter = cuda.scale(1920, 1080);
        assert.strictEqual(filter, 'scale_cuda=1920:1080');

        const withOptions = cuda.scale(1280, 720, { interp_algo: 'lanczos' });
        assert.strictEqual(withOptions, 'scale_cuda=1280:720:interp_algo=lanczos');
      });

      it('should create CUDA overlay filter', () => {
        const filter = cuda.overlay(100, 50);
        assert.strictEqual(filter, 'overlay_cuda=100:50');
      });

      it('should create CUDA tonemap filter', () => {
        const filter = cuda.tonemap();
        assert.strictEqual(filter, 'tonemap_cuda');

        const withOptions = cuda.tonemap({ tonemap: 'hable', desat: '0' });
        assert.strictEqual(withOptions, 'tonemap_cuda=tonemap=hable:desat=0');
      });

      it('should build CUDA filter chain', () => {
        const chain = cuda.chain().hwupload().scale(1920, 1080).overlay(0, 0).hwdownload().build();

        assert.strictEqual(chain, 'hwupload_cuda,scale_cuda=1920:1080,overlay_cuda=0:0,hwdownload');
      });
    });

    describe('VideoToolbox', () => {
      const vt = new HardwareFilterPresets(AV_HWDEVICE_TYPE_VIDEOTOOLBOX, 'videotoolbox');

      it('should create VideoToolbox scale filter', () => {
        const filter = vt.scale(1920, 1080);
        assert.strictEqual(filter, 'scale_vt=1920:1080');
      });

      it('should support overlay and tonemap filters', () => {
        const overlay = vt.overlay();
        assert.strictEqual(overlay, 'overlay_videotoolbox=0:0');

        const tonemap = vt.tonemap();
        assert.strictEqual(tonemap, 'tonemap_videotoolbox');
      });

      it('should build VideoToolbox filter chain', () => {
        const chain = vt.chain().hwupload().scale(1920, 1080).overlay(50, 50).tonemap().hwdownload().build();

        assert.strictEqual(chain, 'hwupload,scale_vt=1920:1080,overlay_videotoolbox=50:50,tonemap_videotoolbox,hwdownload');
      });
    });

    describe('QSV', () => {
      const qsv = new HardwareFilterPresets(AV_HWDEVICE_TYPE_QSV, 'qsv');

      it('should create QSV scale filter', () => {
        const filter = qsv.scale(1920, 1080);
        assert.strictEqual(filter, 'scale_qsv=1920:1080');
      });

      it('should create QSV deinterlace filter', () => {
        const filter = qsv.deinterlace();
        assert.strictEqual(filter, 'deinterlace_qsv');

        const withMode = qsv.deinterlace('bob');
        assert.strictEqual(withMode, 'deinterlace_qsv=mode=bob');
      });

      it('should create QSV overlay filter', () => {
        const filter = qsv.overlay(100, 50);
        assert.strictEqual(filter, 'overlay_qsv=100:50');
      });

      it('should build QSV filter chain', () => {
        const chain = qsv.chain().hwupload().scale(1920, 1080).deinterlace().overlay(0, 0).hwdownload().build();

        assert.strictEqual(chain, 'hwupload,scale_qsv=1920:1080,deinterlace_qsv,overlay_qsv=0:0,hwdownload');
      });
    });

    describe('VAAPI', () => {
      const vaapi = new HardwareFilterPresets(AV_HWDEVICE_TYPE_VAAPI, 'vaapi');

      it('should create VAAPI scale filter', () => {
        const filter = vaapi.scale(1920, 1080);
        assert.strictEqual(filter, 'scale_vaapi=1920:1080');
      });

      it('should create VAAPI deinterlace filter', () => {
        const filter = vaapi.deinterlace();
        assert.strictEqual(filter, 'deinterlace_vaapi');

        const withMode = vaapi.deinterlace('motion_adaptive');
        assert.strictEqual(withMode, 'deinterlace_vaapi=mode=motion_adaptive');
      });

      it('should create VAAPI tonemap filter', () => {
        const filter = vaapi.tonemap();
        assert.strictEqual(filter, 'tonemap_vaapi');
      });

      it('should build VAAPI filter chain', () => {
        const chain = vaapi.chain().hwupload().scale(1920, 1080).deinterlace().tonemap().hwdownload().build();

        assert.strictEqual(chain, 'hwupload,scale_vaapi=1920:1080,deinterlace_vaapi,tonemap_vaapi,hwdownload');
      });
    });

    describe('Hardware capabilities', () => {
      it('should have correct support flags for CUDA', () => {
        const cuda = new HardwareFilterPresets(AV_HWDEVICE_TYPE_CUDA, 'cuda');

        assert.strictEqual(cuda.support.scale, true);
        assert.strictEqual(cuda.support.overlay, true);
        assert.strictEqual(cuda.support.tonemap, true);
        assert.strictEqual(cuda.support.deinterlace, true);
      });

      it('should have correct support flags for VideoToolbox', () => {
        const vt = new HardwareFilterPresets(AV_HWDEVICE_TYPE_VIDEOTOOLBOX, 'videotoolbox');

        assert.strictEqual(vt.support.scale, true);
        assert.strictEqual(vt.support.overlay, true); // Updated based on patches
        assert.strictEqual(vt.support.tonemap, true); // Updated based on patches
        assert.strictEqual(vt.support.deinterlace, true); // yadif_videotoolbox
      });

      it('should have correct support flags for QSV', () => {
        const qsv = new HardwareFilterPresets(AV_HWDEVICE_TYPE_QSV, 'qsv');

        assert.strictEqual(qsv.support.scale, true);
        assert.strictEqual(qsv.support.overlay, true);
        assert.strictEqual(qsv.support.deinterlace, true);
        assert.strictEqual(qsv.support.tonemap, false);
      });
    });

    describe('Hardware filter chain with fallbacks', () => {
      it('should build VideoToolbox chain with supported filters', () => {
        const vt = new HardwareFilterPresets(AV_HWDEVICE_TYPE_VIDEOTOOLBOX, 'videotoolbox');
        const chain = vt
          .chain()
          .scale(1920, 1080) // supported
          .overlay(0, 0) // supported
          .tonemap() // supported
          .build();

        assert.strictEqual(chain, 'scale_vt=1920:1080,overlay_videotoolbox=0:0,tonemap_videotoolbox');
      });

      it('should build complex hardware chain with format conversions', () => {
        const cuda = new HardwareFilterPresets(AV_HWDEVICE_TYPE_CUDA, 'cuda');
        const chain = cuda.chain().hwupload().scale(3840, 2160).tonemap({ tonemap: 'reinhard' }).scale(1920, 1080).hwdownload().format(['nv12', 'yuv420p']).build();

        assert.strictEqual(chain, 'hwupload_cuda,scale_cuda=3840:2160,tonemap_cuda=tonemap=reinhard,scale_cuda=1920:1080,hwdownload,format=nv12,format=yuv420p');
      });
    });
  });

  describe('Static helper methods', () => {
    it('should detect hardware filters using FFmpeg flags', () => {
      // Test some known hardware filters
      // Note: These tests depend on what filters are actually available in the FFmpeg build

      // Hardware filters should return true
      const hwFilters = ['scale_cuda', 'scale_vaapi', 'scale_qsv', 'overlay_cuda', 'hwupload', 'hwupload_cuda', 'hwdownload'];

      for (const filterName of hwFilters) {
        const result = HardwareFilterPresets.isHardwareFilter(filterName);
        // We can't assert true/false directly since it depends on FFmpeg build
        // Just check that it returns a boolean
        assert.strictEqual(typeof result, 'boolean', `isHardwareFilter('${filterName}') should return a boolean`);
      }

      // Software filters should return false
      const swFilters = ['scale', 'crop', 'overlay', 'format', 'fps', 'rotate'];

      for (const filterName of swFilters) {
        const result = HardwareFilterPresets.isHardwareFilter(filterName);
        assert.strictEqual(result, false, `isHardwareFilter('${filterName}') should return false for software filter`);
      }

      // Non-existent filters should return false
      assert.strictEqual(HardwareFilterPresets.isHardwareFilter('nonexistent_filter'), false);
      assert.strictEqual(HardwareFilterPresets.isHardwareFilter(''), false);
    });
  });
});
