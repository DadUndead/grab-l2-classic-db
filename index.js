const fs = require('fs')
const _ = require('lodash')
const cheerio = require('cheerio')
const request = require('request')
const mongoose = require('mongoose')

_launchBot()

function _launchBot() {
    mongoose.connect('mongodb://localhost:27017/test')

    const db = mongoose.connection
    db.on('error', () => console.error('connection error'))
    db.once('open', () => console.log("we're connected"))

    const Item = mongoose.model('Item', {
        name: String
    })

    const npcSchema = new mongoose.Schema({
        id: Number,
        npcName: String,
        npcImg: String,
        npcInfo: {
            level: Number,
            hp: Number,
            mp: Number,
        },
        npcSkills: Array,
        drops: Array,
        spoils: Array
    })
    const NPC = mongoose.model('NPC', npcSchema)

    const download = (uri, filename, callback) => {
      uri = 'http://plakis.eu/database/'+uri
      request.head(uri, (err, res, body) =>
        fs.exists('./img/'+filename, exists =>{
          if (!exists) request(uri)
                      .pipe(fs.createWriteStream('./img/'+filename))
                      .on('close', callback);
        })
      );
    };

    let exists = []

    const MIN_ID = fs.readFileSync('./logs.txt').toString()*1
    const MAX_ID = 40000

    NPC.find({},(err, docs) => {
        exists = _.chain(docs)
                  .orderBy('id','asc')
                  .map(d=>d.id)
                  .value()

        exists.map(x=>console.log(x))
        let req_counter = MIN_ID
        request_npc(req_counter)
      }
    )
for(let npc_id=MIN_ID; npc_id<MAX_ID; npc_id++ ){
    function request_npc(npc_id) {
      fs.writeFile('./logs.txt',npc_id, (err)=>{
      if(err) throw err

      process.stdout.write("Checking: "+npc_id);
      if (npc_id>=MAX_ID) return true
      if (exists.includes(npc_id)){
        console.warn(' This npc '+npc_id+' is already in database')
      }

      request(
      {
        method: 'GET',
        uri: 'http://plakis.eu/database/index.php?mob&show=' + npc_id + '&lang=en',
      },
      (err, res, body) => {
        if(err) {
          console.error(err)
          return 
        }
        if (res.statusCode == 200) {
            const $ = cheerio.load(body, {
                    normalizeWhitespace: true,
                    xmlMode: true,
                    decodeEntities: true
                })
                // console.log('html:', $('#bold-big').text())
            if (!$('#bold-big').text()) {
              process.stdout.write(" no npc\n");
              request_npc(++npc_id)
              return
            }

            const npcInfo =
                $('#npc-info')
                .first()
                .contents()
                .filter((i, el) => el.type === 'text')
                .text()
                .split(' ')
                .filter(x => x != '')

            const npcImg = $('#npc-thumb img').attr('src')

            download(npcImg, npcImg,
              ()=>console.log(npcImg,'done')
            )

            const npcSkills = []
            $('#npc-skills-thumbs')
                .contents()
                .filter('img')
                .each((i, el) => npcSkills.push($(el).attr('src')))

            const drops = []
            $('#drops table')
                .children()
                .each((i, el) => {
                    const ar = {}
                    $(el)
                        .children()
                        .each((i, el2) => {
                            if ($(el2).find('img').length){
                                ar.img = $(el2).find('img').attr('src')
                                download(ar.img, ar.img,
                                  ()=>console.log(ar.img,'done')
                                )
                            }else
                                ar.info = $(el2).text()
                        })
                    if (ar.info) drops.push(ar)
                })

            const spoils = []
            $('#spoils table')
                .children()
                .each((i, el) => {
                    const ar = {}
                    $(el)
                        .children()
                        .each((i, el2) => {
                            if ($(el2).find('img').length){
                                ar.img = $(el2).find('img').attr('src')
                                download(ar.img, ar.img,
                                  ()=>console.log(ar.img,'done')
                                )
                            }else
                                ar.info = $(el2).text()
                        })
                    if (ar.info) spoils.push(ar)
                })

            // console.log('drops:', drops)

            const info = {
                id: npc_id,
                "npcName": $('#bold-big').text(),
                "npcImg": npcImg,
                "npcInfo": {
                    level: npcInfo[0],
                    hp: npcInfo[1],
                    mp: npcInfo[2],
                },
                "npcSkills": npcSkills,
                "drops": drops,
                "spoils": spoils
            }

            NPC.findOneAndUpdate(
              {'npcName':info['npcName']},
              info,
              {upsert:true},
              (err, doc) => {
                  if (err) {
                    throw err
                  }
                  if (npc_id<MAX_ID) request_npc(++npc_id)
                  return console.log(npc_id,"succesfully saved");
              });
        }
      })
    })
  }
}
}
