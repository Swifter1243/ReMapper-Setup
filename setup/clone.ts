import { configDir, path as osPath, fs, streams } from "./deps.ts";

export default async function cloneTemplateToCache(path: string, ref: string) :Promise<void> {
    try {
        await Deno.stat("git")
    } catch (e) {
        console.error("Unable to detect git, make sure you have it installed")
        throw e;
    }

    const process = Deno.run({
        "cmd": ["git", "clone", "--shallow", "--depth", "1", `-o`, ref, `https://github.com/Swifter1243/ReMapper-Setup.git`, path],
        stdout: "piped",
        stderr: "piped",
    })

    streams.copy(process.stdout, Deno.stdout);
    streams.copy(process.stderr, Deno.stderr);

    const status = await process.status()
    if (!status.success) {
        console.error("Failed to git clone")
        console.error(`Received code: ${status.code}`)
        Deno.exit(status.code)
    }

    console.log(`Cloned the template with revision ${ref} to ${path}`)
}