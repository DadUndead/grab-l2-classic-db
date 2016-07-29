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

    const NPC = mongoose.model('NPC', {
        name: String
    })

    const options = {

    }

    for (let i = 20030; i < 20040; i++) {
        request({
                method: 'GET',
                uri: 'http://plakis.eu/database/index.php?mob&show=' + i + '&lang=en',
            },
            (err, res, body) => {
                if (res.statusCode == 200) {
                    const $ = cheerio.load(body)
                        // console.log('html:', $('#bold-big').text())

                    const info = {
                        id: i,
                        "npcName": $('#bold-big').text(),
                        "npcImg": $('#npc-thumb img').attr('src'),
                        "npcInfo": {
                            level: $('#npc-info').first().contents().filter(
                                function() {
                                    return this.type === 'text'
                                }).text()
                        }
                    }

                    console.dir(info)
                }
            })
    }
}
