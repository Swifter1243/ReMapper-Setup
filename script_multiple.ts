import * as rm from @VERSION
@BUNDLEIMPORT

@PIPELINE

@BUNDLEDEFINES

// ----------- { SCRIPT } -----------

async function doMap(file: rm.DIFFICULTY_NAME) {
    const map = await rm.readDifficultyV3(pipeline, file)

    // Example: Run code on every note!

    // map.allNotes.forEach(note => {
    //     console.log(note.beat)
    // })

    // For more help, read: https://github.com/Swifter1243/ReMapper/wiki
}

await Promise.all([
    doMap('ExpertPlusStandard'),
    doMap('ExpertStandard'),
    doMap('HardStandard')
])

// ----------- { OUTPUT } -----------

pipeline.export({
    outputDirectory: '../OutputMaps/Your Map'
})
