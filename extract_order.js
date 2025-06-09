"use strict";
// ** Write your module here **
// It must send an event "order_details" from the page containing an Order object,
// which describes all the relevant data points on the page.
// The order_details data you are sending should match the `expected_output` object in `test.js`

module.exports = function extract_order() {
  try {
    const iframe = document.querySelector('iframe[src*="tapframe"')
    const params = new URL(iframe.src).searchParams
    const quantityList = params.get("item_quantities").split(',')
    const priceList = params.get('item_prices').split(',').map(p => parseFloat(p))
    const orderId = params.get("order_id")
    const grandTotal = params.get("cart_total")
    const subtotal = params.get("subtotal")
    
    const itemImgs = document.querySelectorAll('div[data-testid="collapsedItemList"] ul li img')
    const names = Array.from(itemImgs).map(item => item.alt.trim())

    const products = names.map((name, i) => {
      const unitPrice = priceList[i]
      const quantity = quantityList[i]
      const lineTotal = (unitPrice * quantity).toFixed(2)
      
      return {
        "Product Name": name,
        "Unit Price": unitPrice.toFixed(2),
        Quantity: quantity.toString(),
        "Line Total": lineTotal.toString(),
      }
    })
    
    const shippingHeader = document.querySelector('#shipping-card-header h2');
    const shippingFee = shippingHeader.textContent.trim().toLowerCase().includes("free") ? "0" : ""

    const endingDiv = Array.from(document.querySelectorAll('div.b')).find(div => div.textContent.trim().includes('Ending in'));
    const paymentImg = endingDiv.parentElement.querySelector('img');
    const paymentType = paymentImg ? paymentImg.alt : ""
    
    const tax = (parseFloat(grandTotal)-parseFloat(subtotal)).toFixed(2)

    const order = {
      "Order Number": orderId,
      Products: products,
      Shipping: shippingFee,
      Subtotal: subtotal,
      "Grand Total": grandTotal,
      Tax: tax.toString(),
      "Payment Type": paymentType
    }

    document.dispatchEvent(new CustomEvent("order_details", {
      detail: order
    }))
  } catch (e) {
    console.error(e);
  }
};
