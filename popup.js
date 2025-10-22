chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.scripting.executeScript(
    {
      target: { tabId: tabs[0].id },
      func: analyzePageSecurity
    },
    (results) => {
      const list = document.getElementById("issues");
      if (!results || !results[0] || !results[0].result) {
        list.innerHTML = "<li class='warning'>Unable to scan page.</li>";
        return;
      }

      const issues = results[0].result;
      list.innerHTML = "";
      issues.forEach((i) => {
        const item = document.createElement("li");
        item.textContent = i.text;
        item.className = i.safe ? "safe" : "warning";
        list.appendChild(item);
      });
    }
  );
});

function analyzePageSecurity() {
  const results = [];

  // 1️⃣ HTTPS check
  if (location.protocol !== "https:") {
    results.push({ text: "⚠️ Site not using HTTPS", safe: false });
  } else {
    results.push({ text: "✅ Secure HTTPS connection", safe: true });
  }

  // 2️⃣ Forms check
  document.querySelectorAll("form").forEach((form, idx) => {
    if (form.action && !form.action.startsWith("https")) {
      results.push({ text: `⚠️ Form #${idx + 1} posts over HTTP`, safe: false });
    }
    if (form.querySelector('input[type="password"]') && form.autocomplete !== "off") {
      results.push({ text: "⚠️ Password field with autocomplete enabled", safe: false });
    }
  });

  // 3️⃣ Inline scripts
  const inlineScripts = document.querySelectorAll("script:not([src])").length;
  if (inlineScripts > 0) {
    results.push({ text: `⚠️ ${inlineScripts} inline script(s) detected`, safe: false });
  }

  // 4️⃣ Mixed content
  const mixed = [...document.querySelectorAll("img, script, link, iframe")]
    .some(el => el.src?.startsWith("http:"));
  if (mixed) {
    results.push({ text: "⚠️ Mixed content detected (HTTP resources on HTTPS site)", safe: false });
  }

  // 5️⃣ If all good
  if (results.filter(r => !r.safe).length === 0) {
    results.push({ text: "✅ No obvious security issues found", safe: true });
  }

  return results;
}
