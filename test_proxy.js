async function check() {
  const url = "https://virgin-rays-entered-fallen.trycloudflare.com/apps/quantity-break?type=fixed-bundle&productId=15053644792176&shop=virgin-rays-entered-fallen.trycloudflare.com";
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch(e) {
    console.log("Error:", e.message);
  }
}
check();
