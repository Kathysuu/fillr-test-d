"use strict";
// ** Write your module here **
// It must send an event "order_details" from the page containing an Order object,
// which describes all the relevant data points on the page.
// The order_details data you are sending should match the `expected_output` object in `test.js`

// 1. Look at test and see what shape of data we need
// 2. Found iframe includes a lot of info we need
// 3. Extract those info in lists -> product object done
// 4. Shipping -> extract text from header to know if it's free (should use regex to extract numeric item)
// 5. Payment Type -> it's inside the image, we need to find keyword "Ending in" first then find img and get alt from img
// 6. Tax is GrandTotal - Subtotal - (SHIPPING)

module.exports = function extract_order() {
  try {
    const iframe = document.querySelector('iframe[src*="tapframe"')
    if(!iframe){
      throw new Error("Order iframe not found.")
    }

    const params = new URL(iframe.src).searchParams
    const quantityList = (params.get("item_quantities") ?? "").split(',').map(n => parseInt(n, 10) ?? 0)
    const priceList = (params.get('item_prices') ?? "").split(',').map(p => parseFloat(p) ?? 0)
    const orderId = params.get("order_id") ?? ""
    const grandTotal = params.get("cart_total") ?? "0"
    const subtotal = params.get("subtotal") ?? "0"
    
    const itemImgs = document.querySelectorAll('div[data-testid="collapsedItemList"] ul li img')
    if(!itemImgs.length){
      throw new Error("No product name found.")
    }
    const names = Array.from(itemImgs).map(item => item.alt.trim() ?? "Unknown")

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
    const shippingText = shippingHeader.textContent.trim() ?? ""
    const extractedShippingFee = shippingText.match(/\$([\d.]+)/)
    const shippingFee = extractedShippingFee ? extractedShippingFee[1] : "0"

    const endingDiv = Array.from(document.querySelectorAll('div.b')).find(div => div.textContent.trim().includes('Ending in'));
    const paymentImg = endingDiv.parentElement.querySelector('img');
    const paymentType = paymentImg ? paymentImg.alt : ""
    
    const tax = (parseFloat(grandTotal)-parseFloat(subtotal)-parseFloat(shippingFee)).toFixed(2)

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
