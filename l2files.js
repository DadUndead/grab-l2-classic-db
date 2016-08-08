const fs = require('fs')
const readline = require('readline')
const stream = require('stream')
const _ = require('lodash')
const mongoose = require('mongoose')
const NPC = require('./l2mongodb').NPC

//Description => skillname-classic-eu.txt
//Skill id and skill icon => skillgrp_classic.txt
//Assign skill to npc => npcgrp_classic.txt
const skillnames = fs.readFileSync('./files/skillname_classic-eu.txt').toString().split('\n')
const skillgrp = fs.readFileSync('./files/skillgrp_classic.txt').toString().split('\n')
const npcgrp = fs.readFileSync('./files/npcgrp_classic.txt').toString().split('\n')
const SKILL_MIN_ID = 70000
const SKILL_ICON = 'icon.skillraid'

console.log('skillgrp:',skillgrp.length)
console.log('skillnames:',skillnames.length)
console.log('npcgrp:',npcgrp.length)


_.remove(skillnames,s=>s.split('\t')[0]*1>=SKILL_MIN_ID)
_.remove(skillgrp,s=>s.split('\t')[0]*1>=SKILL_MIN_ID)
// _.remove(skillnames,s=>s.split('\t')[0]*1>=SKILL_MIN_ID)
fs.writeFileSync('./files/skillname_classic-eu.txt', skillnames.join('\n'))
fs.writeFileSync('./files/skillgrp_classic.txt', skillgrp.join('\n'))


//create new skills

NPC.find(
  {},
  (err, npcs) => {
      if (err) throw err
      console.log('=>',npcs.length);

      let newSkills =
        _.map(npcs,(npc,i)=>
          _.map(skillnames[0].split('\t'), skill=>{
              switch(skill){
                case 'id1':	return SKILL_MIN_ID+i
                case 'id2':	return 0
                case 'level1':return 1
                case 'level2':return 0
                case 'id3':	return 0
                case 'id4':	return 0
                case 'level3': return -1
                case 'level4': return -1
                case 'name': return 'a,[Info: x1----------l2classic------------]\\0'
                case 'description':	return 'a,Level:'+npc.npcInfo.level+'\\nHP:'+npc.npcInfo.hp+'\\nMP:'+npc.npcInfo.mp+'\\0'
                case 'desc_val': return 'a,'
                case 'desc_add1':	return 'a,none\\0'
                case 'desc_val1':	return 'a,'
                case 'desc_add2':	return 'a,none\\0'
                case 'desc_val2': return 'a,'
                default: return console.log('?')
              }
          }).join('\t')
        )

      let newSkillIcons =
        _.map(npcs,(npc,i)=>
          _.map(skillgrp[0].split('\t'), skill=>{
              switch(skill){
                case 'skill_id': return SKILL_MIN_ID+i
                case 'skill_level':return 1
                case 'oper_type':return 16
                case 'UNK_0':return 0
                case 'mp_consume':return 2
                case 'cast_style':return 0
                case 'cast_range':return -1
                case 'UNK_1':return 0
                case 'hit_time[0]':return '0.00000000'
                case 'hit_time[1]':return '0.00000000'
                case 'hit_time[2]':return '0.00000000'
                case 'is_magic':return 0
                case 'UNK_3[0]':return 0
                case 'UNK_3[1]':return 0
                case 'UNK_3[2]':return 0
                case 'UNK':return 0
                case 'CNT_0':return 1
                case 'ani_char[0]':return ''
                case 'ani_char[1]':return ''
                case 'desc':return ''
                case 'icon_name':return 'icon.skillraid'
                case 'icon_name2':return ''
                case 'extra_eff':return 0
                case 'is_ench':return 0
                case 'ench_skill_id':return 0
                case 'hp_consume':return 0
                case 'nonetext1':return 'a,none\\0'
                case 'UNK_4[0]':return 0
                case 'UNK_4[1]':return -1
                case 'UNK_4[2]':return -1
                case 'UNK_4[3]':return 0
                case 'nonetext2':return 'a,none\\0'
                default: return console.log('?')
              }
          }).join('\t')
        )

        const NPCGRP0 = npcgrp[0].split('\t')

        let newNpcs = [npcgrp[0]]
        newNpcs.push(_.map(npcs,(npc,i)=>
          _.map(NPCGRP0, (np, j) =>{
              const l = _.find(npcgrp, line=> line.split('\t')[0]*1==npc.id)
              const LINE= l.split('\t')
              if (j>15 && NPCGRP0[j].includes('dtab1[')){
                if (!LINE[j]) {
                  return SKILL_MIN_ID+i
                }else if (LINE[j-1]==SKILL_MIN_ID+i){
                  return 1                }
              }
              console.log('SKILL_MIN_ID:',SKILL_MIN_ID+i)
              return LINE[j]
          })
        ))

        console.log('=>',newNpcs)

        // _.forEach(npcs, (npc,i)=>{
        //   _.forEach(
        //     _.find(npcgrp, np=>npc.id==np.split('\t')[0]*1).split('\t'),
        //     (element,j)=>{
        //       for (let k=0; k<23; k+=2){
        //         if (npcgrp[0].split('\t')[i]=='dtab1['+k+']'&&element==''){
        //           element=SKILL_MIN_ID+i
        //
        //         }
        //       }
        //     }
        //   )
        //
        // })

      // fs.appendFile('./files/skillname_classic-eu.txt',newSkills.join('\n')+'\n', (err)=>{
      //   if (err) throw err
      //   console.log('NewSkills',newSkills.length,'appended')
      // })
      //
      // fs.appendFile('./files/skillgrp_classic.txt',newSkillIcons.join('\n')+'\n', (err)=>{
      //   if (err) throw err
      //   console.log('NewSkillIcons',newSkillIcons.length,'appended')
      // })
      //
      // fs.writeFile('./files/npcgrp_classic.txt',npcgrp.join('\n')+'\n', (err)=>{
      //   if (err) throw err
      //   console.log('NewNpcs',npcgrp.length,'appended')
      // })
  })
