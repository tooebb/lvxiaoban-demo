const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const state = {
  people: 2,
  budget: 3600,
  spend: 2980,
  activeDay: 0,
  optimized: new Set(),
  styles: new Set(["人文漫游", "洱海骑行"]),
  needs: new Set(["少走路"]),
};

const baseDays = [
  [
    { time: "09:30", icon: "城", place: "大理古城南门", detail: "错峰入城 · 城墙远眺", badge: "人流舒适" },
    { time: "12:10", icon: "味", place: "人民路白族餐桌", detail: "酸辣鱼与乳扇 · 预留 80 分钟", badge: "在地美食" },
    { time: "15:00", icon: "院", place: "床单厂艺术区", detail: "独立小店 · 慢逛拍照", badge: "轻松步行" },
  ],
  [
    { time: "09:00", icon: "骑", place: "洱海生态廊道", detail: "阳南溪至龙龛 · 骑行 12km", badge: "湖景路线" },
    { time: "13:30", icon: "村", place: "磻溪 S 弯", detail: "避开正午人流 · 海边午茶", badge: "错峰安排" },
    { time: "17:10", icon: "光", place: "才村码头", detail: "日落前 40 分钟抵达", badge: "最佳光线" },
  ],
  [
    { time: "09:40", icon: "稻", place: "喜洲古镇", detail: "稻田慢行 · 白族建筑", badge: "人文漫游" },
    { time: "11:30", icon: "味", place: "喜洲粑粑体验", detail: "本地师傅带做 · 约 60 分钟", badge: "非遗体验" },
    { time: "15:20", icon: "茶", place: "周城扎染小院", detail: "蓝染手作 · 成品可带走", badge: "文化体验" },
  ],
];

let days = structuredClone(baseDays);

function formatMoney(value) {
  return `¥${Number(value).toLocaleString("zh-CN")}`;
}

function showToast(message) {
  const toast = qs("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function renderRoute() {
  const list = qs("#routeList");
  list.innerHTML = days[state.activeDay]
    .map(
      (item) => `
        <article class="route-item">
          <time class="route-time">${item.time}</time>
          <div class="route-place">
            <span class="place-icon">${item.icon}</span>
            <div><strong>${item.place}</strong><small>${item.detail}</small></div>
          </div>
          <span class="route-badge">${item.badge}</span>
        </article>`,
    )
    .join("");
}

function updateBudget() {
  const percent = Math.min(100, Math.round((state.spend / state.budget) * 100));
  const remaining = state.budget - state.spend;
  qs("#ringPercent").textContent = `${percent}%`;
  qs("#budgetRing").style.setProperty("--ring", `${percent}%`);
  qs("#estimatedSpend").textContent = formatMoney(state.spend);
  qs("#budgetTip").textContent =
    remaining >= 0
      ? `预算内还留有 ${formatMoney(remaining)}，可作为临时交通与伴手礼储备。`
      : `当前方案超出预算 ${formatMoney(Math.abs(remaining))}，建议切换一晚经济型住宿。`;
}

function setChoiceGroup(containerId, targetSet) {
  qsa("button", qs(containerId)).forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset.choice;
      if (targetSet.has(value)) targetSet.delete(value);
      else targetSet.add(value);
      button.classList.toggle("active");
      button.setAttribute("aria-pressed", button.classList.contains("active"));
    });
  });
}

