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

function getArgument(promptText: string): boolean {
    while (true) {
        const input = prompt(promptText + " (y/n):")
        
        if (!input) continue

        if (input.toLowerCase() === "y") {
            return true
        } else if (input.toLowerCase() === "n") {
            return false
        } else {
            console.log("Invalid input. Try again.")
            continue
        }
    }
}

function editScript(info: {
    latestRM: string,
    useUnitySetup: boolean,
    mapName: string
}): (content: string) => string {
    return (contents: string) => {
        const lines = contents.split('\n')

        function deleteMacro(definition: string, linesToRemove = 1) {
            const index = lines.findIndex(x => x.includes(definition))
            lines.splice(index, linesToRemove)
        }
        function replaceMacro(definition: string, replacement: string) {
            const index = lines.findIndex(x => x.includes(definition))
            lines[index] = lines[index].replace(definition, replacement)
        }

        replaceMacro('@VERSION', `"https://deno.land/x/remapper@${info.latestRM}/src/mod.ts"`)
        replaceMacro('@MAPNAME', info.mapName)

        if (info.useUnitySetup) {
            replaceMacro('@BUNDLEIMPORT', `import * as bundleInfo from './bundleinfo.json' with { type: 'json' }`)
            replaceMacro('@PIPELINE', `const pipeline = await rm.createPipeline({ bundleInfo })`)
            replaceMacro('@BUNDLEDEFINES', [
                `const bundle = rm.loadBundle(bundleInfo)`,
                `const materials = bundle.materials`,
                `const prefabs = bundle.prefabs`
            ].join('\n'))
        } else {
            deleteMacro('@BUNDLEIMPORT')
            replaceMacro('@PIPELINE', `const pipeline = await rm.createPipeline()`)
            deleteMacro('@BUNDLEDEFINES', 2)
        }
        
        return lines.join('\n')
    }
}

async function setupGit() {
    await new Deno.Command("git", {
        args: ['init'],
        stdout: "inherit",
        stderr: "inherit",
    }).spawn().status
    await new Deno.Command("git", {
        args: ["add", "."],
        stdout: "inherit",
        stderr: "inherit",
    }).spawn().status
}

async function program() {
    const multipleDifficulties = getArgument("Would you like to setup the project for multiple difficulties?")
    const useUnitySetup = getArgument("Would you like to setup the project for Unity/Vivify?")
    const useGitSetup = getArgument("Would you like to setup Git?")
    const destination = Deno.cwd()
    const version = await getLatestReMapperSetupReleaseTag()
    const cacheBaseDirectory = getCacheBaseDirectory()
    const latestRM = await getLatestReMapperReleaseTag()
    const mapName = await path.basename(destination)

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
            if (changeContents) fileContents = changeContents(fileContents)
            if (await fs.exists(dest)) {
                console.log('\x1b[31m%s\x1b[0m', `The file '${dest}' already exists.`)
            }
            else {
                await Deno.writeTextFile(dest, fileContents)
            }
        }
        tasks.push(doProcess())
    }

    if (useGitSetup) {
        addTextFile('rootignore.txt', '.gitignore', 
            content => content.replace('@QUESTIGNORE', `/${mapName}_unity_2021`)
        )
    }

    const unityProjectName = `${mapName}_unity_2019`
    if (useUnitySetup) {
        const srcUnity = path.join(cacheVersionPath, '/unity_2019')
        const dstUnity = path.join(destination, '/' + unityProjectName)
        tasks.push(fs.copy(srcUnity, dstUnity))
        addTextFile('bundleinfo.json')
    }

    const scriptFn = editScript({
        latestRM, 
        useUnitySetup,
        mapName
    })
    if (multipleDifficulties) {
        addTextFile('script_multiple.ts', 'script.ts', scriptFn)
    } else {
        addTextFile('script_single.ts', 'script.ts', scriptFn)
    }

    addTextFile('scripts.json')

    // finish
    await Promise.all(tasks)

    if (useGitSetup) {
        await setupGit()
    }

    console.log('%c' + `Successfully setup new map at ${destination}`, 'color: Green')

    if (useUnitySetup) {
        console.log('%c' + `Add the '${unityProjectName}' folder to your Unity Hub to enter the project. (Add > Add project from disk)`, "color: Yellow")
        console.log('%c' + "Download VivifyTemplate to get started with Vivify: https://github.com/Swifter1243/VivifyTemplate?tab=readme-ov-file#setup", "color: Yellow")
    }
}

await program()