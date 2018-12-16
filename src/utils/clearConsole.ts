import chalk from 'chalk'
import getVersions from './getVersions'
import { clearConsole as clearConsoleUtil } from '@vue/cli-shared-utils'

export const generateTitle = async (): Promise<string> => {
    const { current } = await getVersions()
    const title = chalk.bold.blue(`Gitpost CLI v${current}`)

    return title
}

export const clearConsole = async function clearConsoleWithTitle() {
    const title = await generateTitle()
    clearConsoleUtil(title)
}
