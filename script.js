
const form = document.getElementById("listingForm");
const generateBtn = document.getElementById("generateBtn");
const statusEl = document.getElementById("status");
const readyBadge = document.getElementById("readyBadge");

const outputs = {
  title: document.getElementById("outTitle"),
  description: document.getElementById("outDescription"),
  caption: document.getElementById("outCaption")
};

let currentListing = null;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#c03954" : "";
}

function setOutput(element, text) {
  element.textContent = text || "";
  element.classList.toggle("placeholder", !text);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const product = {
    productName: String(data.get("productName") || "").trim(),
    category: String(data.get("category") || "Other"),
    price: String(data.get("price") || "").trim(),
    features: String(data.get("features") || "").trim(),
    tone: String(data.get("tone") || "Friendly and warm"),
    language: String(data.get("language") || "English")
  };

  if (!product.productName || !product.features) {
    setStatus("Enter the product name and features.", true);
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = "Generating with local AI...";
  readyBadge.textContent = "GENERATING";
  readyBadge.classList.remove("ready");
  setStatus("Connecting to Ollama...");

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Generation failed.");
    }

    currentListing = {
      ...product,
      title: result.title,
      description: result.description,
      caption: result.caption
    };

    setOutput(outputs.title, currentListing.title);
    setOutput(outputs.description, currentListing.description);
    setOutput(outputs.caption, currentListing.caption);

    readyBadge.textContent = "CONTENT READY";
    readyBadge.classList.add("ready");
    setStatus("Done! Review the details before publishing.");
  } catch (error) {
    setStatus(error.message || "Could not connect to local AI.", true);
    readyBadge.textContent = "AI NOT CONNECTED";
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "✦ Generate my listing →";
  }
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = currentListing?.[button.dataset.copy];

    if (!value) {
      setStatus("Generate a listing before copying.", true);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      button.textContent = "Copied!";
      setTimeout(() => button.textContent = "Copy", 1200);
    } catch {
      setStatus("Copy was blocked. Select and copy the text manually.", true);
    }
  });
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  if (!currentListing) {
    setStatus("Generate a listing before downloading.", true);
    return;
  }

  const content =
    `PRODUCT TITLE\n${currentListing.title}\n\n` +
    `PRODUCT DESCRIPTION\n${currentListing.description}\n\n` +
    `SOCIAL CAPTION\n${currentListing.caption}`;

  const url = URL.createObjectURL(
    new Blob([content], { type: "text/plain;charset=utf-8" })
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = "dukaanai-listing.txt";
  link.click();
  URL.revokeObjectURL(url);
  setStatus("Download started.");
});

document.getElementById("saveBtn").addEventListener("click", () => {
  if (!currentListing) {
    setStatus("Generate a listing before saving.", true);
    return;
  }

  try {
    const saved = JSON.parse(
      localStorage.getItem("dukaanaiListings") || "[]"
    );

    saved.unshift(currentListing);
    localStorage.setItem(
      "dukaanaiListings",
      JSON.stringify(saved.slice(0, 20))
    );

    setStatus("Saved in this browser on this device.");
  } catch {
    setStatus("Could not save. Check browser storage settings.", true);
  }
});
