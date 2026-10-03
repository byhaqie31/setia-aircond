import { withSiteBase } from '~/utils/site-path'

export default defineNuxtPlugin(() => {
  const baseURL = useRuntimeConfig().app.baseURL
  return { provide: { sitePath: (path: string) => withSiteBase(path, baseURL) } }
})
