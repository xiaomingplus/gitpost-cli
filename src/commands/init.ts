import {flags} from '@oclif/command'

import Base from '../command-base'

export default class Init extends Base {
  static description = 'describe the command here'

  static examples = [
    '$ gitpost init blog'
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    test: flags.boolean({char: 't'}),
  }

  static args = [{name: 'folder', required: true}]

  async run() {
    const {args} = this.parse(Init)
    try {
      await super.generate('app', {
        distPath: `${process.cwd()}/${args.folder}`,
      })
    } catch (error) {
      this.error(error)
    }
  }
}
