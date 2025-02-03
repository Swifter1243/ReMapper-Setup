// imports from v0.149.0 of std, never changes

import cloneTemplateToCache from "./clone.ts";
import { configDir, path, fs } from "./deps.ts";

function getCacheBaseDirectory() {
    const userDir = configDir();

    if (!userDir) {
        throw new Error("Unable to find user config directory!")
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
        throw new Error(`Received error ${latestRelease.status} while fetching latest release name`)
    }
    const json = await latestRelease.json()
    if (!json["tag_name"]) {
        throw new Error(`Invalid response JSON.`)
    }
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

function editScript(latestRM: string, useUnitySetup: boolean): (content: string) => string {
    return (contents: string) => {
        const lines = contents.split('\n')

        function deleteMacro(definition: string, linesToRemove = 1) {
            const index = lines.findIndex(x => x.includes(definition))
            console.log(lines)
            lines.splice(index, linesToRemove)
        }
        function replaceMacro(definition: string, replacement: string) {
            const index = lines.findIndex(x => x.includes(definition))
            lines[index] = lines[index].replace(definition, replacement)
        }

        replaceMacro('@VERSION', `"https://deno.land/x/remapper@${latestRM}/src/mod.ts"`)

        if (useUnitySetup) {
            replaceMacro('@BUNDLEIMPORT', `import * as bundleInfo from './bundleinfo.json' with { type: 'json' }`)
            replaceMacro('@PIPELINE', `const pipeline = rm.createPipeline({ bundleInfo })`)
            replaceMacro('@BUNDLEDEFINES', [
                `const bundle = rm.loadBundle(bundleInfo)`,
                `const materials = bundle.materials`,
                `const prefabs = bundle.prefabs`
            ].join('\n'))
        } else {
            deleteMacro('@BUNDLEIMPORT')
            replaceMacro('@PIPELINE', `const pipeline = rm.createPipeline()`)
            deleteMacro('@BUNDLEDEFINES', 2)
        }
        
        return lines.join('\n')
    }
}

async function program() {
    const destination = Deno.cwd()
    const version = await getLatestReMapperSetupReleaseTag()
    const multipleDifficulties = getNamedDenoArgument('multi-diff', 'm') !== undefined
    const useUnitySetup = getNamedDenoArgument('unity-setup', 'u') !== undefined
    const cacheBaseDirectory = getCacheBaseDirectory()
    const latestRM = await getLatestReMapperReleaseTag()
    const mapName = await path.basename(destination)

    // setup directories
    await Promise.all([
        fs.ensureDir(destination),
        fs.ensureDir(cacheBaseDirectory)
    ])
    // const cacheVersionPath = await getCacheVersionPath(cacheBaseDirectory, version)
    const cacheVersionPath = 'E:/Users/Programs/ReMapper-Setup'

    // copy files
    const tasks: Promise<void>[] = []
    function addTextFile(srcFile: string, dstFile = srcFile, changeContents?: (fileContents: string) => string) {
        const src = path.join(cacheVersionPath, srcFile)
        const dest = path.join(destination, dstFile)
        async function doProcess() {
            let fileContents = await Deno.readTextFile(src)
            if (changeContents) fileContents = changeContents(fileContents)
            await Deno.writeTextFile(dest, fileContents)
        }
        tasks.push(doProcess())
    }

    if (useUnitySetup) {
        const srcUnity = path.join(cacheVersionPath, '/unity_2019')
        const dstUnity = path.join(destination, `/${mapName}_unity_2019`)
        tasks.push(fs.copy(srcUnity, dstUnity))
        addTextFile('rootignore.txt', '.gitignore', 
            content => content.replace('@QUESTIGNORE', `/${mapName}_unity_2021`)
        )
    }

    const scriptFn = editScript(latestRM, useUnitySetup)
    if (multipleDifficulties) {
        addTextFile('script_multiple.ts', 'script.ts', scriptFn)
    } else {
        addTextFile('script_single.ts', 'script.ts', scriptFn)
    }

    addTextFile('scripts.json')

    // finish
    await Promise.all(tasks)
    console.log(`Successfully setup new map at ${destination}`)
}

await program()