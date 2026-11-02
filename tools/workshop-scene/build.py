"""Author, render and bake one coherent workspace. Blender 4.5+.
Run: blender -b --python tools/workshop-scene/build.py -- --preview|--bake
All coordinates here are in scene units; 1 unit = 100 viewer stage units.
"""
import bpy, math, sys, json, hashlib
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/presentation/atelier';OUT.mkdir(parents=True,exist_ok=True)
WORK=ROOT/'.workshop-build';WORK.mkdir(parents=True,exist_ok=True)
BAKE='--bake' in sys.argv
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
prefs=bpy.context.preferences.addons['cycles'].preferences
try:
 prefs.compute_device_type='METAL';prefs.get_devices()
 for d in prefs.devices:d.use=d.type=='METAL'
 scene.cycles.device='GPU'
except:pass
scene.world=bpy.data.worlds.new('Blue hour ambient');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.10,.15,.25,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.12
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=75
floor=-.52

def material(name,color,rough=.7,metal=0,emit=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if emit:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emit
 return m
wall=material('Midnight teal plaster',(.055,.12,.14));wood=material('Oiled walnut',(.18,.085,.038),.55)
edge=material('Warm oak edges',(.30,.16,.065),.52);ink=material('Powder coated midnight',(.018,.038,.047),.55)
coral=material('Burnt orange enamel',(.5,.12,.045),.32,.15);brass=material('Brushed brass',(.4,.27,.09),.35,.65)
paper=material('Ivory paper',(.66,.59,.43),.8);green=material('Jade rubber',(.025,.13,.115),.92)
steel=material('Brushed steel',(.27,.32,.34),.38,.8);blue=material('Indigo cloth',(.045,.065,.14),.8)

def box(name,loc,dims,mat,bevel=.018,group='room'):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Crafted edge radii','BEVEL');mod.width=bevel;mod.segments=3
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
  for p in o.data.polygons:p.use_smooth=True
  mod=o.modifiers.new('Weighted face normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
 o.data.materials.append(mat);o['atlas']=group;return o

def rod(name,a,b,r,mat,group='props'):
 a,b=Vector(a),Vector(b);bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=(b-a).length,location=(a+b)/2);o=bpy.context.object;o.name=name;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();o.data.materials.append(mat);o['atlas']=group
 for p in o.data.polygons:p.use_smooth=True
 return o

def import_asset(name,target_width,at,rotation=0,top=False):
 before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/f'tools/workshop-scene/assets/{name}.glb'))
 objs=[o for o in set(bpy.data.objects)-before if o.type=='MESH']
 # Import glTF already transforms Y-up back into Blender's Z-up.
 bpy.ops.object.select_all(action='DESELECT')
 for o in objs:
  matrix=o.matrix_world.copy();o.parent=None;o.matrix_world=matrix;o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join();o=bpy.context.object;o.name=name
 bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
 bounds=[o.matrix_world@Vector(v) for v in o.bound_box];lo=Vector(tuple(min(v[i] for v in bounds)for i in range(3)));hi=Vector(tuple(max(v[i] for v in bounds)for i in range(3)))
 factor=target_width/(hi.x-lo.x);o.scale*=factor;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 bounds=[o.matrix_world@Vector(v) for v in o.bound_box];lo=Vector(tuple(min(v[i] for v in bounds)for i in range(3)));hi=Vector(tuple(max(v[i] for v in bounds)for i in range(3)))
 o.location-=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,hi.z if top else lo.z));bpy.ops.object.transform_apply(location=True,rotation=False,scale=False)
 o.rotation_mode='XYZ';o.rotation_euler.z=rotation;o.location=at;o['atlas']='props' if name!='workbench' else 'bench';return o

