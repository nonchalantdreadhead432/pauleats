// Payment handles are just display info, not sensitive — fine to keep in a JSON file.
let PAYMENT_HANDLES = {
  cashapp: "$FireOrderNJ",
  applepay: "(551) 555-0134",
  paypal: "paypal.me/fireordernj",
  zelle: "pay@fireorder.app"
};

fetch("orders.json")
  .then(r => r.json())
  .then(data => { if (data.paymentHandles) PAYMENT_HANDLES = data.paymentHandles; })
  .catch(() => { /* fallback values above still work */ });

// ---- Elements ----
const form = document.getElementById("order-form");
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("screenshot-input");
const preview = document.getElementById("preview");
const payGrid = document.getElementById("pay-grid");
const sendBtn = document.getElementById("send-btn");
const confirmCard = document.getElementById("confirm-card");
const confirmHandle = document.getElementById("confirm-handle");
const confirmId = document.getElementById("confirm-id");

let screenshotFile = null;
let selectedMethod = null;

// ---- Screenshot upload ----
dropzone.addEventListener("click", () => fileInput.click());
["dragover", "dragenter"].forEach(evt =>
  dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.add("drag"); })
);
["dragleave", "drop"].forEach(evt =>
  dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.remove("drag"); })
);
dropzone.addEventListener("drop", e => {
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", e => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

function handleFile(file) {
  if (!file.type.startsWith("image/")) return;
  screenshotFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.style.display = "block";
    clearError("err-screenshot");
  };
  reader.readAsDataURL(file);
}

// ---- Payment selection ----
payGrid.addEventListener("click", e => {
  const opt = e.target.closest(".pay-option");
  if (!opt) return;
  [...payGrid.children].forEach(c => c.classList.remove("selected"));
  opt.classList.add("selected");
  selectedMethod = opt.dataset.method;
  clearError("err-payment");
});

// ---- Helpers ----
function showError(id) { document.getElementById(id).style.display = "block"; }
function clearError(id) { document.getElementById(id).style.display = "none"; }

async function uploadScreenshot(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from("screenshots")
    .upload(path, file);

  if (uploadError) throw uploadError;

  const { data } = supabaseClient.storage.from("screenshots").getPublicUrl(path);
  return data.publicUrl;
}

// ---- Submit ----
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const notes = document.getElementById("notes").value.trim();

  let valid = true;
  if (!screenshotFile) { showError("err-screenshot"); valid = false; } else clearError("err-screenshot");
  if (!name) { showError("err-name"); valid = false; } else clearError("err-name");
  if (!phone) { showError("err-phone"); valid = false; } else clearError("err-phone");
  if (!address) { showError("err-address"); valid = false; } else clearError("err-address");
  if (!selectedMethod) { showError("err-payment"); valid = false; } else clearError("err-payment");

  if (!valid) return;

  sendBtn.disabled = true;
  sendBtn.textContent = "SENDING…";

  try {
    const screenshotUrl = await uploadScreenshot(screenshotFile);

    const { data, error } = await supabaseClient
      .from("orders")
      .insert({
        name, phone, address, notes,
        payment_method: selectedMethod,
        screenshot_url: screenshotUrl,
        status: "new"
      })
      .select()
      .single();

    if (error) throw error;

    form.style.display = "none";
    confirmHandle.textContent = PAYMENT_HANDLES[selectedMethod] || "—";
    confirmId.textContent = `FO-${1041 + data.id}`;
    confirmCard.style.display = "block";
    confirmCard.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (err) {
    console.error(err);
    sendBtn.disabled = false;
    sendBtn.textContent = "SEND ORDER";
    alert("Something went wrong sending your order — check your connection and try again.");
  }
});
