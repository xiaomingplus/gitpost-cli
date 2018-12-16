let sessionCached: any

export default async function getVersions() {
    if (sessionCached) {
        return sessionCached
    }

    const local = require(`../../package.json`).version

    return (sessionCached = {
        current: local,
    })
}