bench=import_asset('workbench',8,(0,0,floor),top=True)
# Muted walnut finish unifies the imported bench with the cabinetry.
for m in bench.data.materials:
 p=m.node_tree.nodes.get('Principled BSDF')
 if p:
  p.inputs['Roughness'].default_value=.6
  links=m.node_tree.links;socket=p.inputs['Base Color']
  if socket.is_linked:
   old=socket.links[0].from_socket;mix=m.node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[2].default_value=(.43,.30,.20,1);links.new(old,mix.inputs[1]);links.new(mix.outputs[0],socket)

# A closed room shell, including surfaces outside the seated camera.
box('Room floor',(0,0,-3.15),(12,14,.18),ink)
box('Opposite frosted window',(0,-6,1.2),(10,.12,6),material('Neutral reflected daylight',(.75,.8,.9),emit=.8),group='reflection_only')
# A room shell with a genuine framed window opening on the left.
box('Back wall central',(1.0,2.18,1.75),(6,.16,4.6),wall)
box('Window left pier',(-4.5,2.18,1.75),(1,.16,4.6),wall)
box('Window lower wall',(-3,2.18,-.05),(2,.16,1),wall)
box('Window upper wall',(-3,2.18,3.6),(2,.16,1),wall)
box('Right return wall',(4,0.4,1.7),(.18,3.7,4.6),wall)
box('Left return wall',(-5,.4,1.7),(.18,3.7,4.6),wall)
box('Cove ceiling',(0,1.4,4.1),(10,2,.18),ink)
box('Wall base rail',(0,2.055,floor+.08),(8,.10,.12),wood)
box('Lower back wall',(0,2.18,-1.85),(10,.16,2.6),wall)
box('Lower left return',(-5,.4,-1.85),(.18,3.7,2.6),wall)
box('Lower right return',(4,.4,-1.85),(.18,3.7,2.6),wall)
# Framed window: sill, jambs and muntins all physically meet the wall.
for x in [-4,-2]:box('Window jamb',(x,2.08,1.75),(.10,.24,2.7),wood)
for z in [.4,3.1]:box('Window header sill',(-3,2.02,z),(2.12,.36,.10),wood)
box('Window central mullion',(-3,2.03,1.75),(.055,.16,2.6),ink)
box('Window crossbar',(-3,2.03,1.55),(2,.16,.045),ink)
sky=material('Blue hour window',(.12,.22,.48),emit=.7)
box('Exterior sky',(-3,2.42,1.75),(2.6,.02,3.2),sky,0)
# A built-in tool cabinet: continuous back, sides, supported shelves and lip.
for x in [1.38,3.2]:box('Cabinet upright',(x,1.94,1.15),(.085,.38,1.9),wood)
box('Cabinet back',(2.29,2.065,1.15),(1.82,.09,1.9),ink)
for z in [.23,1.1,2.05]:
 box('Cabinet fixed shelf',(2.29,1.91,z),(1.90,.43,.075),wood)
 box('Cabinet shelf front lip',(2.29,1.675,z+.035),(1.9,.04,.08),edge)
# Shelf contents have real covers, pages, spine bands, and rest on the shelf.
for i,(h,w) in enumerate([(.52,.13),(.62,.12),(.56,.16),(.67,.13)]):
 x=1.53+i*.16;z=1.14+h/2
 box('Book pages',(x,1.87,z),(w-.025,.25,h-.035),paper,.005,'props')
 for side in [-1,1]:box('Book cover',(x+side*w/2,1.87,z),(.018,.28,h),[coral,blue,green,wood][i],.004,'props')
 box('Book spine',(x,1.724,z),(w+.018,.025,h),[coral,blue,green,wood][i],.005,'props')
 for dz in [-h*.32,h*.32]:box('Spine tooling',(x,1.707,z+dz),(w*.7,.004,.008),brass,.001,'props')
