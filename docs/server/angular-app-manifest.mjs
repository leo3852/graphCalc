
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
    'index.csr.html': {size: 5097, hash: '5c1bc03f812e8eb5003548673be06aca50b8ee6a97ce3871fb3ed290cc85d6c4', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1017, hash: '09e5ad32a0a0482df9a7b8bcf34c45b7644a2d2588b36f1568da6a33b559ff3d', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 13302, hash: 'ab4c640aa4a8bfef128aa8ecf9f7228fdb9ad6b61faf71c63ef7e501fb0e3186', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-VJ2YMQTJ.css': {size: 11799, hash: '3mKFYNDGeyQ', text: () => import('./assets-chunks/styles-VJ2YMQTJ_css.mjs').then(m => m.default)}
  },
};
