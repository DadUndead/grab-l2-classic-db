
const mongoose = require('mongoose')
//DB==================================================================
mongoose.connect('mongodb://localhost:27017/l2classic')

const db = mongoose.connection
db.on('error', () => console.error('connection error'))
db.once('open', () => console.log("we're connected"))

const npcSchema = new mongoose.Schema({
    id: Number,
    npcName: String,
    npcImg: String,
    npcInfo: {
        level: String,
        hp: String,
        mp: String,
    },
    npcSkills: Array,
    drops: [
      {
        name:String,
        icon:String,
        count:String,
        chance:String
      }
    ],
    spoils: [
      {
        name:String,
        icon:String,
        count:String,
        chance:String
      }
    ]
})

module.exports.NPC = mongoose.model('NPC', npcSchema)
