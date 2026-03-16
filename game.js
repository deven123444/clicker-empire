
let coins=0
let coinsPerClick=1
let coinsPerSecond=0
let level=1

const upgrades=[
{name:"Power Click",cost:10,click:1},
{name:"Super Click",cost:50,click:5},
{name:"Auto Miner",cost:100,cps:1},
{name:"Factory",cost:500,cps:5},
{name:"Mega Factory",cost:2000,cps:20}
]

const pets=[
{name:"Gold Cat",cost:300,bonus:1.1},
{name:"Robot Dog",cost:1000,bonus:1.25},
{name:"Dragon",cost:5000,bonus:1.5}
]

function updateUI(){
document.getElementById("coins").innerText=Math.floor(coins)
document.getElementById("cps").innerText=coinsPerSecond
document.getElementById("level").innerText=level
}

document.getElementById("clickButton").onclick=()=>{
coins+=coinsPerClick
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
u.cost=Math.floor(u.cost*1.5)
updateUI()
buildShop()
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
updateUI()
buildPets()
}
}
petDiv.appendChild(div)
})
}

function checkLevel(){
if(coins>level*100){
level++
let li=document.createElement("li")
li.innerText="Reached Level "+level
document.getElementById("achievements").appendChild(li)
}
}

setInterval(()=>{
coins+=coinsPerSecond
updateUI()
},1000)

document.getElementById("save").onclick=()=>{
localStorage.setItem("clickerEmpireSave",JSON.stringify({
coins,coinsPerClick,coinsPerSecond,level
}))
alert("Game Saved")
}

function load(){
const save=JSON.parse(localStorage.getItem("clickerEmpireSave"))
if(save){
coins=save.coins
coinsPerClick=save.coinsPerClick
coinsPerSecond=save.coinsPerSecond
level=save.level
}
}

load()
buildShop()
buildPets()
updateUI()
