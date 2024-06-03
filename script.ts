import * as rm from @VERSION

const map = await rm.readDifficulty("ExpertPlusNoArrows", "ExpertPlusStandard")

// ----------- { SCRIPT } -----------


// Example: Run code on every note!

// map.allNotes.forEach(note => {
//     console.log(note.beat)
// })

// For more help, read: https://github.com/Swifter1243/ReMapper/wiki


// ----------- { OUTPUT } -----------

map.save()
