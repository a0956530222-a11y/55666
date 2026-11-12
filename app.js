// 報修登記：新增表單與最近 20 筆清單。
(function () {
  "use strict";

  var LIST_LIMIT = 20;
  var CATEGORIES = ["設備", "網路", "環境", "其他"];
  var URGENCIES = ["低", "中", "高"];

  var form = document.getElementById("request-form");
  var submitButton = document.getElementById("submit-button");
  var formMessage = document.getElementById("form-message");
  var list = document.getElementById("request-list");
  var listMessage = document.getElementById("list-message");
  var refreshButton = document.getElementById("refresh-button");

  function showMessage(el, text, kind) {
    el.textContent = text;
    el.className = "message " + kind;
    el.hidden = false;
  }

  function hideMessage(el) {
    el.hidden = true;
    el.textContent = "";
  }

  // 建立 Supabase 連線；設定或函式庫缺少時直接顯示錯誤。
  var config = window.APP_CONFIG || {};
  var client = null;
  if (!window.supabase || !window.supabase.createClient) {
    showMessage(formMessage, "無法載入 Supabase 函式庫，請檢查網路後重新整理頁面。", "error");
  } else if (!config.supabaseUrl || !config.supabaseKey) {
    showMessage(formMessage, "缺少 Supabase 設定，請檢查 config.js。", "error");
  } else {
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  function formatTime(value) {
    var d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("zh-TW", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    // 一律用 textContent，避免使用者輸入的內容被當成 HTML 執行。
    if (text != null) node.textContent = text;
    return node;
  }

  function renderList(rows) {
    list.replaceChildren();
    if (!rows.length) {
      showMessage(listMessage, "目前還沒有報修資料。", "info");
      return;
    }
    hideMessage(listMessage);
    rows.forEach(function (row) {
      var item = el("li", "request-item");
      var top = el("div", "request-top");
      top.appendChild(el("span", "tag", row.category));
      top.appendChild(el("span", "tag urgency-" + row.urgency, "緊急：" + row.urgency));
      top.appendChild(el("span", "tag", row.status));
      item.appendChild(top);
      item.appendChild(el("p", "request-desc", row.description));
      item.appendChild(el("p", "request-meta",
        row.reporter_name + "｜" + row.location + "｜" + formatTime(row.created_at)));
      list.appendChild(item);
    });
  }

  async function loadList() {
    if (!client) return;
    refreshButton.disabled = true;
    showMessage(listMessage, "載入中…", "info");
    try {
      var result = await client
        .from("repair_requests")
        .select("id, created_at, reporter_name, location, category, description, urgency, status")
        .order("created_at", { ascending: false })
        .limit(LIST_LIMIT);
      if (result.error) throw result.error;
      renderList(result.data || []);
    } catch (err) {
      list.replaceChildren();
      showMessage(listMessage, "清單載入失敗：" + (err.message || err), "error");
    } finally {
      refreshButton.disabled = false;
    }
  }

  // 檢查欄位；回傳要送出的資料，或在有錯誤時回傳 null。
  function collect() {
    var data = {
      reporter_name: form.elements.reporter_name.value.trim(),
      location: form.elements.location.value.trim(),
      category: form.elements.category.value,
      description: form.elements.description.value.trim(),
      urgency: (form.querySelector('input[name="urgency"]:checked') || {}).value,
    };
    var errors = [];
    function check(name, ok, label) {
      var field = form.elements[name].closest(".field");
      if (field) field.classList.toggle("invalid", !ok);
      if (!ok) errors.push(label);
    }
    check("reporter_name", data.reporter_name.length >= 1 && data.reporter_name.length <= 50, "報修人（1～50 字）");
    check("location", data.location.length >= 1 && data.location.length <= 100, "地點或部門（1～100 字）");
    check("category", CATEGORIES.indexOf(data.category) !== -1, "類別");
    check("description", data.description.length >= 1 && data.description.length <= 1000, "問題說明（1～1000 字）");
    if (URGENCIES.indexOf(data.urgency) === -1) errors.push("緊急程度");

    if (errors.length) {
      showMessage(formMessage, "請確認：" + errors.join("、"), "error");
      return null;
    }
    return data;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!client) return;
    var data = collect();
    if (!data) return;

    submitButton.disabled = true;
    submitButton.textContent = "送出中…";
    hideMessage(formMessage);
    try {
      // 不送 status、id、created_at，由資料庫自動產生。
      var result = await client.from("repair_requests").insert(data);
      if (result.error) throw result.error;
      form.reset();
      showMessage(formMessage, "已送出報修，謝謝！", "ok");
      await loadList();
    } catch (err) {
      showMessage(formMessage, "送出失敗：" + (err.message || err), "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "送出報修";
    }
  });

  refreshButton.addEventListener("click", loadList);
  loadList();
})();