# Lower shelf storage boxes with inset pulls, not loose floating blocks.
for i in range(2):
 x=1.84+i*.83;box('Instrument drawer',(x,1.9,.61),(.72,.32,.62),blue,.035,'props');box('Drawer label holder',(x,1.732,.68),(.25,.018,.12),brass,.01,'props');box('Drawer label',(x,1.718,.68),(.21,.01,.08),paper,.004,'props');rod('Drawer handle',(x-.1,1.68,.48),(x+.1,1.68,.48),.015,brass)
# Tool rail anchored to wall; hooks and tools share actual attachment points.
box('Wall tool rail',(-.25,2.04,.85),(1.9,.10,.16),wood)
for i in range(4):
 x=-1+i*.43;rod('Rail peg',(x,1.98,.85),(x,1.84,.85),.022,brass)
 rod('Hanging driver shaft',(x,1.86,.83),(x,1.86,.38),.012,steel)
 rod('Hanging driver grip',(x,1.86,.35),(x,1.86,.60),.048,[coral,wood,blue,green][i])
# Detailed imported lamp clamped to the edge; no second hovering bar in view.
lamp=import_asset('desk-lamp',1.35,(-1.92,1.90,floor-.12),math.pi/2)
# The source lamp is narrow along X before rotating. Keep a consistent 1.8-unit height.
bpy.context.view_layer.update();h=lamp.dimensions.z;lamp.scale*=1.85/h
# Place vise and caliper outside the central inspection volume.
import_asset('bench-vise',.6,(1.95,.6,floor+.005),-.18)
import_asset('vernier-caliper',.86,(.95,-.69,floor+.022),-.18)
# A layered notebook lying on the desk, bound spine and elastic.
box('Notebook cover',(1.43,1.1,floor+.035),(.58,.78,.06),coral,.025,'props')
box('Notebook pages',(1.43,1.1,floor+.068),(.54,.74,.035),paper,.012,'props')
box('Notebook top',(1.43,1.1,floor+.092),(.58,.78,.018),coral,.012,'props')
box('Notebook elastic',(1.61,1.1,floor+.106),(.035,.79,.008),ink,.002,'props')
# Low tray and precision tools on the left; a clear, deliberate central workspace.
box('Parts tray',(-1.45,.28,floor+.025),(.65,.40,.04),ink,.08,'props')
for x,y in [(-1.65,.2),(-1.43,.34),(-1.22,.24)]:rod('Spare screw',(x,y,floor+.05),(x,y,floor+.08),.025,steel)
for i in range(3):
 x=-1.14+i*.16;rod('Driver handle',(x,-.82,floor+.065),(x,-.53,floor+.065),.035,[wood,ink,coral][i]);rod('Driver ferrule',(x,-.53,floor+.065),(x,-.48,floor+.065),.024,steel);rod('Driver shaft',(x,-.48,floor+.065),(x,-.13,floor+.065),.009,steel)
# Mat uses one mesh and a non-overlapping printed grid; no floating decal plane.
green=green.copy();green.name='Cutting mat printed rubber'
mat=box('Cutting mat',(0,-.27,floor+.012),(2.8,1.9,.018),green,.012,'mat')
m=green;n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF');tex=n.new('ShaderNodeUVMap');tex.uv_map='SurfaceUV';sep=n.new('ShaderNodeSeparateXYZ');l.new(tex.outputs[0],sep.inputs[0])
mat.data.uv_layers[0].name='SurfaceUV'
for poly in mat.data.polygons:
 for li in poly.loop_indices:
  co=mat.data.vertices[mat.data.loops[li].vertex_index].co
  mat.data.uv_layers[0].data[li].uv=((co.x+1.4)/2.8,(co.y+.95)/1.9)
lines=[]
for axis,div in [('X',28),('Y',19)]:
 mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=div;l.new(sep.outputs[axis],mul.inputs[0]);ping=n.new('ShaderNodeMath');ping.operation='PINGPONG';ping.inputs[1].default_value=.5;l.new(mul.outputs[0],ping.inputs[0]);less=n.new('ShaderNodeMath');less.operation='LESS_THAN';less.inputs[1].default_value=.012;l.new(ping.outputs[0],less.inputs[0]);lines.append(less.outputs[0])
