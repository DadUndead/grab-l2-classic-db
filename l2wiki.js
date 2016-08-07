const fs = require('fs')
const readline = require('readline')
const stream = require('stream')
const _ = require('lodash')
const cheerio = require('cheerio')
const request = require('request')
const mongoose = require('mongoose')
const urlytils = require('url')

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

const NPC = mongoose.model('NPC', npcSchema)

const rl = readline.createInterface({
  input: fs.createReadStream('./files/NpcName_Classic-eu.txt'),
  output: new stream
});

let counter = 0
rl.on('line', (input) => {
  // TODO: Log the answer in a database
  let mob  = input.match(/[^,]*(?=\\0)/)
  if (!mob) return
  let mob_name = mob[0].replace(' ','_')
  let mob_id = input.match(/^[0-9]*/)[0]
  //here we create request

  console.log("Checking: ",mob_id, mob_name)

  let info = {
    id:mob_id,
    "npcName":mob_name
  }
  setTimeout(()=>{
      request(
      {
        method:'GET',
        uri: 'https://l2wiki.com/classic/'+mob_name
      },
      (err, res, body) => {
          if (err) return console.error(err)
          if (res.statusCode==200){
            const $ = cheerio.load(body,{
              normalizeWhitespace:true,
              xmlMode:true,
              decodeEntities:true
            })
            console.log('h1=>', $('h1')[0].children[0].data)
            info.npcImg
            info.npcLocation = $('#npc_brief_info_1').find('a').attr('title')
            info.npcInfo ={
              level:$('#npc_brief_info_2').find('tr:nth-child(3)').find('td:nth-child(2)').text(),
              hp:$('#npc_brief_info_2').find('tr:nth-child(4)').find('td:nth-child(2)').text(),
              mp:$('#npc_brief_info_2').find('tr:nth-child(5)').find('td:nth-child(2)').text(),
              exp:$('#npc_brief_info_2').find('tr:nth-child(6)').find('td:nth-child(2)').text(),
              sp:$('#npc_brief_info_2').find('tr:nth-child(7)').find('td:nth-child(2)').text()
            }
            info.npcSkills = _.map($('#npc_brief_info_2 tr:nth-child(10)').find('img'), img=>$(img).attr('src'))
            info.drops =
              _.chain($('table:nth-child(7), table:nth-child(8)').find('tr'))
              .filter(tr=>!$(tr).find('th').length)
              .map(
                tr=>({
                    name:$(tr).find('td').eq(0).find('a').eq(1).attr('title'),
                    icon:$(tr).find('td').eq(0).find('a').eq(0).attr('href'),
                    count:$(tr).find('td').eq(1).text(),
                    chance:$(tr).find('td').eq(2).text()
                  })
              )
              .value()

            info.spoils=
              _.chain($('table:nth-child(10)').find('tr'))
              .filter(tr=>!$(tr).find('th').length)
              .map(
                tr=>({
                    name:$(tr).find('td').eq(0).find('a').eq(1).attr('title'),
                    icon:$(tr).find('td').eq(0).find('a').eq(0).attr('href'),
                    count:$(tr).find('td').eq(1).text(),
                    chance:$(tr).find('td').eq(2).text()
                  })
              )
              .value()
            //console.log(info)

            NPC.findOneAndUpdate(
              {'id':mob_id},
              info,
              {upsert:true},
              (err, doc) => {
                  if (err) throw err
                  console.log(mob_name,"succesfully saved");
              });
          }
      }
    )
  },(++counter%100)*2000)


});
