# MV3 Lab - Instagram Analyzer

Extensao Chrome MV3 para resumir posts visiveis e descrever um perfil do Instagram com metricas publicas renderizadas na pagina.

## O que este MVP faz

- Le o perfil aberto em `https://www.instagram.com/...`.
- Captura handle, nome, bio, quantidade de posts, seguidores e seguindo quando esses dados estao visiveis.
- Resume ate 18 posts/reels visiveis no grid usando texto acessivel das imagens e elementos renderizados.
- Detecta temas como autoridade, educacao, venda, bastidores, produto e comunidade.
- Gera uma descricao do perfil, forcas, riscos e recomendacoes.
- Copia um relatorio em texto para usar em proposta, diagnostico ou atendimento.

## Limites importantes

- A extensao nao acessa dados privados nem usa endpoints internos do Instagram.
- Likes, comentarios, alcance, salvamentos e compartilhamentos reais normalmente nao aparecem no grid do perfil. Para essas metricas, o ideal e integrar uma fonte autorizada, como Meta Graph API para contas com permissao.
- O Instagram muda a interface com frequencia. O parser foi feito com seletores defensivos, mas pode precisar de ajustes.
- A primeira versao nao envia dados para IA externa. Ela usa regras locais para evitar expor chaves de API no navegador.

## Como instalar no Chrome

1. Abra `chrome://extensions`.
2. Ative `Modo do desenvolvedor`.
3. Clique em `Carregar sem compactacao`.
4. Selecione a pasta deste repositorio: `MV3-Lab`.
5. Abra um perfil do Instagram e clique no icone da extensao.

## Proximo passo recomendado

Para transformar em uma ferramenta comercial, o caminho mais solido e:

- manter este coletor local como camada de leitura da pagina;
- adicionar login e backend proprio;
- enviar o texto coletado para uma API de IA pelo backend, nao diretamente pela extensao;
- integrar Meta Graph API para metricas reais quando o perfil analisado tiver permissao;
- salvar relatorios por cliente, nicho e data.
