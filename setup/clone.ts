import { streams } from "./deps.ts";

export default async function cloneTemplateToCache(
  path: string,
  ref: string
): Promise<void> {
  try {
    const process = new Deno.Command("git", {
      args: [
        "clone",
        "--depth",
        "1",
        `-o`,
        ref,
        `https://github.com/Swifter1243/ReMapper-Setup.git`,
        path,
      ],
      stdout: "inherit",
      stderr: "inherit",
    });
    const processHandle = process.spawn();

    // const stdoutPromise = processHandle.stdout.pipeTo(
    //   streams.writableStreamFromWriter(Deno.stdout)
    // );
    // const stderrPromise = processHandle.stderr.pipeTo(
    //   streams.writableStreamFromWriter(Deno.stderr)
    // );

    // await Promise.all([stdoutPromise, stderrPromise]);
    const status = await processHandle.status;

    if (!status.success) {
      console.error("Failed to git clone");
      console.error(`Received code: ${status.code}`);
      Deno.exit(status.code);
    }
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      if (Deno.build.os === "linux") {
        console.error("Download git using your system's package manager");
      } else {
        console.error("Download git at https://git-scm.com/downloads");
      }
      Deno.exit(1);
    }
    throw e;
  }

  console.log(`Cloned the template with revision ${ref} to ${path}`);
}
