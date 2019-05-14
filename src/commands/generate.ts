import {Command} from '@oclif/command'
const hexoCli = require('hexo-cli')
const minimist = require('minimist')
const path = require('path')
export default class Hexo extends Command {
  static description = `SGenerate static files..
View more at: https://hexo.io/zh-cn/docs/commands#generate`

  static examples = [
    'gitpost generate'
  ]

  static flags = {
  }

  async run() {
    hexoCli(path.resolve(process.cwd(), '.hexo'), minimist(process.argv.slice(2)))
  }
}
