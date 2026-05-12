const businesses = {
  skilled: {
    name: "The Skilled Network",
    prefix: "TSN",
    address: "14 Agunbiade Street, Shomolu, Lagos, Nigeria",
    phone: "+2349039228525",
    tax: "33758764-0001",
    currency: "NGN",
    bank1:
      "Account Name: The Skilled Network\n" +
      "Bank: KUDA MFB\n" +
      "Account Number: 3003119258\n\n" +
      "Account Name: The Skilled Network\n" +
      "Bank: OPAY MFB\n" +
      "Account Number: 6142242536"
  },

  prints: {
    name: "The Prints Headquarters",
    prefix: "TPH",
    address: "20 Oshipitan Street, Shomolu, Lagos, Lagos 234001, Nigeria",
    phone: "09039720501",
    tax: "2522533598992",
    currency: "NGN",
    bank1:
      "Account Name: The Prints Headquarters\n" +
      "Bank: OPAY MFB\n" +
      "Account Number: 6110436831"
  }
};

// Replace this if your Apps Script deployment URL changes.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzhJUP9XeP1PDBaDHD9YYZx0Oc6YWkwbeTY4A_mo-_8wzqmSZ55UGPc0DsPNMzGtgFv/exec";

let invoiceSaved = false;
let currentInvoiceId = "";
let loadedInvoiceMode = false;
let currentPaymentStatus = "Unpaid";
let currentAmountPaid = 0;

window.onload = function () {
  loadBusiness();
  setTodayDates();
  resetItems();
  updatePaymentStatus("Unpaid");
};

function setTodayDates() {
  const today = new Date().toISOString().split("T")[0];

  document.getElementById("date").value = today;
  document.getElementById("dueDate").value = today;
  document.getElementById("paymentDate").value = today;
}

function loadBusiness() {
  const selected = document.getElementById("businessSelect").value;
  const biz = businesses[selected];

  document.getElementById("bizName").innerText = biz.name;
  document.getElementById("bizAddress").innerText = biz.address;
  document.getElementById("bizPhone").innerText = biz.phone;
  document.getElementById("bizTax").innerText = biz.tax;
  document.getElementById("bizCurrency").innerText = biz.currency;
  document.getElementById("bank1").innerText = biz.bank1;
  document.getElementById("bizLogo").innerText = biz.prefix;

  if (!invoiceSaved && !loadedInvoiceMode) {
    document.getElementById("invoiceNumber").value = "Auto-generated on save";
    currentInvoiceId = "";
    currentAmountPaid = 0;
    updatePaymentStatus("Unpaid");
    calculate();
  }
}

function resetItems() {
  document.getElementById("itemRows").innerHTML = "";
  addRow();
  calculate();
}

function addRow() {
  const table = document.getElementById("itemRows");
  const row = table.insertRow();

  row.innerHTML = `
    <td><input class="desc" placeholder="Item description"></td>
    <td><input type="number" min="0" class="qty" placeholder="0"></td>
    <td><input type="number" min="0" class="price" placeholder="0.00"></td>
    <td class="amount-cell">0.00</td>
    <td class="no-print">
      <button type="button" class="remove-btn" onclick="removeRow(this)">Remove</button>
    </td>
  `;
}

function removeRow(button) {
  const row = button.closest("tr");
  row.remove();

  if (document.querySelectorAll("#itemRows tr").length === 0) {
    addRow();
  }

  calculate();
}

document.addEventListener("input", function (e) {
  if (
    e.target.classList.contains("qty") ||
    e.target.classList.contains("price") ||
    e.target.id === "discount" ||
    e.target.id === "tax"
  ) {
    calculate();
  }
});

