import path from 'node:path'
import { assembleStudy } from '../src/pipeline/assemble.ts'
const output = path.resolve(process.argv[2] ?? 'dist-site')
await assembleStudy('examples/iphone-18-pro/research.json', 'examples/iphone-18-pro/assembly.json', path.join(output, 'iphone-study'), output)
console.log('Built iPhone assembly prototype with the shared construction/export path.')