function getDateLabel() {
  const start = new Date(`${qs("#startDate").value}T00:00:00`);
  const end = new Date(`${qs("#endDate").value}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  const diff = Math.round((end - start) / 86400000) + 1;
  const label = `${String(start.getMonth() + 1).padStart(2, "0")}.${String(start.getDate()).padStart(2, "0")} — ${String(end.getMonth() + 1).padStart(2, "0")}.${String(end.getDate()).padStart(2, "0")}`;
  return { diff, label };
}

function generatePlan() {
  const date = getDateLabel();
  if (!date) {
    showToast("请检查出发和返程日期");
    return;
  }
  if (state.styles.size === 0) {
    showToast("至少选择一种旅行偏好");
    return;
  }

  const button = qs("#generatePlan");
  button.classList.add("loading");
  button.disabled = true;

  window.setTimeout(() => {
    days = structuredClone(baseDays);
    state.optimized.clear();
    qsa("[data-optimize]").forEach((item) => item.classList.remove("applied"));
    state.spend = Math.min(state.budget - 260, 2980 + Math.max(0, state.people - 2) * 520);
    state.spend = Math.max(1680, state.spend);
    qs("#result-title").textContent = `大理 ${Math.min(date.diff, 5)} 日${state.needs.has("少走路") ? "轻松慢游" : "自在探索"}计划`;
    qs("#resultDates").textContent = date.label;
    qs("#resultPeople").textContent = `${state.people} 人同行`;
    qs("#paceText").textContent = state.needs.has("少走路") ? "轻松 · 少走路" : "充实 · 自由探索";
    qs("#walkDistance").textContent = state.needs.has("少走路") ? "日均 4.6km" : "日均 7.3km";
    const styleText = [...state.styles].slice(0, 2).join("、");
    qs("#summaryText").textContent = `围绕${styleText}安排三段主题路线，上午尽量错峰，傍晚保留洱海最佳光线，并把总花费控制在你的预算范围内。`;
    updateBudget();
    renderRoute();
    button.classList.remove("loading");
    button.disabled = false;
    showToast("行程已生成，右侧方案已更新");
    if (window.innerWidth < 760) qs(".plan-result").scrollIntoView({ behavior: "smooth", block: "start" });
  }, 1050);
}

function optimizePlan(type, button) {
  if (state.optimized.has(type)) {
    showToast("这项优化已经应用");
    return;
  }
  state.optimized.add(type);
  button.classList.add("applied");

  if (type === "walk") {
    days[1][0] = { time: "09:30", icon: "车", place: "洱海西岸观光车", detail: "分段乘车 · 步行约 2.8km", badge: "低强度" };
    qs("#walkDistance").textContent = "日均 2.8km";
    qs("#paceText").textContent = "舒缓 · 分段乘车";
    showToast("已减少连续步行路段");
  }
  if (type === "culture") {
    days[2].splice(2, 0, { time: "14:00", icon: "纸", place: "甲马纸体验馆", detail: "白族木刻印刷 · 约 70 分钟", badge: "新增非遗" });
    state.spend += 120;
    qs("#costOther").textContent = "¥1,300";
    showToast("已加入白族甲马纸体验");
  }
  if (type === "budget") {
    state.spend -= 300;
    qs("#costHotel").textContent = "¥880";
    showToast("已切换为古城精品客栈方案");
  }
  updateBudget();
  renderRoute();
}

const assistantReplies = [
  { keys: ["穿", "苍山", "天气"], answer: "明早苍山约 10–17℃，风会比古城明显。建议短袖打底，加一件防风外套；如果坐洗马潭索道，再带轻薄羽绒或抓绒。" },
  { keys: ["吃", "美食", "好吃"], answer: "古城附近可以优先尝试白族酸辣鱼、烤乳扇和饵丝。我已避开最拥挤的人民路主入口，推荐从叶榆路一侧步行过去。" },
  { keys: ["下雨", "调整", "改行程"], answer: "可以把洱海骑行调到第三天，今天改为大理非遗博物馆、甲马纸体验和古城咖啡馆，室内移动距离约 2.1km。" },
];

function askAssistant(question) {
  const text = question.trim();
  if (!text) return;
  const messages = qs("#messages");
  messages.insertAdjacentHTML("beforeend", `<div class="message user">${text.replace(/[<>]/g, "")}</div>`);
  messages.scrollTop = messages.scrollHeight;
  const match = assistantReplies.find((item) => item.keys.some((key) => text.includes(key)));
  const answer = match?.answer || "这个需求我记下了。演示版目前支持天气穿衣、古城美食和雨天改线，后续会接入实时城市数据提供更准确的回答。";
  window.setTimeout(() => {
    messages.insertAdjacentHTML("beforeend", `<div class="message bot">${answer}</div>`);
    messages.scrollTop = messages.scrollHeight;
  }, 420);
}

function init() {
  renderRoute();
  updateBudget();
  setChoiceGroup("#styleChoices", state.styles);
  setChoiceGroup("#needChoices", state.needs);

  qs("#peopleMinus").addEventListener("click", () => {
    state.people = Math.max(1, state.people - 1);
    qs("#peopleCount").textContent = state.people;
  });
  qs("#peoplePlus").addEventListener("click", () => {
    state.people = Math.min(8, state.people + 1);
    qs("#peopleCount").textContent = state.people;
  });

  qs("#budget").addEventListener("input", (event) => {
    state.budget = Number(event.target.value);
    qs("#budgetValue").textContent = formatMoney(state.budget);
    updateBudget();
  });
  qs("#generatePlan").addEventListener("click", generatePlan);

  qsa(".day-tabs button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeDay = Number(button.dataset.day);
      qsa(".day-tabs button").forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", active);
      });
      renderRoute();
    });
  });

  qsa("[data-optimize]").forEach((button) => {
    button.addEventListener("click", () => optimizePlan(button.dataset.optimize, button));
  });

  qsa("[data-question]").forEach((button) => button.addEventListener("click", () => askAssistant(button.dataset.question)));
  qs("#chatForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = qs("#chatInput");
    askAssistant(input.value);
    input.value = "";
  });

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")),
    { threshold: 0.08 },
  );
  qsa(".reveal").forEach((item) => observer.observe(item));
}

document.addEventListener("DOMContentLoaded", init);
