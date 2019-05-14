import * as Generator from 'yeoman-generator'

import Hexo from '../core/hexo'
const rimraf = require('rimraf')
const yaml = require('js-yaml')
const fs = require('fs')
const hexoFs = require('hexo-fs')
const pathFn = require('path')
const sortPjson = require('sort-pjson')
const clone = require('git-clone')

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
      dependencies: {}
    }
  }
  writing() {
    this.sourceRoot(pathFn.join(__dirname, '../../templates'))
    this.destinationRoot(pathFn.resolve(this.distPath))
    this.fs.copyTpl(this.templatePath('./'), this.destinationPath('./'), this)
    this.fs.writeJSON(
      this.destinationPath('./package.json'),
      sortPjson(this.pjson)
    )
  }
  install() {
    // install npm dependences
    const dependencies: string[] = []
    const devDependencies: string[] = []
    dependencies.push('gitpost@^0.0.4')
    devDependencies.push('gitpost-cli@^0.0.3')
    return Promise.all([
      this.yarnInstall(devDependencies, {dev: true, ignoreScripts: true}),
      this.yarnInstall(dependencies)
    ])
  }

  init1() {
    // process by method name
    // init hexo
    const hexo = new Hexo({
      cwd: this.distPath
    })
    return hexo.init()
  }
  init2() {
    // when hexo installed
    // install next theme
    const done = (this as any).async()
    const target = pathFn.resolve(this.distPath, '.hexo/themes/next')
    clone(
      'https://github.com/theme-next/hexo-theme-next',
      target,
      {
        shallow: true
      },
      function () {
        return Promise.all([
          removeGitDir(target),
          removeGitModules(target)
        ]).then(() => {
          done()
        }).catch(e => {
          // tslint:disable-next-line:no-console
          console.error('remove git dir faied:', e)
          done()
        })
      }
    )
  }
  changeHexoConfig() {
    const configPath = pathFn.resolve(this.distPath, '.hexo/_config.yml')
    try {
      const doc = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'))
      doc.source_dir = '../source'
      doc.public_dir = '../public'
      doc.theme = 'next'
      const yamlConfig = yaml.safeDump(doc)
      // write
      fs.writeFileSync(configPath, yamlConfig)
      // remove source file
      rimraf(pathFn.resolve(this.distPath, '.hexo/source'), (err: any) => {
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

function removeGitDir(target: string) {
  let gitDir = pathFn.join(target, '.git')

  return hexoFs
    .stat(gitDir)
    .catch(function (err: any) {
      if (err.cause && err.cause.code === 'ENOENT') return
      throw err
    })
    .then(function (stats: any) {
      if (stats) {
        if (stats.isDirectory()) return hexoFs.rmdir(gitDir)
        return hexoFs.unlink(gitDir)
      }
    })
    .then(function () {
      return hexoFs.readdir(target)
    })
    .map(function (path: string) {
      return pathFn.join(target, path)
    })
    .filter(function (path: string) {
      return hexoFs.stat(path).then(function (stats: any) {
        return stats.isDirectory()
      })
    })
    .each(removeGitDir)
}

function removeGitModules(target: string) {
  return hexoFs.unlink(pathFn.join(target, '.gitmodules')).catch(function (err: any) {
    if (err.cause && err.cause.code === 'ENOENT') return
    throw err
  })
}
