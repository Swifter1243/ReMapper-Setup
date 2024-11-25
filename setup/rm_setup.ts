// imports from v0.149.0 of std, never changes

import cloneTemplateToCache from "./clone.ts";
import { configDir, path, fs } from "./deps.ts";

function getCacheBaseDirectory() {
    const userDir = configDir();

    if (!userDir) {
        console.error("Unable to find user config directory!");
        Deno.exit(1);
    }

    return path.join(userDir, "remapper_setup")
}

async function getLatestReleaseTag(uri: string) {
    const latestRelease = await fetch(uri, {
        headers: {
            "Accept": "application/vnd.github+json"
        }
    })
    if (latestRelease.status != 200) {
        console.error(`Received error ${latestRelease.status} while fetching latest release name`)
        Deno.exit(2)
    }
    const json = await latestRelease.json()
    return json["tag_name"] as string
}

function getLatestReMapperSetupReleaseTag() {
    return getLatestReleaseTag("https://api.github.com/repos/Swifter1243/ReMapper-Setup/releases/latest")
}

function getLatestReMapperReleaseTag() {
    return getLatestReleaseTag("https://api.github.com/repos/Swifter1243/ReMapper/releases/latest")
}

async function getCacheVersionPath(cacheBaseDirectory: string, version: string) {
    const cacheVersionPath = path.join(cacheBaseDirectory, version)

    if (!fs.existsSync(cacheVersionPath)) {
        await cloneTemplateToCache(cacheVersionPath, version);
    }

    return cacheVersionPath
}

function getNamedDenoArgument(name: string, letter: string) {
    return Deno.args.find(a => a === `--${name}` || a === `-${letter}`)
}

function editScript(latestRM: string) {
    return (contents: string) => {
        return contents.replace("@VERSION", `"https://deno.land/x/remapper@${latestRM}/src/mod.ts"`)
    }
}

async function program() {
    const destination = Deno.cwd()
    const version = await getLatestReMapperSetupReleaseTag()
    const multipleDifficulties = getNamedDenoArgument('multi-diff', 'm') !== undefined
    const cacheBaseDirectory = getCacheBaseDirectory()
    const latestRM = await getLatestReMapperReleaseTag()

    if (multipleDifficulties) {
        throw new Error('Currently there\'s no examples for multi-diff scripts. That only exists in ReMapper 4.0.0, which isn\'t out yet.')
    }

    // setup directories
    await Promise.all([
        fs.ensureDir(destination),
        fs.ensureDir(cacheBaseDirectory)
    ])
    const cacheVersionPath = await getCacheVersionPath(cacheBaseDirectory, version)

    // copy files
    const tasks: Promise<void>[] = []
    function addTextFile(srcFile: string, dstFile = srcFile, changeContents?: (fileContents: string) => string) {
        const src = path.join(cacheVersionPath, srcFile)
        const dest = path.join(destination, dstFile)
        async function doProcess() {
            let fileContents = await Deno.readTextFile(src)

            if (changeContents) {
                fileContents = changeContents(fileContents)
            }
    
            await Deno.writeTextFile(dest, fileContents)
        }
        tasks.push(doProcess())
    }
    addTextFile('script_single.ts', 'script.ts', editScript(latestRM))
    addTextFile('scripts.json')

    // finish
    await Promise.all(tasks)
    console.log(`Successfully setup new map at ${destination}`)
}

await program()