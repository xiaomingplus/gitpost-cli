import {Command} from '@oclif/command'
const hexoCli = require('hexo-cli')
const minimist = require('minimist')
const path = require('path')
export default class Hexo extends Command {
  static description = `Starts a local server. By default, this is at http://localhost:4000/.
View more at: https://hexo.io/zh-cn/docs/commands#server`

  static examples = [
    'gitpost server'
  ]

  static flags = {
  }

  async run() {
    hexoCli(path.resolve(process.cwd(), '.hexo'), minimist(process.argv.slice(2)))
  }
}
