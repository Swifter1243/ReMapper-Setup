# What is this?

**ReMapper-Setup** is a tool to add [ReMapper](https://github.com/Swifter1243/ReMapper) project files to a Beat Saber map.

## Install

Run this command in a Powershell window to install the tool onto your system
```
deno install --allow-all -f --reload --global https://raw.githubusercontent.com/Swifter1243/ReMapper-Setup/master/setup/rm_setup.ts
```

## Run

Run this in your VS-Code terminal to add the files to your map
```
rm_setup
```

***

There's also some flags you can set:
- `multi-diff` or `m` - Prepare script for difficulties.
- `unity-setup` or `u` - Create a Unity `2019.4.28f1` project, and prepare script for [VivifyTemplate](https://github.com/Swifter1243/VivifyTemplate) usage.
- `git-setup` or `g` - Setup your project with git, creating an appropriate `.gitignore`.

You can use as many of these flags as you'd like. For example:
```
rm_setup -m -u
```
```
rm_setup --multi-diff --unity-setup
```