maximum=n.new('ShaderNodeMath');maximum.operation='MAXIMUM';l.new(lines[0],maximum.inputs[0]);l.new(lines[1],maximum.inputs[1]);mix=n.new('ShaderNodeMixRGB');mix.inputs[1].default_value=(.018,.095,.085,1);mix.inputs[2].default_value=(.16,.32,.25,1);l.new(maximum.outputs[0],mix.inputs[0]);l.new(mix.outputs[0],p.inputs['Base Color'])
# Broad overhead source is high above the field of view. Soft indirect light is baked.
def area(name,loc,target,power,color,size,size_y=None):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='RECTANGLE';d.size=size;d.size_y=size_y or size;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
box('Suspended bench luminaire',(0,-.3,3.0),(2.0,.24,.08),ink)
for x in [-.75,.75]:rod('Ceiling suspension',(x,-.3,3.04),(x,-.3,4.0),.008,ink)
area('Overhead warm key',(-.45,-.20,2.94),(0,-.15,floor),350,(1,.66,.35),1.4,.32)
area('Window blue bounce',(-3,1.95,1.7),(0,0,.0),180,(.25,.48,1),1.8,2.3)
area('Cabinet warm accent',(2.25,1.64,1.02),(2.2,1.9,.3),18,(1,.40,.13),1.5,.05)
area('Task lamp glow',(-1.92,1.6,1.1),(-.9,.15,floor),55,(1,.5,.20),.38)
# Tiny practical strip sits flush under the fixed shelf; emitter itself is modeled.
box('Cabinet light diffuser',(2.29,1.74,1.045),(1.6,.035,.018),material('Warm diffuser',(1,.45,.12),emit=3),.005,'props')
# Seated camera agrees with the browser: never switches to an overhead diorama.
bpy.ops.object.camera_add(location=(0,-4.8724,.877));camera=bpy.context.object;camera.name='Seated browser composition';camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='PERSP';camera.data.sensor_fit='VERTICAL';camera.data.angle=math.radians(33);camera.data.shift_x=-.16;scene.camera=camera
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(WORK/'atelier-preview.png')
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'tools/workshop-scene/workshop-source.blend'),compress=True)
bpy.ops.render.render(write_still=True)
if not BAKE:sys.exit(0)
# Capture the actual room from the inspection center for dynamic object reflections.
old_rotation=camera.rotation_euler.copy();old_location=camera.location.copy()
camera.location=(0,0,0);camera.rotation_euler=(math.pi/2,0,0);camera.data.type='PANO';camera.data.panorama_type='EQUIRECTANGULAR'
scene.render.resolution_x=1024;scene.render.resolution_y=512;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='HDR';scene.render.filepath=str(OUT/'workshop-probe.hdr');bpy.ops.render.render(write_still=True)
camera.data.type='PERSP';camera.rotation_euler=old_rotation;camera.location=old_location;scene.render.image_settings.file_format='PNG'

# Bake separate atlases to retain resolution on tools while the room gets broad light.
# Preserve imported surface UVs explicitly before adding/packing a lightmap UV set.
meshes=[o for o in scene.objects if o.type=='MESH' and o.get('atlas')!='reflection_only']
for o in meshes:
 if o.data.uv_layers:o.data.uv_layers[0].name='SurfaceUV'
 else:o.data.uv_layers.new(name='SurfaceUV')
 for mat in o.data.materials:
  if not mat or not mat.use_nodes:continue
  for node in list(mat.node_tree.nodes):
   if node.type=='TEX_IMAGE' and not node.inputs['Vector'].is_linked:
    uv=mat.node_tree.nodes.new('ShaderNodeUVMap');uv.uv_map='SurfaceUV';mat.node_tree.links.new(uv.outputs[0],node.inputs['Vector'])