function formatMoney(amount) {
  return Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function calculate() {
  let subtotal = 0;

  document.querySelectorAll("#itemRows tr").forEach(row => {
    const qty = Number(row.querySelector(".qty").value) || 0;
    const price = Number(row.querySelector(".price").value) || 0;
    const amount = qty * price;

    row.querySelector(".amount-cell").innerText = formatMoney(amount);
    subtotal += amount;
  });

  const discountPercent = Number(document.getElementById("discount").value) || 0;
  const taxPercent = Number(document.getElementById("tax").value) || 0;

  const discountAmount = subtotal * (discountPercent / 100);
  const taxableBase = subtotal - discountAmount;
  const taxAmount = taxableBase * (taxPercent / 100);
  const total = taxableBase + taxAmount;
  const balance = Math.max(total - currentAmountPaid, 0);

  document.getElementById("subtotal").innerText = formatMoney(subtotal);
  document.getElementById("total").innerText = formatMoney(total);
  document.getElementById("amountPaidDisplay").innerText = formatMoney(currentAmountPaid);
  document.getElementById("balanceDisplay").innerText = formatMoney(balance);

  return {
    subtotal,
    discountPercent,
    discountAmount,
    taxPercent,
    taxAmount,
    total,
    amountPaid: currentAmountPaid,
    balance
  };
}

function collectItems() {
  const items = [];

  document.querySelectorAll("#itemRows tr").forEach(row => {
    const description = row.querySelector(".desc").value.trim();
    const qty = Number(row.querySelector(".qty").value) || 0;
    const price = Number(row.querySelector(".price").value) || 0;
    const amount = qty * price;

    if (description && qty > 0 && price > 0) {
      items.push({
        description,
        qty,
        price,
        amount
      });
    }
  });

  return items;
}

function validateInvoice(items) {
  const client = document.getElementById("clientName").value.trim();
  const date = document.getElementById("date").value;
  const dueDate = document.getElementById("dueDate").value;

  if (!client) {
    alert("Please enter the client name.");
    return false;
  }

  if (!date) {
    alert("Please select the invoice date.");
    return false;
  }

  if (!dueDate) {
    alert("Please select the due date.");
    return false;
  }

  if (items.length === 0) {
    alert("Please add at least one valid invoice item.");
    return false;
  }

  return true;
}

function getInvoiceData() {
  const selectedBusiness = document.getElementById("businessSelect").value;
  const biz = businesses[selectedBusiness];
  const items = collectItems();
  const totals = calculate();

  return {
    type: "invoice",
    invoiceId: currentInvoiceId,
    business: biz.name,
    businessKey: selectedBusiness,
    businessPrefix: biz.prefix,
    client: document.getElementById("clientName").value.trim(),
    clientPhone: document.getElementById("clientPhone").value.trim(),
    clientEmail: document.getElementById("clientEmail").value.trim(),
    clientAddress: document.getElementById("clientAddress").value.trim(),
    date: document.getElementById("date").value,
    dueDate: document.getElementById("dueDate").value,
    subtotal: totals.subtotal,
    discountPercent: totals.discountPercent,
    discountAmount: totals.discountAmount,
    taxPercent: totals.taxPercent,
    taxAmount: totals.taxAmount,
    total: totals.total,
    amountPaid: totals.amountPaid,
    balance: totals.balance,
    paymentStatus: currentPaymentStatus,
    notes: document.getElementById("notes").value.trim(),
    items: items
  };
}

async function postToScript(payload) {
  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return await response.json();
}

async function saveInvoice() {
  if (invoiceSaved || loadedInvoiceMode) {
    alert("This invoice has already been saved. Clear the form to create a new invoice.");
    return;
  }

  const invoiceData = getInvoiceData();

  if (!validateInvoice(invoiceData.items)) return;

  try {
    const result = await postToScript(invoiceData);

    if (result.status !== "success") {
      throw new Error(result.message || "Failed to save invoice.");
    }

    currentInvoiceId = result.invoiceId;
    document.getElementById("invoiceNumber").value = currentInvoiceId;

    invoiceSaved = true;

    alert("Invoice saved successfully. Invoice Number: " + currentInvoiceId);

  } catch (error) {
    console.error(error);
    alert("There was an error saving the invoice. Check your Apps Script deployment and Google Sheet tabs.");
  }
}

function openPaymentModal() {
  const invoiceData = getInvoiceData();

  if (!validateInvoice(invoiceData.items)) return;

  if (!invoiceSaved || !currentInvoiceId) {
    alert("Please save the invoice first. The official invoice number is generated when the invoice is saved.");
    return;
  }

  const total = calculate().balance;
  document.getElementById("amountPaid").value = total.toFixed(2);
  document.getElementById("paymentDate").value = new Date().toISOString().split("T")[0];

  document.getElementById("paymentModal").classList.add("show");
}

function closePaymentModal() {
  document.getElementById("paymentModal").classList.remove("show");
}

function updatePaymentStatus(status) {
  currentPaymentStatus = status;

  const pill = document.getElementById("paymentStatus");
  pill.innerText = status.toUpperCase();

  pill.classList.remove("paid", "unpaid", "partial");

  if (status === "Paid") {
    pill.classList.add("paid");
  } else if (status === "Partial") {
    pill.classList.add("partial");
  } else {
    pill.classList.add("unpaid");
  }
}

async function confirmPaymentAndGenerateReceipt() {
  const invoiceData = getInvoiceData();

  if (!validateInvoice(invoiceData.items)) return;

  if (!invoiceSaved || !currentInvoiceId) {
    alert("Please save the invoice before generating a receipt.");
    return;
  }

  const selectedBusiness = document.getElementById("businessSelect").value;
  const biz = businesses[selectedBusiness];

  const paymentDate = document.getElementById("paymentDate").value;
  const amountPaidInput = Number(document.getElementById("amountPaid").value) || 0;
  const paymentMethod = document.getElementById("paymentMethod").value;
  const receivedBy = document.getElementById("receivedBy").value.trim();
  const paymentNote = document.getElementById("paymentNote").value.trim();

  if (!paymentDate) {
    alert("Please select payment date.");
    return;
  }

  if (amountPaidInput <= 0) {
    alert("Please enter a valid amount paid.");
    return;
  }

  if (!receivedBy) {
    alert("Please enter the name of the person that received the payment.");
    return;
  }

  const totals = calculate();
  const newAmountPaid = currentAmountPaid + amountPaidInput;
  const newBalance = Math.max(totals.total - newAmountPaid, 0);

  let newStatus = "Partial";

  if (newAmountPaid >= totals.total) {
    newStatus = "Paid";
  }

  const receiptData = {
    type: "receipt",
    invoiceId: currentInvoiceId,
    business: biz.name,
    businessKey: selectedBusiness,
    businessPrefix: biz.prefix,
    client: invoiceData.client,
    clientPhone: invoiceData.clientPhone,
    clientEmail: invoiceData.clientEmail,
    paymentDate,
    amountPaid: amountPaidInput,
    totalInvoiceAmount: totals.total,
    totalAmountPaid: newAmountPaid,
    balance: newBalance,
    paymentMethod,
    paymentStatus: newStatus,
    receivedBy,
    paymentNote
  };

  try {
    const result = await postToScript(receiptData);

    if (result.status !== "success") {
      throw new Error(result.message || "Failed to save receipt.");
    }

    receiptData.receiptNumber = result.receiptNumber;

    currentAmountPaid = newAmountPaid;
    updatePaymentStatus(newStatus);
    calculate();

    closePaymentModal();

    alert("Receipt generated successfully. Receipt Number: " + receiptData.receiptNumber);

    printReceipt(receiptData);

  } catch (error) {
    console.error(error);
    alert("There was an error generating the receipt.");
  }
}

function printReceipt(receipt) {
  const receiptWindow = window.open("", "_blank");

  receiptWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Receipt ${receipt.receiptNumber}</title>

      <style>
        * { box-sizing: border-box; }

        body {
          margin: 0;
          padding: 35px;
          background: #eef2f7;
          font-family: Arial, Helvetica, sans-serif;
          color: #1f2937;
        }

        .receipt {
          max-width: 780px;
          margin: auto;
          background: #fff;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 15px 40px rgba(0,0,0,0.08);
        }

        .top {
          height: 18px;
          background: linear-gradient(90deg, #f5b400 0%, #f5b400 30%, #071d49 30%, #071d49 100%);
        }

        .content { padding: 38px; }

        .header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-start;
          margin-bottom: 30px;
        }

        .logo {
          width: 70px;
          height: 70px;
          border-radius: 14px;
          background: #071d49;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 22px;
          border-bottom: 6px solid #f5b400;
        }

        .brand {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        h1 {
          margin: 0;
          color: #071d49;
          letter-spacing: 2px;
        }

        .paid {
          display: inline-block;
          padding: 9px 18px;
          border-radius: 30px;
          background: #dcfce7;
          color: #166534;
          font-weight: 900;
          letter-spacing: 1px;
          margin-top: 8px;
        }

        .partial {
          display: inline-block;
          padding: 9px 18px;
          border-radius: 30px;
          background: #fef3c7;
          color: #92400e;
          font-weight: 900;
          letter-spacing: 1px;
          margin-top: 8px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 14px 0;
          border-bottom: 1px solid #d9dce5;
        }

        .row strong { color: #071d49; }

        .amount-box {
          margin-top: 28px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-radius: 14px;
          overflow: hidden;
        }

        .amount-title {
          background: #071d49;
          color: #fff;
          padding: 22px;
          font-size: 22px;
          font-weight: 900;
        }

        .amount-value {
          background: #f5b400;
          color: #111827;
          padding: 22px;
          font-size: 24px;
          font-weight: 900;
          text-align: right;
        }

        .footer {
          margin-top: 35px;
          padding-top: 20px;
          border-top: 1px solid #d9dce5;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.6;
        }

        .bottom {
          height: 18px;
          background: linear-gradient(90deg, #071d49 0%, #071d49 70%, #f5b400 70%, #f5b400 100%);
        }

        @media print {
          body {
            background: #fff;
            padding: 0;
          }

          .receipt {
            box-shadow: none;
            border-radius: 0;
          }
        }
      </style>
    </head>

    <body>
      <div class="receipt">
        <div class="top"></div>

        <div class="content">
          <div class="header">
            <div class="brand">
              <div class="logo">${businesses[receipt.businessKey].prefix}</div>
              <div>
                <h1>${receipt.business}</h1>
                <p>Official Payment Receipt</p>
              </div>
            </div>

            <div>
              <h1>RECEIPT</h1>
              <span class="${receipt.paymentStatus === "Paid" ? "paid" : "partial"}">${receipt.paymentStatus.toUpperCase()}</span>
            </div>
          </div>

          <div class="row"><strong>Receipt Number</strong><span>${receipt.receiptNumber}</span></div>
          <div class="row"><strong>Invoice Number</strong><span>${receipt.invoiceId}</span></div>
          <div class="row"><strong>Received From</strong><span>${receipt.client}</span></div>
          <div class="row"><strong>Payment Date</strong><span>${receipt.paymentDate}</span></div>
          <div class="row"><strong>Payment Method</strong><span>${receipt.paymentMethod}</span></div>
          <div class="row"><strong>Received By</strong><span>${receipt.receivedBy}</span></div>
          <div class="row"><strong>Total Invoice Amount</strong><span>NGN ${formatMoney(receipt.totalInvoiceAmount)}</span></div>
          <div class="row"><strong>Total Amount Paid</strong><span>NGN ${formatMoney(receipt.totalAmountPaid)}</span></div>
          <div class="row"><strong>Balance</strong><span>NGN ${formatMoney(receipt.balance)}</span></div>

          <div class="amount-box">
            <div class="amount-title">AMOUNT RECEIVED</div>
            <div class="amount-value">NGN ${formatMoney(receipt.amountPaid)}</div>
          </div>

          <div class="footer">
            This receipt confirms that payment has been received for the invoice stated above.
            <br />
            ${receipt.paymentNote ? "Note: " + receipt.paymentNote : ""}
          </div>
        </div>

        <div class="bottom"></div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);

  receiptWindow.document.close();
}


async function loadOldInvoice() {
  const invoiceId = document.getElementById("searchInvoiceId").value.trim();

  if (!invoiceId) {
    alert("Please enter an invoice number to load.");
    return;
  }

  try {
    const url = `${SCRIPT_URL}?action=getInvoice&invoiceId=${encodeURIComponent(invoiceId)}`;
    const response = await fetch(url);
    const result = await response.json();

    if (result.status !== "success") {
      throw new Error(result.message || "Invoice not found.");
    }

    populateInvoiceFromSavedData(result.invoice, result.items || []);
    alert("Invoice loaded successfully.");

  } catch (error) {
    console.error(error);
    alert("Could not load invoice. Please check the invoice number and try again.");
  }
}

function populateInvoiceFromSavedData(invoice, items) {
  loadedInvoiceMode = true;
  invoiceSaved = true;
  currentInvoiceId = invoice.invoiceId || "";

  const businessKey = invoice.businessKey || "skilled";
  document.getElementById("businessSelect").value = businessKey;

  const biz = businesses[businessKey] || businesses.skilled;
  document.getElementById("bizName").innerText = biz.name;
  document.getElementById("bizAddress").innerText = biz.address;
  document.getElementById("bizPhone").innerText = biz.phone;
  document.getElementById("bizTax").innerText = biz.tax;
  document.getElementById("bizCurrency").innerText = biz.currency;
  document.getElementById("bank1").innerText = biz.bank1;
  document.getElementById("bizLogo").innerText = biz.prefix;

  document.getElementById("invoiceNumber").value = invoice.invoiceId || "";
  document.getElementById("clientName").value = invoice.client || "";
  document.getElementById("clientPhone").value = invoice.clientPhone || "";
  document.getElementById("clientEmail").value = invoice.clientEmail || "";
  document.getElementById("clientAddress").value = invoice.clientAddress || "";
  document.getElementById("date").value = invoice.date || "";
  document.getElementById("dueDate").value = invoice.dueDate || "";
  document.getElementById("discount").value = Number(invoice.discountPercent) || 0;
  document.getElementById("tax").value = Number(invoice.taxPercent) || 0;
  document.getElementById("notes").value = invoice.notes || "";

  currentAmountPaid = Number(invoice.amountPaid) || 0;
  updatePaymentStatus(invoice.paymentStatus || "Unpaid");

  document.getElementById("itemRows").innerHTML = "";

  if (items.length === 0) {
    addRow();
  } else {
    items.forEach(item => addLoadedItemRow(item));
  }

  calculate();
}

function addLoadedItemRow(item) {
  const table = document.getElementById("itemRows");
  const row = table.insertRow();

  row.innerHTML = `
    <td><input class="desc" placeholder="Item description" value="${escapeHtml(item.description || "")}"></td>
    <td><input type="number" min="0" class="qty" placeholder="0" value="${Number(item.qty) || 0}"></td>
    <td><input type="number" min="0" class="price" placeholder="0.00" value="${Number(item.price) || 0}"></td>
    <td class="amount-cell">${formatMoney(Number(item.amount) || 0)}</td>
    <td class="no-print">
      <button type="button" class="remove-btn" onclick="removeRow(this)">Remove</button>
    </td>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}


function clearForm() {
  const confirmClear = confirm("Are you sure you want to clear this invoice form?");

  if (!confirmClear) return;

  document.getElementById("clientName").value = "";
  document.getElementById("clientPhone").value = "";
  document.getElementById("clientEmail").value = "";
  document.getElementById("clientAddress").value = "";
  document.getElementById("discount").value = 0;
  document.getElementById("tax").value = 0;
  document.getElementById("notes").value = "";
  document.getElementById("receivedBy").value = "";
  document.getElementById("paymentNote").value = "";
  document.getElementById("invoiceNumber").value = "Auto-generated on save";

  currentAmountPaid = 0;
  invoiceSaved = false;
  loadedInvoiceMode = false;
  currentInvoiceId = "";

  setTodayDates();
  resetItems();
  loadBusiness();
  updatePaymentStatus("Unpaid");
}
