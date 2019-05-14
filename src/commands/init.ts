import {flags} from '@oclif/command'

import Base from '../command-base'
const chalk = require('chalk')

export default class Init extends Base {
  static description = 'Init a gitpost project'

  static examples = [
    '$ gitpost init blog'
  ]

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'folder', required: true}]

  async run() {
    const {args} = this.parse(Init)
    try {
      await super.generate('app', {
        name: args.folder,
        distPath: `${process.cwd()}/${args.folder}`,
      })
    } catch (error) {
      this.error(error)
    }
    this.log(chalk.green('gitpost init success!'))
    this.log(`Now, you can run
${chalk.green('cd ' + args.folder + ' && gitpost server')}
to preview your blog!`)
    this.log('Enjoy with gitpost!')

  }
}
