// Formulir menggunakan Supabase REST API agar website tetap bisa di-host di GitHub Pages.
const supabaseConfig = window.TEMANKENCAN_SUPABASE;
const orderForm = document.querySelector("[data-order-form]");
const orderFeedback = document.querySelector("[data-order-feedback]");
const submitButton = orderForm?.querySelector('[type="submit"]');

function isSupabaseConfigured() {
  return supabaseConfig
    && /^https:\/\/[^/]+\.supabase\.co\/?$/.test(supabaseConfig.url)
    && supabaseConfig.anonKey
    && !supabaseConfig.anonKey.includes("YOUR_");
}

function showOrderFeedback(message, type) {
  orderFeedback.textContent = message;
  orderFeedback.className = `form-feedback form-feedback-${type}`;
}

if (orderForm && orderFeedback && submitButton) {
  if (!isSupabaseConfigured()) {
    submitButton.disabled = true;
    showOrderFeedback("Pemesanan belum aktif. Admin perlu mengisi konfigurasi Supabase terlebih dahulu.", "error");
  } else {
    orderForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      showOrderFeedback("", "");

      const formData = new FormData(orderForm);
      // Kolom perangkap membantu menolak bot sederhana tanpa mengganggu pengguna.
      if (formData.get("website")) {
        showOrderFeedback("Terima kasih. Pesananmu sudah kami terima.", "success");
        orderForm.reset();
        return;
      }

      submitButton.disabled = true;
      submitButton.dataset.originalLabel = submitButton.innerHTML;
      submitButton.textContent = "Mengirim...";

      try {
        const response = await fetch(`${supabaseConfig.url.replace(/\/$/, "")}/rest/v1/orders`, {
          method: "POST",
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            customer_name: formData.get("nama").trim(),
            email: formData.get("email").trim(),
            package: formData.get("paket"),
            notes: formData.get("cerita").trim() || null
          })
        });

        if (!response.ok) {
          throw new Error(`Supabase menolak pesanan (HTTP ${response.status}).`);
        }

        orderForm.reset();
        showOrderFeedback("Pesanan terkirim. Kami akan menghubungimu melalui email.", "success");
      } catch (error) {
        console.error("Gagal menyimpan pesanan:", error);
        showOrderFeedback("Pesanan belum terkirim. Periksa koneksi internet atau hubungi admin.", "error");
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = submitButton.dataset.originalLabel;
      }
    });
  }
}
