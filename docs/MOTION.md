# Sistema de movimento do Limiar

O movimento do portal reforça hierarquia, continuidade e resposta às ações. Ele não deve competir com a leitura das cartas nem atrasar a interface.

## Tokens

Os valores compartilhados ficam em `src/lib/motion.ts` para componentes Motion e em `src/app/globals.css` para CSS:

| Token | Duração | Uso |
| --- | ---: | --- |
| `fast` / `--motion-fast` | 160 ms | hover, foco, chips, ícones e feedback imediato |
| `standard` / `--motion-standard` | 240 ms | mudança de estado, cards, campos e drawer |
| `page` / `--motion-page` | 380 ms | entrada de rota, seção e conteúdo assíncrono |
| `exit` / `--motion-exit` | 140 ms | remoção de item, overlay e conteúdo que desaparece |

Entradas usam `cubic-bezier(.16, 1, .3, 1)` e saídas usam `cubic-bezier(.4, 0, 1, 1)`. O feedback de pressão usa escala `0.97`; entradas usam deslocamentos de 8 a 16 px.

## Padrões reutilizáveis

- `PageTransition`: entrada única por rota do App Router, sem reiniciar em mudanças locais de estado.
- `pageVariants`: conteúdo de página com opacidade e deslocamento de 12 px.
- `stageVariants`: troca curta entre etapas e estados assíncronos.
- `listItemVariants`: listas com atraso limitado aos primeiros 12 itens para evitar sequências longas.
- `feedbackVariants`: mensagens, contadores, chips e erros.
- `overlayVariants` e `drawerVariants`: menu móvel e superfícies sobrepostas.
- `[data-reveal]`: revelação única ao entrar na viewport, gerenciada por um único `IntersectionObserver` global.

Prefira os padrões acima a variantes locais. Animações novas devem usar `transform`, `scale`, `translate` e `opacity`. Mudanças de layout só devem ser animadas em listas pequenas.

## Movimento reduzido

Componentes Motion consultam `useHydratedReducedMotion()`, que mantém SSR e primeiro render do navegador idênticos antes de aplicar `useReducedMotion()`. O CSS também responde a `prefers-reduced-motion: reduce`, removendo deslocamento, escala, órbitas, shimmer e movimento decorativo. Fades rápidos permanecem apenas onde ajudam a compreender uma troca de estado. Nenhuma informação depende da animação.

## Performance

- Não há Three.js, GSAP ou nova dependência.
- O scroll do header é passivo e consolidado com `requestAnimationFrame`.
- A biblioteca só anima layout quando há até 24 resultados e limita o stagger aos primeiros 12.
- Skeletons preservam a geometria durante recuperação local e só ficam visíveis após 140 ms, evitando flicker em leituras rápidas do `localStorage`.
- Canvas, observers, intervals e listeners existentes possuem limpeza no desmontar.
- Efeitos contínuos são decorativos, leves e desativados com movimento reduzido.
