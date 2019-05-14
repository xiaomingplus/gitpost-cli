import {Command} from '@oclif/command'
const hexoCli = require('hexo-cli')
const minimist = require('minimist')
const path = require('path')
export default class Hexo extends Command {
  static description = `Remove generated files and cache.
View more at: https://hexo.io/zh-cn/docs/commands#clean`

  static examples = [
    'gitpost clean'
  ]

  static flags = {
  }

  async run() {
    hexoCli(path.resolve(process.cwd(), '.hexo'), minimist(process.argv.slice(2)))
  }
}
