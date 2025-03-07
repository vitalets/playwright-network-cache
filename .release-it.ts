import type { Config } from 'release-it';

export default {
  git: {
    requireCleanWorkingDir: false,
  },
  hooks: {
    'before:init': [
      'npm run lint',
      'npm run prettier',
      'npm ci',
      'npm test',
      'npm run example',
      'npm run build',
    ],
  },
  plugins: {
    '@release-it/keep-a-changelog': {
      filename: 'CHANGELOG.md',
      addUnreleased: true,
      addVersionUrl: true,
    },
  },
} satisfies Config;
