const hexoCli = require('hexo-cli')
let minimist = require('minimist')

export default class Hexo {
  cwd: string
  constructor(params: {
    cwd: string
  }) {
    this.cwd = params.cwd
  }
  init() {
    return hexoCli(this.cwd, minimist(['init', '.hexo']))
  }
}
