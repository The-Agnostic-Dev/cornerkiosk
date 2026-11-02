// Small progressive enhancements; every page works without JavaScript.
document.querySelectorAll("form[data-confirm]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    if (!window.confirm(form.dataset.confirm)) event.preventDefault();
  });
});

document.querySelectorAll('input[name="deliveryMethod"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const address = document.querySelector('textarea[name="address"]');
    if (address) address.closest("label").hidden = radio.value === "collect" && radio.checked;
  });
});

const checkout = document.getElementById("checkout-form");
if (checkout) {
  const status = document.getElementById("checkout-status");
  const errorBox = document.getElementById("checkout-error");

  checkout.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.hidden = false;
    errorBox.hidden = true;
    try {
      const res = await fetch(checkout.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new URLSearchParams(new FormData(checkout)),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.assign(data.redirect);
        return;
      }
      const details = Object.values(data.fields ?? {});
      errorBox.textContent = details.length ? `${data.error} ${details.join(" ")}` : data.error;
      errorBox.hidden = false;
    } catch {
      errorBox.textContent = "We couldn't reach the shop. Please check your connection and try again.";
      errorBox.hidden = false;
    }
    status.hidden = true;
  });
}
