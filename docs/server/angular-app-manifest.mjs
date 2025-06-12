
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/graph-calc/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/graph-calc"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 6577, hash: 'c946105661f1547a2da3f2fe949e2dff73912ae2d602abb6fa241ec045f3ef9c', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1017, hash: '6cd8245966a1f8694034d6d10e1412dc095916186e18699159c5812b69c8f6bb', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 14858, hash: '067f22b63980b3fc87cb9dfa4d77088bee871cf92d799e8e31aa1768a740d645', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-OQGJPIRE.css': {size: 15229, hash: '6ZEqo8e88Yk', text: () => import('./assets-chunks/styles-OQGJPIRE_css.mjs').then(m => m.default)}
  },
};
