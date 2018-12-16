import program from 'commander'
import chalk from 'chalk'

export default function(methodName: string, log: (...args: any[]) => string) {
    program.Command.prototype[methodName] = function(...args: any[]) {
        if (methodName === 'unknownOption' && this._allowUnknownOption) {
            return
        }
        this.outputHelp()
        console.log(`  ` + chalk.red(log(...args)))
        console.log()
        process.exit(1)
    }
}
