import {Command, flags} from '@oclif/command'

export default class Init extends Command {
  static description = 'describe the command here'

  static examples = [
    '$ gitpost server'
  ]

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    // init hexo
    // if hexo

  }
}
