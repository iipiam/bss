function c(t){let e=t.replace(/\D/g,"");return e.startsWith("00")?(e=e.substring(2),`+${e}`):e.startsWith("966")?`+${e}`:e.startsWith("0")?`+966${e.substring(1)}`:e.length===9||e.length===10?`+966${e}`:`+${e}`}function l(t){const{invoiceNumber:e,total:n,paymentMethod:r,invoiceUrl:o,restaurantName:a="Restaurant",customerName:s}=t,i=s?`Hello ${s}, here is your invoice. Thank you! | مرحباً ${s}، إليك فاتورتك. شكراً لك!`:"Thank you for your business! | شكراً لتعاملكم معنا";return`
*${a}*
Invoice | فاتورة

${i}

*Invoice Number | رقم الفاتورة:*
${e}

*Total | الإجمالي:*
${n} SAR (including 15% VAT | شامل ضريبة القيمة المضافة 15%)

*Payment | الدفع:*
${r}

*Download Invoice | تحميل الفاتورة:*
${o}

ZATCA Compliant E-Invoice
فاتورة إلكترونية متوافقة مع هيئة الزكاة والضريبة والجمارك
`.trim()}function p(t,e){try{const n=c(t),r=encodeURIComponent(e),o=`https://wa.me/${n.replace("+","")}?text=${r}`;return window.open(o,"_blank")!==null}catch(n){return console.error("Failed to open WhatsApp:",n),!1}}function h(t){if(!t||t.trim()==="")return!1;const e=t.replace(/\D/g,"");return e.length>=9&&e.length<=15}export{l as createWhatsAppInvoiceMessage,c as formatPhoneForWhatsApp,h as isValidWhatsAppPhone,p as openWhatsAppWithMessage};
