import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import inquirer from 'inquirer'
import Creator from './Creator'
import { clearConsole } from './utils/clearConsole'
import { error, stopSpinner, exit } from '@vue/cli-shared-utils'
import validateProjectName from 'validate-npm-package-name'
export default function(name: string, options: any) {
    return create(name, options).catch(err => {
        stopSpinner(false) // do not persist
        error(err)
        if (!process.env.VUE_CLI_TEST) {
            process.exit(1)
        }
    })
}
async function create(projectName: string, options: any) {
    if (options.proxy) {
        process.env.HTTP_PROXY = options.proxy
    }

    const cwd = options.cwd || process.cwd()
    const inCurrent = projectName === '.'
    const name = inCurrent ? path.relative('../', cwd) : projectName
    const targetDir = path.resolve(cwd, projectName || '.')

    const result = validateProjectName(name)
    if (!result.validForNewPackages) {
        console.error(chalk.red(`Invalid project name: "${name}"`))
        if (result.errors) {
            result.errors.forEach((err: any) => {
                console.error(chalk.red.dim('Error: ' + err))
            })
        }

        if (result.warnings) {
            result.warnings.forEach(warn => {
                console.error(chalk.red.dim('Warning: ' + warn))
            })
        }
        exit(1)
    }

    if (fs.existsSync(targetDir)) {
        if (options.force) {
            await fs.remove(targetDir)
        } else {
            await clearConsole()
            if (inCurrent) {
                const { ok } = await inquirer.prompt([
                    {
                        name: 'ok',
                        type: 'confirm',
                        message: `Generate project in current directory?`,
                    },
                ])
                if (!ok) {
                    return
                }
            } else {
                const { action } = await inquirer.prompt([
                    {
                        name: 'action',
                        type: 'list',
                        message: `Target directory ${chalk.cyan(targetDir)} already exists. Pick an action:`,
                        choices: [
                            { name: 'Overwrite', value: 'overwrite' },
                            { name: 'Merge', value: 'merge' },
                            { name: 'Cancel', value: false },
                        ],
                    },
                ])
                if (!action) {
                    return
                } else if (action === 'overwrite') {
                    console.log(`\nRemoving ${chalk.cyan(targetDir)}...`)
                    await fs.remove(targetDir)
                }
            }
        }
    }

    const creator = new Creator(name, targetDir, getPromptModules())
    await creator.create(options)
}
