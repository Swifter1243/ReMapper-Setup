import { fs } from "./deps.ts";

async function findUnityExecutable(): Promise<string | null> {
    const possiblePaths = [
        Deno.env.get("UNITY_HUB_PATH"),
        "C:/Program Files/Unity Hub/Unity Hub.exe", // Windows default
        "/Applications/Unity Hub.app/Contents/MacOS/Unity Hub", // macOS default
    ].filter((path): path is string => !!path);

    for (const path of possiblePaths) {
        if (await fs.exists(path)) {
            const process = new Deno.Command(path, {
                args: ["--headless", "--", "editors"],
                stdout: "piped",
                stderr: "null",
            });
            const { stdout } = await process.output();
            const output = new TextDecoder().decode(stdout);
            
            const match = output.match(/(?<path>.+2019\.4\.28f1.+)/);
            if (match && match.groups) {
                return match.groups.path;
            }
        }
    }
    
    // Scan known Unity installation directories
    const unityDirs = [
        "C:/Program Files/Unity/Hub/Editor/2019.4.28f1/Editor/Unity.exe",
        "/Applications/Unity/Hub/Editor/2019.4.28f1/Unity.app/Contents/MacOS/Unity"
    ];
    
    for (const path of unityDirs) {
        if (await fs.exists(path)) {
            return path;
        }
    }
    
    return null;
}

export async function createUnityProject(projectPath: string): Promise<boolean> {
    console.log(`Setting up Unity project at '${projectPath}'...`)

    const unityPath = await findUnityExecutable();
    if (!unityPath) {
        console.error("Unity 2019.4.28f1 not found.");
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