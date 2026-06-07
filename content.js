(() => {
  const numberMap = {
    mil: 1000,
    k: 1000,
    mi: 1000000,
    m: 1000000,
    bi: 1000000000,
    b: 1000000000
  };

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\u00a0/g, " ")
      .trim();
  }

  function compactNumberToValue(raw) {
    const value = cleanText(raw).toLowerCase().replace(/\./g, "").replace(",", ".");
    const match = value.match(/([\d.]+)\s*([a-z]+)?/i);
    if (!match) return null;

    const amount = Number.parseFloat(match[1]);
    if (Number.isNaN(amount)) return null;

    const suffix = match[2] ? match[2].replace(/s$/, "") : "";
    return Math.round(amount * (numberMap[suffix] || 1));
  }

  function findStat(labelPatterns) {
    const candidates = [...document.querySelectorAll("header li, header a, header span, main header *")]
      .map((node) => cleanText(node.innerText || node.textContent))
      .filter(Boolean);

    for (const text of candidates) {
      const normalized = text.toLowerCase();
      if (!labelPatterns.some((pattern) => pattern.test(normalized))) continue;

      const numberText = text.match(/[\d.,]+\s*(?:mil|mi|bi|k|m|b)?/i)?.[0] || "";
      return {
        raw: text,
        value: compactNumberToValue(numberText)
      };
    }

    return {
      raw: "Nao encontrado na pagina",
      value: null
    };
  }

  function extractHandle() {
    const pathHandle = location.pathname.split("/").filter(Boolean)[0];
    const heading = cleanText(document.querySelector("header h2, header h1, main h2, main h1")?.textContent);
    return pathHandle || heading || null;
  }

  function extractDisplayName() {
    const handle = extractHandle();
    const names = [...document.querySelectorAll("header h1, header h2, header span, main header span")]
      .map((node) => cleanText(node.textContent))
      .filter((text) => text && text.toLowerCase() !== String(handle || "").toLowerCase());

    return names.find((text) => text.length > 1 && text.length < 80) || null;
  }

  function extractBio() {
    const header = document.querySelector("header");
    if (!header) return "";

    const lines = cleanText(header.innerText)
      .split(/(?<=\D)\s(?=\d[\d.,]*\s*(?:publica|post|seguidor|seguindo|followers|following))/i)
      .join("\n")
      .split("\n")
      .map(cleanText)
      .filter(Boolean);

    const blocked = [/publica/i, /post/i, /seguidor/i, /seguindo/i, /followers/i, /following/i, /^@/];
    const bioLines = lines.filter((line) => !blocked.some((pattern) => pattern.test(line)));

    return bioLines.slice(1, 6).join("\n") || "";
  }

  function extractPostCards() {
    const links = [...document.querySelectorAll('main a[href*="/p/"], main a[href*="/reel/"]')];
    const seen = new Set();

    return links
      .map((link) => {
        const href = new URL(link.getAttribute("href"), location.origin).href;
        if (seen.has(href)) return null;
        seen.add(href);

        const image = link.querySelector("img");
        const alt = cleanText(image?.getAttribute("alt"));
        const type = href.includes("/reel/") ? "Reel" : "Post";
        const visibleText = cleanText(link.innerText);

        return {
          type,
          url: href,
          alt,
          visibleText,
          summary: summarizePostText(alt || visibleText, type)
        };
      })
      .filter(Boolean)
      .slice(0, 18);
  }

  function summarizePostText(text, type) {
    const normalized = cleanText(text);
    if (!normalized) return `${type} visivel sem legenda/alt text acessivel no grid.`;

    const withoutInstagramPrefix = normalized
      .replace(/^Photo by .*? on .*?:\s*/i, "")
      .replace(/^Imagem de .*?:\s*/i, "");

    return withoutInstagramPrefix.length > 180
      ? `${withoutInstagramPrefix.slice(0, 177)}...`
      : withoutInstagramPrefix;
  }

  function inferContentThemes(posts, bio) {
    const text = `${bio} ${posts.map((post) => `${post.alt} ${post.visibleText}`).join(" ")}`.toLowerCase();
    const themes = [
      ["autoridade", /case|resultado|cliente|depoimento|prova|antes e depois/],
      ["educacao", /dica|guia|passo|como|aprenda|tutorial|erros?/],
      ["venda", /oferta|promocao|comprar|link|orcamento|agenda|whatsapp/],
      ["bastidores", /bastidor|equipe|processo|rotina|making of/],
      ["produto", /produto|servico|solucao|plano|pacote/],
      ["comunidade", /evento|live|comentario|pergunta|responda|comunidade/]
    ];

    return themes
      .filter(([, pattern]) => pattern.test(text))
      .map(([theme]) => theme);
  }

  function buildAnalysis(profile) {
    const posts = profile.posts || [];
    const followers = profile.stats.followers.value;
    const following = profile.stats.following.value;
    const postCount = profile.stats.posts.value;
    const themes = inferContentThemes(posts, profile.bio);
    const postsWithText = posts.filter((post) => post.alt || post.visibleText).length;
    const ratio = followers && following ? followers / Math.max(following, 1) : null;

    const strengths = [];
    const risks = [];
    const recommendations = [];

    if (posts.length >= 9) strengths.push("grid com volume suficiente para leitura rapida de posicionamento");
    if (themes.includes("autoridade")) strengths.push("usa sinais de prova ou autoridade");
    if (themes.includes("educacao")) strengths.push("conteudo educacional ajuda a gerar confianca antes da venda");
    if (ratio && ratio >= 2) strengths.push("relacao seguidores/seguindo sugere tracao organica razoavel");

    if (!profile.bio) risks.push("bio nao ficou acessivel para leitura automatica");
    if (posts.length < 6) risks.push("poucos posts carregados no grid; role a pagina e analise novamente");
    if (postsWithText < Math.max(3, posts.length / 2)) risks.push("muitos posts sem texto alternativo acessivel, reduzindo a qualidade do resumo");
    if (!themes.includes("venda")) risks.push("chamada comercial/CTA nao apareceu nos posts visiveis");

    recommendations.push("abrir 9 a 18 posts recentes antes da analise final para capturar legendas e sinais de engajamento com mais precisao");
    recommendations.push("comparar temas de autoridade, educacao e venda para ver se o perfil equilibra prova, valor e conversao");
    if (!themes.includes("autoridade")) recommendations.push("incluir mais provas: cases, bastidores de entrega, resultados e depoimentos");
    if (!themes.includes("educacao")) recommendations.push("incluir conteudos que ensinem algo especifico antes de pedir contato");

    return {
      description: describeProfile(profile, themes, ratio, postCount),
      themes,
      strengths,
      risks,
      recommendations,
      visiblePostCoverage: {
        loaded: posts.length,
        withReadableText: postsWithText
      }
    };
  }

  function describeProfile(profile, themes, ratio, postCount) {
    const name = profile.displayName || profile.handle || "Este perfil";
    const themeText = themes.length ? themes.join(", ") : "tema principal nao identificado automaticamente";
    const ratioText = ratio ? ` A razao seguidores/seguindo estimada e ${ratio.toFixed(1)}.` : "";
    const countText = postCount ? ` O perfil informa aproximadamente ${postCount.toLocaleString("pt-BR")} publicacoes.` : "";

    return `${name} aparenta trabalhar com ${themeText} a partir da bio e dos posts visiveis.${countText}${ratioText} Esta leitura usa apenas informacoes renderizadas no navegador.`;
  }

  function analyzeProfile() {
    const profile = {
      url: location.href,
      handle: extractHandle(),
      displayName: extractDisplayName(),
      bio: extractBio(),
      stats: {
        posts: findStat([/publica/, /posts?/]),
        followers: findStat([/seguidor/, /followers?/]),
        following: findStat([/seguindo/, /following/])
      },
      posts: extractPostCards(),
      capturedAt: new Date().toISOString()
    };

    return {
      ok: true,
      profile,
      analysis: buildAnalysis(profile)
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "ANALYZE_INSTAGRAM_PROFILE") return false;

    try {
      sendResponse(analyzeProfile());
    } catch (error) {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return true;
  });
})();
