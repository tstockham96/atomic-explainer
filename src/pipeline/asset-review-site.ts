import {readFile, writeFile, mkdir, cp} from 'node:fs/promises'
import path from 'node:path'
import {packageRoot, ensureViewerTemplate} from './render-site.ts'
export async function renderAssetReview(outDir:string, config:{title:string;description:string;model?:string;source?:{label:string;url:string};limitations:string[]}, templateDir?:string){
  const root=templateDir??await ensureViewerTemplate(packageRoot())
  if(path.resolve(root)===path.resolve(outDir))throw Error('Choose an output folder other than the viewer template.')
  const html=await readFile(path.join(root,'asset-review.html'),'utf8')
  if(!html.includes('/*__ASSET_REVIEW_CONFIG__*/null'))throw Error('Asset review template is missing its data marker. Rebuild the site.')
  await mkdir(outDir,{recursive:true})
  await cp(path.join(root,'assets'),path.join(outDir,'assets'),{recursive:true})
  await writeFile(path.join(outDir,'index.html'),html.replace('/*__ASSET_REVIEW_CONFIG__*/null',JSON.stringify(config).replace(/</g,'\\u003c')))
}
