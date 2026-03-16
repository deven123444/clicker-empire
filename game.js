
let coins=0
let coinsPerClick=1
let coinsPerSecond=0
let level=1
let bossHP=0
let worldIndex=0

const worlds=[
{name:"Earth",mult:1},
{name:"Moon",mult:2},
{name:"Mars",mult:5},
{name:"Galaxy",mult:10}
]

const upgrades=[
{name:"Iron Finger",cost:20,click:1},
{name:"Steel Finger",cost:80,click:3},
{name:"Diamond Finger",cost:200,click:10},
{name:"Quantum Finger",cost:1000,click:50},
{name:"Auto Miner",cost:100,cps:1},
{name:"Mining Rig",cost:500,cps:5},
{name:"Coin Factory",cost:2000,cps:20},
{name:"Mega Factory",cost:10000,cps:100},
{name:"Planet Extractor",cost:50000,cps:500}
]

const pets=[
{name:"Gold Cat",cost:500,bonus:1.1},
{name:"Robot Dog",cost:2000,bonus:1.25},
{name:"Crystal Dragon",cost:10000,bonus:1.5},
{name:"Phoenix",cost:50000,bonus:2}
]

function updateUI(){
document.getElementById("coins").innerText=Math.floor(coins)
document.getElementById("cps").innerText=coinsPerSecond
document.getElementById("level").innerText=level
document.getElementById("bossHP").innerText=bossHP
document.getElementById("world").innerText=worlds[worldIndex].name
}

document.getElementById("clickButton").onclick=()=>{

let damage=coinsPerClick*worlds[worldIndex].mult

if(bossHP>0){
bossHP-=damage
if(bossHP<=0){
coins+=2000*worlds[worldIndex].mult
bossHP=0
addAchievement("Boss defeated")
}
}else{
coins+=damage
}

checkLevel()
updateUI()
}

function buildShop(){

const shop=document.getElementById("shop")
shop.innerHTML=""

upgrades.forEach(u=>{

let div=document.createElement("div")
div.className="shop-item"

div.innerHTML=`${u.name} - ${u.cost} coins <button>Buy</button>`

div.querySelector("button").onclick=()=>{

if(coins>=u.cost){

coins-=u.cost

if(u.click)coinsPerClick+=u.click
if(u.cps)coinsPerSecond+=u.cps

u.cost=Math.floor(u.cost*1.6)

buildShop()
updateUI()

}

}

shop.appendChild(div)

})

}

function buildPets(){

const petDiv=document.getElementById("pets")
petDiv.innerHTML=""

pets.forEach(p=>{

let div=document.createElement("div")
div.className="shop-item"

div.innerHTML=`${p.name} - ${p.cost} coins <button>Adopt</button>`

div.querySelector("button").onclick=()=>{

if(coins>=p.cost){

coins-=p.cost
coinsPerClick*=p.bonus
coinsPerSecond*=p.bonus

p.cost*=2

buildPets()
updateUI()

}

}

petDiv.appendChild(div)

})

}

function buildWorlds(){

const worldDiv=document.getElementById("worlds")
worldDiv.innerHTML=""

worlds.forEach((w,i)=>{

let btn=document.createElement("button")
btn.innerText=w.name

btn.onclick=()=>{

if(level>=(i+1)*5){

worldIndex=i
updateUI()

}

}

worldDiv.appendChild(btn)

})

}

function spawnBoss(){

bossHP=level*300

}

document.getElementById("spawnBoss").onclick=spawnBoss

function checkLevel(){

if(coins>level*300){

level++
addAchievement("Reached level "+level)

}

}

function addAchievement(text){

let li=document.createElement("li")
li.innerText=text

document.getElementById("achievements").appendChild(li)

}

setInterval(()=>{

coins+=coinsPerSecond*worlds[worldIndex].mult
updateUI()

},1000)

document.getElementById("dailyReward").onclick=()=>{

coins+=5000
addAchievement("Claimed daily reward")

}

document.getElementById("save").onclick=()=>{

localStorage.setItem("clickerEmpireProSave",JSON.stringify({
coins,coinsPerClick,coinsPerSecond,level,worldIndex
}))

}

document.getElementById("reset").onclick=()=>{

localStorage.clear()
location.reload()

}

function load(){

let save=JSON.parse(localStorage.getItem("clickerEmpireProSave"))

if(save){

coins=save.coins
coinsPerClick=save.coinsPerClick
coinsPerSecond=save.coinsPerSecond
level=save.level
worldIndex=save.worldIndex

}

}

document.getElementById("submitScore").onclick=()=>{

let name=document.getElementById("playerName").value
let scores=JSON.parse(localStorage.getItem("leaderboard")||"[]")

scores.push({name,coins})
scores.sort((a,b)=>b.coins-a.coins)
scores=scores.slice(0,10)

localStorage.setItem("leaderboard",JSON.stringify(scores))
renderLeaderboard()

}

function renderLeaderboard(){

let scores=JSON.parse(localStorage.getItem("leaderboard")||"[]")

let list=document.getElementById("leaderboard")
list.innerHTML=""

scores.forEach(s=>{

let li=document.createElement("li")
li.innerText=s.name+" - "+Math.floor(s.coins)

list.appendChild(li)

})

}

load()
buildShop()
buildPets()
buildWorlds()
renderLeaderboard()
updateUI()
