import { execSync } from 'child_process';
import { arch, platform } from 'node:os';

export type ARCH = 'arm' | 'arm6' | 'arm7' | 'arm64' | 'ia32' | 'loong64' | 'mips' | 'mipsel' | 'ppc' | 'ppc64' | 'riscv64' | 's390' | 's390x' | 'x64';

export function getPlatform(): NodeJS.Platform {
  if (process.env.npm_config_os) {
    if (!process.env.npm_config_cpu) {
      throw new Error('npm_config_cpu is required when npm_config_os is set');
    }

    return process.env.npm_config_os as NodeJS.Platform;
  }

  return platform();
}

export function getArchitecture(): ARCH {
  if (process.env.npm_config_cpu) {
    if (!process.env.npm_config_os) {
      throw new Error('npm_config_os is required when npm_config_cpu is set');
    }

    return process.env.npm_config_cpu as ARCH;
  }

  const sysPlatform = getPlatform();
  let sysArch = arch() as ARCH;

  if (sysPlatform === 'win32') {
    try {
      const output = execSync('wmic cpu get architecture', { encoding: 'utf8' });
      const architecture = output.trim().split('\n')[1].trim();

      if (architecture === '5') {
        sysArch = 'arm6';
      } else if (architecture === '7') {
        sysArch = 'arm7';
      }
    } catch {
      //
    }
  } else if (sysPlatform === 'linux') {
    try {
      const output = execSync('cat /proc/cpuinfo | grep "model name"', { encoding: 'utf8' });
      const modelName = output.trim().split(':')[1].trim();

      if (modelName.includes('ARMv6')) {
        sysArch = 'arm6';
      } else if (modelName.includes('ARMv7')) {
        sysArch = 'arm7';
      }
    } catch {
      //
    }
  }

  return sysArch;
}
