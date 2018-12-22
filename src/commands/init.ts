import {Command, flags} from '@oclif/command'

export default class Init extends Command {
  static description = 'describe the command here'

  static examples = [
    '$ gitpost init blog'
  ]

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'folder'}]

  async run() {
    const {args} = this.parse(Init)
    this.log(`test: ${args.folder}`)

  }
}
