import * as rm from @VERSION
@BUNDLEIMPORT

@PIPELINE
const map = rm.readDifficultyV3(pipeline, 'ExpertPlusStandard')

@BUNDLEDEFINES

// ----------- { SCRIPT } -----------


// Example: Run code on every note!

// map.allNotes.forEach(note => {
//     console.log(note.beat)
// })

// For more help, read: https://github.com/Swifter1243/ReMapper/wiki


// ----------- { OUTPUT } -----------

pipeline.export({
    outputDirectory: '../OutputMaps/Your Map'
})
