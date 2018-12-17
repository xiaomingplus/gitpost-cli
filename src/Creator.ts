import path from 'path'
import chalk from 'chalk'
import debug from 'debug'
import execa from 'execa'
import inquirer from 'inquirer'
import semver from 'semver'
import EventEmitter from 'events'
import Generator from './Generator'
import cloneDeep from 'lodash.clonedeep'
import sortObject from './util/sortObject'
import getVersions from './util/getVersions'
import { installDeps } from './util/installDeps'
import { clearConsole } from './util/clearConsole'
import PromptModuleAPI from './PromptModuleAPI'
import writeFileTree from './util/writeFileTree'
import { formatFeatures } from './util/features'
import loadLocalPreset from './util/loadLocalPreset'
import loadRemotePreset from './util/loadRemotePreset'
import generateReadme from './util/generateReadme'
import { ICliOptions } from './common-types'
import { defaults, saveOptions, loadOptions, savePreset, validatePreset } from './options'

import {
    log,
    warn,
    error,
    hasGit,
    hasProjectGit,
    hasYarn,
    logWithSpinner,
    stopSpinner,
    exit,
    loadModule,
} from '@vue/cli-shared-utils'

const isManualMode = answers => answers.preset === '__manual__'
export default class Creator extends EventEmitter {
    name: string
    context: string
    createCompleteCbs: any[]
    constructor(name: string, context: string) {
        super()

        this.name = name
        this.context = process.env.VUE_CLI_CONTEXT = context

        this.run = this.run.bind(this)
        this.createCompleteCbs = []
    }

    async create(cliOptions: ICliOptions = {}, preset = null) {
        const isTestOrDebug = process.env.VUE_CLI_TEST || process.env.VUE_CLI_DEBUG
        const { run, name, context, createCompleteCbs } = this

        const packageManager = cliOptions.packageManager || loadOptions().packageManager || (hasYarn() ? 'yarn' : 'npm')

        await clearConsole()
        logWithSpinner(`✨`, `Creating post folder in ${chalk.yellow(context)}.`)
        this.emit('creation', { event: 'creating' })

        // get latest CLI version
        const { latest } = await getVersions()
        const latestMinor = `${semver.major(latest)}.${semver.minor(latest)}.0`
        // generate package.json with plugin dependencies
        const pkg = {
            name,
            version: '0.1.0',
            private: true,
            devDependencies: {},
        }

        // write package.json
        await writeFileTree(context, {
            'package.json': JSON.stringify(pkg, null, 2),
        })

        // intilaize git repository before installing deps
        // so that vue-cli-service can setup git hooks.
        const shouldInitGit = this.shouldInitGit(cliOptions)
        if (shouldInitGit) {
            logWithSpinner(`🗃`, `Initializing git repository...`)
            this.emit('creation', { event: 'git-init' })
            await run('git init')
        }

        // install plugins
        stopSpinner()
        log(`⚙  Installing CLI plugins. This might take a while...`)
        log()
        this.emit('creation', { event: 'plugins-install' })

        await installDeps(context, packageManager, cliOptions.registry)

        // run generator
        log(`🚀  Invoking generators...`)
        this.emit('creation', { event: 'invoking-generators' })
        const generator = new Generator(context, {
            pkg,
            completeCbs: createCompleteCbs,
        })
        await generator.generate({
            extractConfigFiles: preset.useConfigFiles,
        })

        // install additional deps (injected by generators)
        log(`📦  Installing additional dependencies...`)
        this.emit('creation', { event: 'deps-install' })
        log()
        if (!isTestOrDebug) {
            await installDeps(context, packageManager, cliOptions.registry)
        }

        // run complete cbs if any (injected by generators)
        logWithSpinner('⚓', `Running completion hooks...`)
        this.emit('creation', { event: 'completion-hooks' })
        for (const cb of createCompleteCbs) {
            await cb()
        }

        // generate README.md
        stopSpinner()
        log()
        logWithSpinner('📄', 'Generating README.md...')
        await writeFileTree(context, {
            'README.md': generateReadme(generator.pkg, packageManager),
        })

        // commit initial state
        let gitCommitFailed = false
        if (shouldInitGit) {
            await run('git add -A')
            if (isTestOrDebug) {
                await run('git', ['config', 'user.name', 'test'])
                await run('git', ['config', 'user.email', 'test@test.com'])
            }
            const msg = typeof cliOptions.git === 'string' ? cliOptions.git : 'init'
            try {
                await run('git', ['commit', '-m', msg])
            } catch (e) {
                gitCommitFailed = true
            }
        }

        // log instructions
        stopSpinner()
        log()
        log(`🎉  Successfully created project ${chalk.yellow(name)}.`)
        log(
            `👉  Get started with the following commands:\n\n` +
                (this.context === process.cwd() ? `` : chalk.cyan(` ${chalk.gray('$')} cd ${name}\n`)) +
                chalk.cyan(` ${chalk.gray('$')} ${packageManager === 'yarn' ? 'yarn serve' : 'npm run serve'}`),
        )
        log()
        this.emit('creation', { event: 'done' })

        if (gitCommitFailed) {
            warn(
                `Skipped git commit due to missing username and email in git config.\n` +
                    `You will need to perform the initial commit yourself.\n`,
            )
        }

        generator.printExitLogs()
    }

    run(command: string, args?: string[]) {
        if (!args) {
            ;[command, ...args] = command.split(/\s+/)
        }
        return execa(command, args, { cwd: this.context })
    }

