import fs from 'fs-extra'
import os from 'os'
import path from 'path'

const xdgConfigPath = (file: string) => {
    const xdgConfigHome = process.env.XDG_CONFIG_HOME
    if (xdgConfigHome) {
        const rcDir = path.join(xdgConfigHome, 'gitpost')
        if (!fs.existsSync(rcDir)) {
            fs.ensureDirSync(rcDir)
        }
        return path.join(rcDir, file)
    }
}

export const getRcPath = (file: string) => {
    return process.env.GITPOST_CONFIG_PATH || xdgConfigPath(file) || path.join(os.homedir(), file)
}
