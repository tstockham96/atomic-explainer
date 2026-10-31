import {describe,it,expect} from 'vitest'
import * as T from 'three'
import {alignWatchReference,hollowCase} from '../src/authoring/fitReference.ts'

describe('reference alignment and cavity reconstruction',()=>{
 it('aligns a tilted dial plane before fitting independent components',()=>{
  const root=new T.Group(),tilt=new T.Group();root.add(tilt);tilt.rotation.set(.24,.13,.04)
  const dial=new T.Mesh(new T.CircleGeometry(.4,128));dial.name='tripo_part_3';dial.rotation.y=Math.PI/2;tilt.add(dial)
  const body=new T.Mesh(new T.BoxGeometry(.12,.95,1.2));body.name='tripo_part_0';tilt.add(body)
  const {caseMesh}=alignWatchReference(root)
  const points=dial.geometry.attributes.position!,world=[]
  for(let i=0;i<points.count;i++)world.push(new T.Vector3().fromBufferAttribute(points,i).applyMatrix4(dial.matrixWorld))
  expect(Math.max(...world.map(p=>p.z))-Math.min(...world.map(p=>p.z))).toBeLessThan(1e-5)
  expect(new T.Box3().setFromObject(caseMesh).getSize(new T.Vector3()).x).toBeCloseTo(42,5)
  expect(world.every(p=>p.toArray().every(Number.isFinite))).toBe(true)
 })
 it('removes a solid central face while preserving an exterior annulus',()=>{
  const central=new T.Mesh(new T.CircleGeometry(16,64));central.updateMatrixWorld(true)
  expect(hollowCase(central).index!.count).toBe(0)
  const exterior=new T.Mesh(new T.RingGeometry(18,21,64));exterior.updateMatrixWorld(true)
  expect(hollowCase(exterior).index!.count).toBe(exterior.geometry.index!.count)
 })
})
