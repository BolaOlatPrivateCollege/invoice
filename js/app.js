const businesses = {

skilled:{

name:"The Skilled Network",

prefix:"TSN",

address:"14 Agunbiade Street, Shomolu",

phone:"+2349039228525",

tax:"33758764-0001",

currency:"NGN",

bank1:"Account Name: The Skilled Network | Bank: KUDA MFB | Account Number: 3003119258"

},

prints:{

name:"The Prints Headquarters",

prefix:"TPH",

address:"20 Oshipitan Street, Shomolu, Lagos, Lagos 234001, Nigeria",

phone:"09039720501",

tax:"2522533598992",

currency:"NGN",

bank1:"Account Name: The Prints Headquarters | Bank: OPAY MFB | Account Number: 6110436831"

}

}



/* LOAD BUSINESS */

function loadBusiness(){

const selected = document.getElementById("businessSelect").value

const biz = businesses[selected]

document.getElementById("bizName").innerText = biz.name

document.getElementById("bizAddress").innerText = biz.address

document.getElementById("bizPhone").innerText = biz.phone

document.getElementById("bizTax").innerText = biz.tax

document.getElementById("bank1").innerText = biz.bank1

generateInvoiceNumber(selected)

}



/* GENERATE INVOICE NUMBER */

function generateInvoiceNumber(businessKey){

const biz = businesses[businessKey]

const prefix = biz.prefix

const key = "invoiceCounter_" + prefix

let counter = localStorage.getItem(key)

if(!counter){

counter = 1

}else{

counter = Number(counter) + 1

}

localStorage.setItem(key,counter)

const formatted = String(counter).padStart(4,"0")

const invoiceNumber = prefix + "-" + formatted

document.getElementById("invoiceNumber").value = invoiceNumber

}



/* PAGE LOAD */

window.onload = function(){

loadBusiness()

addRow()

}



/* ADD ITEM ROW */

function addRow(){

const table = document.getElementById("itemRows")

const row = table.insertRow()

row.innerHTML = `

<td><input class="desc"></td>

<td><input type="number" class="qty"></td>

<td><input type="number" class="price"></td>

<td class="amount">0</td>

`

}



/* CALCULATE TOTAL */

document.addEventListener("input",calculate)

function calculate(){

let total = 0

document.querySelectorAll("#itemRows tr").forEach(row=>{

let qty = row.querySelector(".qty").value || 0

let price = row.querySelector(".price").value || 0

let amount = qty * price

row.querySelector(".amount").innerText = amount

total += amount

})

document.getElementById("total").innerText = total

}



/* SAVE INVOICE TO GOOGLE SHEETS */

async function saveInvoice(){

const invoiceId = document.getElementById("invoiceNumber").value

const client = document.getElementById("clientName").value

const date = document.getElementById("date").value

const dueDate = document.getElementById("dueDate").value

const business = document.getElementById("bizName").innerText

const total = document.getElementById("total").innerText

let items = []

document.querySelectorAll("#itemRows tr").forEach(row=>{

items.push({

description:row.querySelector(".desc").value,

qty:row.querySelector(".qty").value,

price:row.querySelector(".price").value,

amount:row.querySelector(".amount").innerText

})

})


const data = {

invoiceId:invoiceId,

business:business,

client:client,

date:date,

dueDate:dueDate,

total:total,

items:items

}


/* REPLACE WITH YOUR APPS SCRIPT URL */

await fetch("https://script.google.com/macros/s/AKfycbwftxkxDUuWPwInygrh5ydYFmNNLYP_K015pGESySn-tKONS45IL42G4jIPi2zcYL_4UA/exec",{

method:"POST",

body:JSON.stringify(data)

})

alert("Invoice saved successfully!")

}
