export * as fs from "https://deno.land/std@0.149.0/fs/mod.ts";
export * as path from "https://deno.land/std@0.149.0/path/mod.ts";
export * as io from "https://deno.land/std@0.149.0/io/mod.ts";
export * as streams from "https://deno.land/std@0.149.0/streams/mod.ts";
import configDirProxy from "https://deno.land/x/config_dir@v0.1.1/mod.ts";

export function configDir() {
    return configDirProxy()
}