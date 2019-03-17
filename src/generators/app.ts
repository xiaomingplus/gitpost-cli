import * as Generator from 'yeoman-generator'

import Hexo from '../core/hexo'
const rimraf = require('rimraf')
const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
const sortPjson = require('sort-pjson')
export default class App extends Generator {
  pjson: any
  distPath: string
  constructor(args: any, opts: any) {
    super(args, opts)
    this.distPath = opts.distPath
    this.pjson = {
      name: opts.name,
      version: '0.0.1',
      description: 'gitpost awesome project',
      main: 'scripts/index.js',
      scripts: {
        start: 'gitpost hexo server',
        deploy: 'gitpost hexo deploy'
      },
      private: true,
      author: '',
      license: 'ISC',
      engines: {
        node: '>=8.9'
      },
      devDependencies: {},
      dependencies: {},
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
    const devDependencies: string[] = []
    dependencies.push('gitpost@^0.0.4')
    devDependencies.push('gitpost-cli@^0.0.3')
    return Promise.all([
      this.yarnInstall(devDependencies, {dev: true, ignoreScripts: true}),
      this.yarnInstall(dependencies),
    ])
  }

  initHexo() {
    // init hexo
    const hexo = new Hexo({
      cwd: this.distPath
    })
    return hexo.init()
  }
  changeHexoConfig() {
    const configPath = path.resolve(this.distPath, '.hexo/_config.yml')
    try {
      const doc = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'))
      doc.source_dir = '../source'
      doc.public_dir = '../public'
      const yamlConfig = yaml.safeDump(doc)
      // write
      fs.writeFileSync(configPath, yamlConfig)
      // remove source file
      rimraf(path.resolve(this.distPath, '.hexo/source'), (err: any) => {
        if (err) {
          throw err
        }
        (this as any).async()
      })
    } catch (e) {
      throw e
    }
  }

}
