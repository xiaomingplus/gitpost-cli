#!/usr/bin/env node

'use strict'

// Check node version before requiring/doing anything else
// The user may be on a very old node version

const chalk = require('chalk')
const semver = require('semver')
const requiredVersion = require('../package.json').engines.node

function checkNodeVersion(wanted, id) {
    if (!semver.satisfies(process.version, wanted)) {
        console.log(
            chalk.red(
                'You are using Node ' +
                    process.version +
                    ', but this version of ' +
                    id +
                    ' requires Node ' +
                    wanted +
                    '.\nPlease upgrade your Node version.',
            ),
        )
        process.exit(1)
    }
}

checkNodeVersion(requiredVersion, 'vue-cli')

const program = require('commander')

program.version(require('../package').version).usage('<command> [options]')

program
    .command('init <folder>')
    .description('init a new folder powered by gitpost')
    .option('-g, --git [message]', 'Force git initialization with initial commit message')
    .option('-n, --no-git', 'Skip git initialization')
    .option('-f, --force', 'Overwrite target directory if it exists')

    .action((name, cmd) => {
        const options = cleanArgs(cmd)
        // --git makes commander to default git to true
        if (process.argv.includes('-g') || process.argv.includes('--git')) {
            options.forceGit = true
        }
        require('../lib/create').default(name, options)
    })

// output help information on unknown commands
program.arguments('<command>').action(cmd => {
    program.outputHelp()
    console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
    console.log()
})

// add some useful info on help
program.on('--help', () => {
    console.log()
    console.log(`  Run ${chalk.cyan(`gitpost <command> --help`)} for detailed usage of given command.`)
    console.log()
})

program.commands.forEach(c => c.on('--help', () => console.log()))

// enhance common error messages
const enhanceErrorMessagesModule = require('../lib/utils/enhanceErrorMessages')
const enhanceErrorMessages = enhanceErrorMessagesModule.default
enhanceErrorMessages('missingArgument', argName => {
    return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`
})

enhanceErrorMessages('unknownOption', optionName => {
    return `Unknown option ${chalk.yellow(optionName)}.`
})

enhanceErrorMessages('optionMissingArgument', (option, flag) => {
    return (
        `Missing required argument for option ${chalk.yellow(option.flags)}` +
        (flag ? `, got ${chalk.yellow(flag)}` : ``)
    )
})

program.parse(process.argv)

if (!process.argv.slice(2).length) {
    program.outputHelp()
}

function camelize(str) {
    return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function cleanArgs(cmd) {
    const args = {}
    cmd.options.forEach(o => {
        const key = camelize(o.long.replace(/^--/, ''))
        // if an option is not present and Command has a method with the same name
        // it should not be copied
        if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
            args[key] = cmd[key]
        }
    })
    return args
}
