import path from 'node:path'
import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: { ...config.resolve, alias: { ...(config.resolve?.alias ?? {}), '@': path.join(process.cwd(), 'src') } },
}))
