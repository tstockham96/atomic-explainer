import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { explodeSpecSchema } from '../src/spec/schema.ts'
import { renderSite } from '../src/pipeline/render-site.ts'
import { renderAssetReview } from '../src/pipeline/asset-review-site.ts'
import { assembleStudy } from '../src/pipeline/assemble.ts'
const output = path.resolve(process.argv[2] ?? 'dist-site')
await assembleStudy('examples/iphone-18-pro/research.json', 'examples/iphone-18-pro/assembly.json', path.join(output, 'construction-fixtures/phone'), output)
const review = {
  title: 'iPhone 18 Pro.',
  description: 'A source-model study. Inspect real geometry before reconstructing the parts inside.',
  source: {label: 'Manufacturer reference', url: 'https://www.apple.com/iphone-18-pro/'},
  limitations: ['The primitive phone was rejected for visual fidelity and remains only a construction test.', 'Manufacturer and marketplace models have separate licenses. This repository does not bundle Apple geometry.', 'Open a sourced GLB to inspect it here. A complete internal assembly has not been established.'],
}
await renderAssetReview(path.join(output, 'iphone-source-review'), review, output)
if (process.argv.includes('--with-local-assets')) {
  const spec = explodeSpecSchema.parse(JSON.parse(await readFile('examples/iphone-18-pro/internal-study.json', 'utf8')))
  await renderSite(spec, path.join(output, 'iphone-study'), { assetRoot: path.resolve('examples/iphone-18-pro'), templateDir: output, requirementsPath: 'examples/iphone-18-pro/requirements.json' })
} else {
  await renderAssetReview(path.join(output, 'iphone-study'), { ...review, description: 'The exploding exterior study requires a separately obtained local source model. This checkout includes the mapping, but does not redistribute Apple geometry.' }, output)
}
console.log('Built example routes; local internal assembly requires --with-local-assets.')

const engine = explodeSpecSchema.parse(JSON.parse(await readFile('examples/porsche-911-engine/research.json', 'utf8')))
await renderSite(engine, path.join(output, 'porsche-study'), { assetRoot: path.resolve('examples/porsche-911-engine'), templateDir: output, requirementsPath: 'examples/porsche-911-engine/requirements.json' })
