import * as path from 'path'
import * as Generator from 'yeoman-generator'

import Hexo from '../core/hexo'

const sortPjson = require('sort-pjson')

export default class App extends Generator {
  pjson: any
  distPath: string
  constructor(args: any, opts: any) {
    super(args, opts)
    this.distPath = opts.distPath
    this.pjson = {
      name: 'gitpost-awesome',
      version: '0.0.0',
      description: 'gitpost awesome project',
      main: 'scripts/index.js',
      scripts: {
        test: 'echo "Error2: no test specified" && exit 1'
      },
      author: '',
      license: 'ISC',
      engines: {},
      devDependencies: {},
      dependencies: {},
      ...this.fs.readJSON('package.json', {}),
    }
  }
  writing() {
    this.sourceRoot(path.join(__dirname, '../../templates'))
    this.destinationRoot(path.resolve(this.distPath))
    this.fs.copyTpl(this.templatePath('./'), this.destinationPath('./'), this)
    this.fs.writeJSON(this.destinationPath('./package.json'), sortPjson(this.pjson))

  }
  install() {
    // install npm dependences
    const dependencies: string[] = []
    dependencies.push('gitpost@^0')
    this.npmInstall(dependencies)
  }

  initHexo() {
    // init hexo
    const hexo = new Hexo({
      cwd: this.distPath
    })
    return hexo.init()
  }
  changeHexoConfig() {
    // tslint:disable-next-line
  }
  end() {
      // tslint:disable-next-line
    console.log('enjoy with gitpost!')
  }
}
