import { fs, path } from "./deps.ts";

async function findUnityHub() {
    const possibleHubPaths = [
        Deno.env.get("UNITY_HUB_PATH"),
        "C:/Program Files/Unity Hub/Unity Hub.exe", // Windows default
        "/Applications/Unity Hub.app/Contents/MacOS/Unity Hub", // macOS default
    ].filter((path): path is string => !!path);

    for (const hubPath of possibleHubPaths) {
        if (await fs.exists(hubPath)) {
            return hubPath;
        }
    }

    console.log("Unity Hub could not be found.")
    while (true) {
        const hubInput = prompt("Please enter the path to your Unity Hub executeable:")

        if (!hubInput) {
            console.log("Invalid input. Try again.")
            continue
        }

        const validEditor = await fs.exists(hubInput) && path.extname(hubInput) === '.exe'
        if (!validEditor) {
            console.log("Editor executeable path is not valid. Try again.")
            continue
        }

        return hubInput
    }
}

let storedUnityHub: string | null = null
async function getUnityHub() {
    if (storedUnityHub) {
        return storedUnityHub
    }
    
    storedUnityHub = await findUnityHub()
    return storedUnityHub
}

async function findUnityEditor(unityHubPath: string, version: string): Promise<string | null> {
    const process = new Deno.Command(unityHubPath, {
        args: ["--headless", "--", "editors"],
        stdout: "piped",
        stderr: "null",
    });
    const { stdout } = await process.output();
    const output = new TextDecoder().decode(stdout);
    
    const match = output.match(new RegExp(`(?<path>.+${version}.+)`));
    if (match && match.groups) {
        return match.groups.path;
    }
    return null;
}

async function findUnityExecutable(version: string): Promise<string | null> {
    const unityHub = await getUnityHub()
    const executeable = await findUnityEditor(unityHub, version);
    if (executeable) {
        return executeable;
    }
    
    // Scan known Unity installation directories
    const unityDirs = [
        `C:/Program Files/Unity/Hub/Editor/${version}/Editor/Unity.exe`,
        `/Applications/Unity/Hub/Editor/${version}/Unity.app/Contents/MacOS/Unity`
    ];
    
    for (const path of unityDirs) {
        if (await fs.exists(path)) {
            return path;
        }
    }
    
    return null;
}

export async function findUnity2019Executable(): Promise<string | null> {
    return await findUnityExecutable('2019.4.28f1') ?? await findUnityExecutable('2019.4.28f1c1')
}

export async function createUnityProject(projectPath: string): Promise<boolean> {
    console.log(`Setting up Unity project at '${projectPath}'...`);

    const unityPath = await findUnity2019Executable();
    if (!unityPath) {
        console.error(`Unity 2019.4.28f1 not found.`);
        return false;
    }
    
    const process = new Deno.Command(unityPath, {
        args: [
            "-createProject", projectPath,
            "-batchmode",
            "-nographics",
            "-quit",
        ],
        stdout: "piped",
        stderr: "piped",
    });
    const { stdout, stderr } = await process.output();
    
    console.log(new TextDecoder().decode(stdout));
    console.error(new TextDecoder().decode(stderr));
    
    return await fs.exists(projectPath);
}
