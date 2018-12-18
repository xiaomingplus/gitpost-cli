const ejs = require('ejs')
const debug = require('debug')
const GeneratorAPI = require('./GeneratorAPI')
const sortObject = require('./util/sortObject')
const writeFileTree = require('./util/writeFileTree')
const inferRootOptions = require('./util/inferRootOptions')
const normalizeFilePaths = require('./util/normalizeFilePaths')
const injectImportsAndOptions = require('./util/injectImportsAndOptions')
const { toShortPluginId, matchesPluginId } = require('@vue/cli-shared-utils')
const ConfigTransform = require('./ConfigTransform')

const logger = require('@vue/cli-shared-utils/lib/logger')
const logTypes = {
    log: logger.log,
    info: logger.info,
    done: logger.done,
    warn: logger.warn,
    error: logger.error,
}

const defaultConfigTransforms = {
    babel: new ConfigTransform({
        file: {
            js: ['babel.config.js'],
        },
    }),
    postcss: new ConfigTransform({
        file: {
            js: ['postcss.config.js'],
            json: ['.postcssrc.json', '.postcssrc'],
            yaml: ['.postcssrc.yaml', '.postcssrc.yml'],
        },
    }),
    eslintConfig: new ConfigTransform({
        file: {
            js: ['.eslintrc.js'],
            json: ['.eslintrc', '.eslintrc.json'],
            yaml: ['.eslintrc.yaml', '.eslintrc.yml'],
        },
    }),
    jest: new ConfigTransform({
        file: {
            js: ['jest.config.js'],
        },
    }),
    browserslist: new ConfigTransform({
        file: {
            lines: ['.browserslistrc'],
        },
    }),
}

const reservedConfigTransforms = {
    vue: new ConfigTransform({
        file: {
            js: ['vue.config.js'],
        },
    }),
}

const ensureEOL = (str:string) => {
    if (str.charAt(str.length - 1) !== '\n') {
        return str + '\n'
    }
    return str
}
export interface commonObj {
    [key:string]:any
}
export default class Generator {
    files:commonObj
    context:string
    originalPkg:commonObj
    pkg:commonObj
    imports:commonObj
    rootOptions:commonObj
    completeCbs:any[]
    configTransforms:commonObj
    constructor(context:string, { pkg = {}, completeCbs = [], files = {} } = {}) {
        this.context = context
        this.originalPkg = pkg
        this.pkg = Object.assign({}, pkg)
        this.imports = {}
        this.rootOptions = {}
        this.completeCbs = completeCbs
        this.configTransforms = {}
        this.defaultConfigTransforms = defaultConfigTransforms
        this.reservedConfigTransforms = reservedConfigTransforms
        // for conflict resolution
        this.depSources = {}
        // virtual file tree
        this.files = files
        this.fileMiddlewares = []
        this.postProcessFilesCbs = []
        // exit messages
        this.exitLogs = []

        const cliService = plugins.find(p => p.id === '@vue/cli-service')
        const rootOptions = cliService ? cliService.options : inferRootOptions(pkg)
 
    }

    async generate({ extractConfigFiles = false, checkExisting = false } = {}) {
        // save the file system before applying plugin for comparison
        const initialFiles = Object.assign({}, this.files)
        // extract configs from package.json into dedicated files.
        this.extractConfigFiles(extractConfigFiles, checkExisting)
        // wait for file resolve
        await this.resolveFiles()
        // set package.json
        this.sortPkg()
        this.files['package.json'] = JSON.stringify(this.pkg, null, 2) + '\n'
        // write/update file tree to disk
        await writeFileTree(this.context, this.files, initialFiles)
    }

    extractConfigFiles(extractAll:boolean, checkExisting:boolean) {
        const configTransforms = Object.assign(
            {},
            defaultConfigTransforms,
            this.configTransforms,
            reservedConfigTransforms,
        )
        const extract = (key:string) => {
            if (
                configTransforms[key] &&
                this.pkg[key] &&
                // do not extract if the field exists in original package.json
                !this.originalPkg[key]
            ) {
                const value = this.pkg[key]
                const configTransform = configTransforms[key]
                const res = configTransform.transform(value, checkExisting, this.files, this.context)
                const { content, filename } = res
                this.files[filename] = ensureEOL(content)
                delete this.pkg[key]
            }
        }
        if (extractAll) {
            for (const key in this.pkg) {
                extract(key)
            }
        }
    }

    sortPkg() {
        // ensure package.json keys has readable order
        this.pkg.dependencies = sortObject(this.pkg.dependencies)
        this.pkg.devDependencies = sortObject(this.pkg.devDependencies)
        this.pkg.scripts = sortObject(this.pkg.scripts, ['serve', 'build', 'test', 'e2e', 'lint', 'deploy'])
        this.pkg = sortObject(this.pkg, [
            'name',
            'version',
            'private',
            'description',
            'author',
            'scripts',
            'dependencies',
            'devDependencies',
            'vue',
            'babel',
            'eslintConfig',
            'prettier',
            'postcss',
            'browserslist',
            'jest',
        ])

        debug('vue:cli-pkg')(this.pkg)
    }

    async resolveFiles() {
        const files = this.files
        for (const middleware of this.fileMiddlewares) {
            await middleware(files, ejs.render)
        }

        // normalize file paths on windows
        // all paths are converted to use / instead of \
        normalizeFilePaths(files)

        // handle imports and root option injections
        Object.keys(files).forEach(file => {
            files[file] = injectImportsAndOptions(files[file], this.imports[file], this.rootOptions[file])
        })

        for (const postProcess of this.postProcessFilesCbs) {
            await postProcess(files)
        }
        debug('vue:cli-files')(this.files)
    }

    hasPlugin(_id) {
        if (_id === 'router') _id = 'vue-router'
        if (['vue-router', 'vuex'].includes(_id)) {
            const pkg = this.pkg
            return (pkg.dependencies && pkg.dependencies[_id]) || (pkg.devDependencies && pkg.devDependencies[_id])
        }
        return [
            ...this.plugins.map(p => p.id),
            ...Object.keys(this.pkg.devDependencies || {}),
            ...Object.keys(this.pkg.dependencies || {}),
        ].some(id => matchesPluginId(_id, id))
    }

    printExitLogs() {
        if (this.exitLogs.length) {
            this.exitLogs.forEach(({ id, msg, type }) => {
                const shortId = toShortPluginId(id)
                const logFn = logTypes[type]
                if (!logFn) {
                    logger.error(`Invalid api.exitLog type '${type}'.`, shortId)
                } else {
                    logFn(msg, msg && shortId)
                }
            })
            logger.log()
        }
    }
}
