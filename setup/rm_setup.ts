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
    return json["tag_name"]!
}

async function getCacheVersionPath(cacheBaseDirectory: string, version: string) {
    const templatePath = path.join(cacheBaseDirectory, version)

    try {
        await Deno.stat(templatePath)
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
            await cloneTemplateToCache(templatePath, version);
        } else {
            throw e;
        }
    }

    // Validate the path exists
    await Deno.stat(templatePath)

    return templatePath
}

const name = Deno.args[0] ?? "."
const includeMapFiles = Deno.args.some(e => e === "--map" || e === "-m") || Deno.args[0]

const versionIndex = Deno.args.findIndex(e => e === "--version" || e === "-v")
let version = versionIndex !== -1 ? Deno.args[versionIndex + 1] : undefined

const currentFolder = Deno.cwd();

const destFolder = path.join(currentFolder, name)

if (name !== ".") await Deno.mkdir(destFolder)

const cacheBaseDirectory = getCacheBaseDirectory()

// make sure that cache base directory exists
try {
    await Deno.mkdir(cacheBaseDirectory, {
        recursive: true
    })
} catch (e) {
    if (e! instanceof Deno.errors.AlreadyExists) throw e;
}

if (!version) {
    version = await getLatestReleaseTag("https://api.github.com/repos/Swifter1243/ReMapper-Setup/releases/latest")
}

if (!version) {
    console.error(`No ref specified`)
    Deno.exit(2)
}

const cacheVersionPath = await getCacheVersionPath(cacheBaseDirectory, version)

// now copy to path
const ignoredFiles = ["setup", ".git"]

const tasks: Promise<void>[] = []

console.log("Copying from template path", cacheVersionPath)
for await (const file of Deno.readDir(cacheVersionPath)) {
    if (ignoredFiles.includes(file.name)) continue

    // Ignore .dat files if need be
    if (!includeMapFiles && path.extname(file.name) == ".dat") continue;

    const src = path.join(cacheVersionPath, file.name)
    const dest = path.join(destFolder, file.name)

    tasks.push(fs.copy(src, dest))
}

await Promise.all(tasks)

// Automatically update version
const latestRM = await getLatestReleaseTag("https://api.github.com/repos/Swifter1243/ReMapper/releases/latest")

const scriptPath = path.join(destFolder, "script.ts")
let fileContents = await Deno.readTextFile(scriptPath)
fileContents = fileContents.replace("@VERSION", `"https://deno.land/x/remapper@${latestRM}/src/mod.ts"`)
await Deno.writeTextFile(scriptPath, fileContents)

console.log(`Successfully setup new map at ${destFolder}`)