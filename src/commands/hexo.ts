import {Command} from '@oclif/command'
const hexoCli = require('hexo-cli')
const minimist = require('minimist')
const path = require('path')
export default class Hexo extends Command {
  static description = 'proxy hexo commands'

  static examples = [
    '$ gitpost hexo server'
  ]

  static flags = {
  }

  async run() {
    hexoCli(path.resolve(process.cwd(), '.hexo'), minimist(process.argv.slice(3)))
  }
}
