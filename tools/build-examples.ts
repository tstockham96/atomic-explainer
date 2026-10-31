import path from 'node:path'
import { renderAssetReview } from '../src/pipeline/asset-review-site.ts'
import { assembleStudy } from '../src/pipeline/assemble.ts'
const output = path.resolve(process.argv[2] ?? 'dist-site')
await assembleStudy('examples/iphone-18-pro/research.json', 'examples/iphone-18-pro/assembly.json', path.join(output, 'construction-fixtures/phone'), output)
await renderAssetReview(path.join(output, 'iphone-study'), {
  title: 'iPhone 18 Pro.',
  description: 'A source-model study. Inspect real geometry before reconstructing the parts inside.',
  source: {label: 'Manufacturer reference', url: 'https://www.apple.com/iphone-18-pro/'},
  limitations: ['The primitive phone was rejected for visual fidelity and remains only a construction test.', 'Manufacturer and marketplace models have separate licenses. This repository does not bundle Apple geometry.', 'Open a sourced GLB to inspect it here. A complete internal assembly has not been established.'],
}, output)
console.log('Built source-model review and a separate construction regression fixture.')
