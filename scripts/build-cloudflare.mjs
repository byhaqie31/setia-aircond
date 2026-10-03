import assert from 'node:assert/strict';
import { cp, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const run = (script, args = [], env = process.env) => {
  const result = spawnSync(process.execPath, [join(root, script), ...args], { cwd: root, env, stdio: 'inherit' });
  return result.status ?? 1;
};
const generated = run('node_modules/nuxt/bin/nuxt.mjs', ['generate'], { ...process.env, SETIA_CLOUDFLARE_BUILD: '1' });
if (generated) process.exit(generated);

const output = join(root, '.output-cloudflare/public');
const assetRoot = resolve(root, '.cloudflare/assets');
const inside = relative(root, assetRoot);
assert.ok(inside === join('.cloudflare', 'assets') && assetRoot.startsWith(`${root}${sep}`));
await mkdir(assetRoot, { recursive: true });
// Refuse to delete a generated directory redirected outside this workspace.
assert.equal(await realpath(assetRoot), assetRoot);
// Keep the directory itself so a running Wrangler preview can continue watching it.
for (const entry of await readdir(assetRoot)) {
  const target = resolve(assetRoot, entry);
  assert.equal(dirname(target), assetRoot);
  await rm(target, { recursive: true, force: true });
}
const destination = join(assetRoot, 'example/setia-aircond');
const excluded = ['images/residential/camera-journey-v2', 'images/residential/sequence'];
await cp(output, destination, {
  recursive: true,
  filter: path => !excluded.some(prefix => {
    const name = relative(output, path).split(sep).join('/');
    return name === prefix || name.startsWith(`${prefix}/`);
  }),
});
const html = await readFile(join(destination, 'index.html'), 'utf8');
assert.ok(html.includes('/example/setia-aircond/_nuxt/'), 'Build must use the public example base path');
const metadata = {
  baseURL: '/example/setia-aircond/',
  builtAt: new Date().toISOString(),
  sourceCommit: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout?.trim() || null,
  sourceDirty: Boolean(spawnSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root, encoding: 'utf8' }).stdout?.trim()),
};
await writeFile(join(dirname(assetRoot), 'build.json'), `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Cloudflare assets ready at ${destination}`);
