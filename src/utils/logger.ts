import pino from 'pino';
import { mkdirSync } from 'node:fs';
import process from 'node:process';

const logDir = 'logs';

try {
  mkdirSync(logDir, { recursive: true });
} catch (_error) {
  // ディレクトリが既に存在する場合は無視
}

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
}, pino.multistream([
  // コンソール出力（開発環境でのみpretty形式）
  {
    stream: isDevelopment 
      ? pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        })
      : process.stdout,
  },
  // ローテーション機能付きファイル出力
  {
    stream: pino.transport({
      target: 'pino-roll',
      options: {
        file: `${logDir}/app.log`,
        frequency: 'daily',
        size: '10m',
        limit: { count: 10 },
      },
    }),
  },
  // エラーログ専用ファイル（ローテーション機能付き）
  {
    level: 'error',
    stream: pino.transport({
      target: 'pino-roll',
      options: {
        file: `${logDir}/error.log`,
        frequency: 'daily',
        size: '10m',
        limit: { count: 10 },
      },
    }),
  },
]));

export default logger;