    async promptAndResolvePreset(answers = null) {
        // prompt
        if (!answers) {
            await clearConsole(true)
            answers = await inquirer.prompt(this.resolveFinalPrompts())
        }
        debug('vue-cli:answers')(answers)

        if (answers.packageManager) {
            saveOptions({
                packageManager: answers.packageManager,
            })
        }

        let preset
        if (answers.preset && answers.preset !== '__manual__') {
            preset = await this.resolvePreset(answers.preset)
        } else {
            // manual
            preset = {
                useConfigFiles: answers.useConfigFiles === 'files',
                plugins: {},
            }
            answers.features = answers.features || []
            // run cb registered by prompt modules to finalize the preset
            this.promptCompleteCbs.forEach(cb => cb(answers, preset))
        }

        // validate
        validatePreset(preset)

        // save preset
        if (answers.save && answers.saveName) {
            savePreset(answers.saveName, preset)
        }

        debug('vue-cli:preset')(preset)
        return preset
    }

    async resolvePreset(name, clone) {
        let preset
        const savedPresets = loadOptions().presets || {}

        if (name in savedPresets) {
            preset = savedPresets[name]
        } else if (name.endsWith('.json') || /^\./.test(name) || path.isAbsolute(name)) {
            preset = await loadLocalPreset(path.resolve(name))
        } else if (name.includes('/')) {
            logWithSpinner(`Fetching remote preset ${chalk.cyan(name)}...`)
            this.emit('creation', { event: 'fetch-remote-preset' })
            try {
                preset = await loadRemotePreset(name, clone)
                stopSpinner()
            } catch (e) {
                stopSpinner()
                error(`Failed fetching remote preset ${chalk.cyan(name)}:`)
                throw e
            }
        }

        // use default preset if user has not overwritten it
        if (name === 'default' && !preset) {
            preset = defaults.presets.default
        }
        if (!preset) {
            error(`preset "${name}" not found.`)
            const presets = Object.keys(savedPresets)
            if (presets.length) {
                log()
                log(`available presets:\n${presets.join(`\n`)}`)
            } else {
                log(`you don't seem to have any saved preset.`)
                log(`run vue-cli in manual mode to create a preset.`)
            }
            exit(1)
        }
        return preset
    }

    // { id: options } => [{ id, apply, options }]
    async resolvePlugins(rawPlugins) {
        // ensure cli-service is invoked first
        rawPlugins = sortObject(rawPlugins, ['@vue/cli-service'], true)
        const plugins = []
        for (const id of Object.keys(rawPlugins)) {
            const apply = loadModule(`${id}/generator`, this.context) || (() => {})
            let options = rawPlugins[id] || {}
            if (options.prompts) {
                const prompts = loadModule(`${id}/prompts`, this.context)
                if (prompts) {
                    log()
                    log(`${chalk.cyan(options._isPreset ? `Preset options:` : id)}`)
                    options = await inquirer.prompt(prompts)
                }
            }
            plugins.push({ id, apply, options })
        }
        return plugins
    }

    getPresets() {
        const savedOptions = loadOptions()
        return Object.assign({}, savedOptions.presets, defaults.presets)
    }

    resolveIntroPrompts() {
        const presets = this.getPresets()
        const presetChoices = Object.keys(presets).map(name => {
            return {
                name: `${name} (${formatFeatures(presets[name])})`,
                value: name,
            }
        })
        const presetPrompt = {
            name: 'preset',
            type: 'list',
            message: `Please pick a preset:`,
            choices: [
                ...presetChoices,
                {
                    name: 'Manually select features',
                    value: '__manual__',
                },
            ],
        }
        const featurePrompt = {
            name: 'features',
            when: isManualMode,
            type: 'checkbox',
            message: 'Check the features needed for your project:',
            choices: [],
            pageSize: 10,
        }
        return {
            presetPrompt,
            featurePrompt,
        }
    }

    resolveOutroPrompts() {
        const outroPrompts = [
            {
                name: 'useConfigFiles',
                when: isManualMode,
                type: 'list',
                message: 'Where do you prefer placing config for Babel, PostCSS, ESLint, etc.?',
                choices: [
                    {
                        name: 'In dedicated config files',
                        value: 'files',
                    },
                    {
                        name: 'In package.json',
                        value: 'pkg',
                    },
                ],
            },
            {
                name: 'save',
                when: isManualMode,
                type: 'confirm',
                message: 'Save this as a preset for future projects?',
                default: false,
            },
            {
                name: 'saveName',
                when: answers => answers.save,
                type: 'input',
                message: 'Save preset as:',
            },
        ]

        // ask for packageManager once
        const savedOptions = loadOptions()
        if (!savedOptions.packageManager && hasYarn()) {
            outroPrompts.push({
                name: 'packageManager',
                type: 'list',
                message: 'Pick the package manager to use when installing dependencies:',
                choices: [
                    {
                        name: 'Use Yarn',
                        value: 'yarn',
                        short: 'Yarn',
                    },
                    {
                        name: 'Use NPM',
                        value: 'npm',
                        short: 'NPM',
                    },
                ],
            })
        }

        return outroPrompts
    }

    resolveFinalPrompts() {
        // patch generator-injected prompts to only show in manual mode
        this.injectedPrompts.forEach(prompt => {
            const originalWhen = prompt.when || (() => true)
            prompt.when = answers => {
                return isManualMode(answers) && originalWhen(answers)
            }
        })
        const prompts = [this.presetPrompt, this.featurePrompt, ...this.injectedPrompts, ...this.outroPrompts]
        debug('vue-cli:prompts')(prompts)
        return prompts
    }

    shouldInitGit(cliOptions: ICliOptions) {
        if (!hasGit()) {
            return false
        }
        // --git
        if (cliOptions.forceGit) {
            return true
        }
        // --no-git
        if (cliOptions.git === false || cliOptions.git === 'false') {
            return false
        }
        // default: true unless already in a git repo
        return !hasProjectGit(this.context)
    }
}