# Merge each authored layer before baking: four coherent draw calls and one bake
# per atlas. Original material UVs stay intact; the printed mat uses explicit UVs.
for key in ['room','bench','props','mat']:
 bpy.ops.object.select_all(action='DESELECT')
 members=[o for o in scene.objects if o.type=='MESH' and o.get('atlas')==key]
 for o in members:o.select_set(True)
 bpy.context.view_layer.objects.active=members[0];bpy.ops.object.join()
 bpy.context.object.name='Workshop '+key;bpy.context.object['atlas']=key
meshes=[o for o in scene.objects if o.type=='MESH' and o.get('atlas')!='reflection_only']
baked_groups=[]
for key,res in [('room',2048),('bench',2048),('props',2048),('mat',2048)]:
 members=[o for o in meshes if o.get('atlas')==key]
 # Per-object unwrap then packing as a group preserves local Generated coordinates.
 bpy.ops.object.select_all(action='DESELECT')
 for o in members:
  o.select_set(True);bpy.context.view_layer.objects.active=o
  uv=o.data.uv_layers.new(name='LightmapUV');o.data.uv_layers.active=uv
 bpy.context.view_layer.objects.active=members[0]
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.006);bpy.ops.object.mode_set(mode='OBJECT')
 image=bpy.data.images.new('Workshop '+key,width=res,height=res,float_buffer=True);image.generated_color=(0,0,0,1)
 mats=set(m for o in members for m in o.data.materials if m)
 # Materials must not share the active bake target with another group (processed sequentially).
 for mat in mats:
  node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;node.select=True;mat.node_tree.nodes.active=node
 scene.render.bake.use_clear=True;scene.render.bake.margin=12;scene.render.bake.margin_type='EXTEND';scene.cycles.samples=32
 bpy.ops.object.bake(type='COMBINED',uv_layer='LightmapUV',pass_filter={'DIRECT','INDIRECT','COLOR','DIFFUSE','GLOSSY','EMIT'})
 scene.render.image_settings.color_depth='8'
 image.file_format='PNG';image.save_render(filepath=str(WORK/f'{key}-baked.png'),scene=scene)
 # Bake color is display-referred after AgX. Runtime uses unlit, untone-mapped material.
 baked=bpy.data.images.load(str(WORK/f'{key}-baked.png'))
 bm=bpy.data.materials.new('BAKED_'+key);bm.use_nodes=True;nodes=bm.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');tx=nodes.new('ShaderNodeTexImage');tx.image=baked;uv=nodes.new('ShaderNodeUVMap');uv.uv_map='LightmapUV';bm.node_tree.links.new(uv.outputs[0],tx.inputs[0]);bm.node_tree.links.new(tx.outputs[0],em.inputs[0]);bm.node_tree.links.new(em.outputs[0],out.inputs[0])
 baked_groups.append((members,bm))
# Keep original shading for every bake; switch materials only after all groups finish.
for members,bm in baked_groups:
 for o in members:
  o.data.materials.clear();o.data.materials.append(bm)
  for poly in o.data.polygons:poly.material_index=0
  old=o.data.uv_layers.get('SurfaceUV')
  if old:o.data.uv_layers.remove(old)
  o.data.uv_layers.active_index=0
# Export only scene meshes. Lights stay in the authored source and are represented
# by the runtime key for moving anatomy; static bounce and contact shadows are baked.
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'workshop.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_materials='EXPORT',export_image_format='JPEG',export_jpeg_quality=95,export_cameras=False,export_lights=False)
(OUT/'manifest.json').write_text(json.dumps({'authoring':'Blender 4.5 / Cycles','atlasCount':4,'atlasSize':2048,'files':[{'file':name,'bytes':(OUT/name).stat().st_size,'sha256':hashlib.sha256((OUT/name).read_bytes()).hexdigest()} for name in ['workshop.glb','workshop-probe.hdr']]},indent=2)+'\n')
print('WORKSHOP_BAKE_COMPLETE')
