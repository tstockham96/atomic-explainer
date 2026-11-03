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

// A second-object integration fixture for the reusable story contract. Its
// simple geometry is a construction test, never presented as a fidelity demo.
const fixtureDir=path.join(output,'construction-fixtures/phone')
const storyFixture=explodeSpecSchema.parse(JSON.parse(await readFile(path.join(fixtureDir,'spec.json'),'utf8')))
if(storyFixture.scene3d?.kind==='gltf'){
 const ids=['logic-board','battery',...storyFixture.scene3d.parts.map(p=>p.componentId).filter(id=>!['logic-board','battery'].includes(id))]
 storyFixture.scene3d.assemblyStory={title:'Whole to core to whole',note:'Construction fixture · educational order only',opening:{title:'One working object',description:'Explore the core, then build outward.',from:[.25,.2,1]},closing:{title:'A complete assembly',description:'All components are back in their original seats.'},chapters:ids.map(id=>{const c=storyFixture.components.find(c=>c.id===id)!;return {id,componentIds:[id],title:c.name,description:c.howItsMade,joined:c.name+' joins the accumulating assembly.',from:[.25,.2,1],approach:[0,0,1]}})}
 storyFixture.scene3d.assemblyStory.chapters.splice(2,0,{id:'powered-core',kind:'milestone',componentIds:['logic-board','battery'],title:'A powered computing core',description:'The battery supplies energy and the board processes signals. Both previously explored parts now work as one subsystem.',joined:'The powered core is ready for the display and other interfaces.',from:[.25,.2,1],approach:[0,0,1]})
 await renderSite(storyFixture,path.join(output,'construction-fixtures/assembly-story'),{assetRoot:fixtureDir,templateDir:output})
}
