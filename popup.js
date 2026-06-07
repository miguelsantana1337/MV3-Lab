const analyzeButton = document.querySelector("#analyzeButton");
const copyButton = document.querySelector("#copyButton");
const statusEl = document.querySelector("#status");
const resultEl = document.querySelector("#result");

let lastReport = "";

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function formatMetric(stat) {
  if (!stat) return "-";
  if (typeof stat.value === "number") return stat.value.toLocaleString("pt-BR");
  return stat.raw || "-";
}

function listItems(selector, items, fallback) {
  const element = document.querySelector(selector);
  element.innerHTML = "";
  const safeItems = items?.length ? items : [fallback];

  for (const item of safeItems) {
    const li = document.createElement("li");
    li.textContent = item;
    element.append(li);
  }
}

function renderChips(selector, items) {
  const element = document.querySelector(selector);
  element.innerHTML = "";
  const safeItems = items?.length ? items : ["nao identificado"];

  for (const item of safeItems) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = item;
    element.append(chip);
  }
}

function renderPosts(posts) {
  const element = document.querySelector("#posts");
  element.innerHTML = "";

  if (!posts?.length) {
    const li = document.createElement("li");
    li.textContent = "Nenhum post visivel foi encontrado. Role o grid do perfil e tente novamente.";
    element.append(li);
    return;
  }

  for (const post of posts) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = post.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = post.type;
    li.append(link, `: ${post.summary}`);
    element.append(li);
  }
}

function buildReport(data) {
  const { profile, analysis } = data;
  const lines = [
    `Perfil: ${profile.displayName || profile.handle || "nao identificado"}`,
    `URL: ${profile.url}`,
    `Posts: ${formatMetric(profile.stats.posts)}`,
    `Seguidores: ${formatMetric(profile.stats.followers)}`,
    `Seguindo: ${formatMetric(profile.stats.following)}`,
    "",
    "Descricao:",
    analysis.description,
    "",
    "Bio:",
    profile.bio || "Nao capturada",
    "",
    `Temas: ${(analysis.themes || []).join(", ") || "nao identificados"}`,
    "",
    "Forcas:",
    ...(analysis.strengths?.length ? analysis.strengths.map((item) => `- ${item}`) : ["- Nenhuma forca detectada automaticamente"]),
    "",
    "Riscos:",
    ...(analysis.risks?.length ? analysis.risks.map((item) => `- ${item}`) : ["- Nenhum risco detectado automaticamente"]),
    "",
    "Recomendacoes:",
    ...(analysis.recommendations || []).map((item) => `- ${item}`),
    "",
    "Posts visiveis:",
    ...(profile.posts || []).map((post, index) => `${index + 1}. ${post.type}: ${post.summary} (${post.url})`)
  ];

  return lines.join("\n");
}

function renderResult(data) {
  const { profile, analysis } = data;
  const name = profile.displayName || profile.handle || "Perfil nao identificado";

  document.querySelector("#profileName").textContent = name;
  document.querySelector("#profileLink").href = profile.url;
  document.querySelector("#postsMetric").textContent = formatMetric(profile.stats.posts);
  document.querySelector("#followersMetric").textContent = formatMetric(profile.stats.followers);
  document.querySelector("#followingMetric").textContent = formatMetric(profile.stats.following);
  document.querySelector("#description").textContent = analysis.description;
  document.querySelector("#bio").textContent = profile.bio || "Bio nao capturada automaticamente.";

  renderChips("#themes", analysis.themes);
  listItems("#strengths", analysis.strengths, "Nenhuma forca detectada automaticamente.");
  listItems("#risks", analysis.risks, "Nenhum risco detectado automaticamente.");
  listItems("#recommendations", analysis.recommendations, "Sem recomendacoes automaticas.");
  renderPosts(profile.posts);

  lastReport = buildReport(data);
  resultEl.hidden = false;
}

async function getActiveInstagramTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith("https://www.instagram.com/")) {
    throw new Error("Abra um perfil em https://www.instagram.com/ antes de analisar.");
  }

  return tab;
}

async function analyze() {
  analyzeButton.disabled = true;
  setStatus("Lendo dados visiveis do perfil...");

  try {
    const tab = await getActiveInstagramTab();
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "ANALYZE_INSTAGRAM_PROFILE"
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Nao consegui ler o perfil. Recarregue a pagina e tente novamente.");
    }

    renderResult(response);
    setStatus("Analise pronta. As metricas usam apenas o que esta visivel no perfil aberto.");
  } catch (error) {
    resultEl.hidden = true;
    setStatus(error instanceof Error ? error.message : String(error), true);
  } finally {
    analyzeButton.disabled = false;
  }
}

async function copyReport() {
  if (!lastReport) return;
  await navigator.clipboard.writeText(lastReport);
  setStatus("Relatorio copiado para a area de transferencia.");
}

analyzeButton.addEventListener("click", analyze);
copyButton.addEventListener("click", copyReport);
