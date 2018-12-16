import fs from 'fs'
import cloneDeep from 'lodash.clonedeep'
import { getRcPath } from './utils/rcPath'
import { exit } from '@vue/cli-shared-utils/lib/exit'
import { error } from '@vue/cli-shared-utils/lib/logger'
import { createSchema, validate } from '@vue/cli-shared-utils/lib/validate'

const rcPath = (exports.rcPath = getRcPath('.vuerc'))

const presetSchema = createSchema((joi: any) =>
    joi.object().keys({
        bare: joi.boolean(),
        useConfigFiles: joi.boolean(),
        router: joi.boolean(),
        routerHistoryMode: joi.boolean(),
        vuex: joi.boolean(),
        cssPreprocessor: joi.string().only(['sass', 'less', 'stylus']),
        plugins: joi.object().required(),
        configs: joi.object(),
    }),
)

const schema = createSchema((joi: any) =>
    joi.object().keys({
        latestVersion: joi.string().regex(/^\d+\.\d+\.\d+$/),
        lastChecked: joi.date().timestamp(),
        packageManager: joi.string().only(['yarn', 'npm']),
        useTaobaoRegistry: joi.boolean(),
        presets: joi.object().pattern(/^/, presetSchema),
    }),
)

exports.defaults = {
    lastChecked: undefined,
    latestVersion: undefined,

    packageManager: undefined,
    useTaobaoRegistry: undefined,
}

let cachedOptions: any

export const loadOptions = () => {
    if (cachedOptions) {
        return cachedOptions
    }
    if (fs.existsSync(rcPath)) {
        try {
            cachedOptions = JSON.parse(fs.readFileSync(rcPath, 'utf-8'))
        } catch (e) {
            error(
                `Error loading saved preferences: ` +
                    `~/.gitpostrc may be corrupted or have syntax errors. ` +
                    `Please fix/delete it and re-run vue-cli in manual mode.\n` +
                    `(${e.message})`,
            )
            exit(1)
        }
        validate(cachedOptions, schema, () => {
            error(`~/.gitpostrc may be outdated. ` + `Please delete it and re-run vue-cli in manual mode.`)
        })
        return cachedOptions
    } else {
        return {}
    }
}

export const saveOptions = (toSave: any) => {
    const options = Object.assign(cloneDeep(exports.loadOptions()), toSave)
    for (const key in options) {
        if (!(key in exports.defaults)) {
            delete options[key]
        }
    }
    cachedOptions = options
    try {
        fs.writeFileSync(rcPath, JSON.stringify(options, null, 2))
    } catch (e) {
        error(`Error saving preferences: ` + `make sure you have write access to ${rcPath}.\n` + `(${e.message})`)
    }
}

export const savePreset = (name: string, preset: any) => {
    const presets = cloneDeep(exports.loadOptions().presets || {})
    presets[name] = preset
    exports.saveOptions({ presets })
}
