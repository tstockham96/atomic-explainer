/** Anchored human review. These scores are not inferred from mesh counts or unit tests. */
export const RUBRIC = [
  {id:'composition',area:'design',question:'Is the object the visual focus, with deliberate spacing and no text/object collisions?'},
  {id:'typography',area:'design',question:'Are the hierarchy, line lengths, contrast and small-screen text comfortable to read?'},
  {id:'continuity',area:'design',question:'Does forward and reverse scrolling feel like one continuous physical exploration?'},
  {id:'pacing',area:'design',question:'Does each movement teach something, without empty waits or repetitive full turns?'},
  {id:'controls',area:'design',question:'Can a first-time visitor discover scrolling, inspect freely, navigate by keyboard and recover their place?'},
  {id:'accessibility',area:'design',question:'Can reduced-motion and narrow-screen users reach all explanations without forced animation?'},
  {id:'identity',area:'model',question:'Do proportions and identifying details match the exact object and variant in inspected references?'},
  {id:'anatomy',area:'model',question:'Are independently explorable components, hidden faces, interfaces and openings coherent and evidence-based?'},
  {id:'materials',area:'model',question:'Do every component’s finish, grain, roughness and reflections match references under the same light?'},
  {id:'optics',area:'model',question:'Do all optical solids retain transparency, plausible profiles, visible edges and moving reflections?'},
  {id:'detail',area:'model',question:'Are markings, inlays, seams and cutouts correctly supported by geometry, including the reverse?'},
  {id:'mechanism',area:'model',question:'Does the revealed geometry explain causal relationships rather than merely separate decorative shapes?'},
] as const

export const SCORE_ANCHORS = {
  0:'Absent or misleading; the learner cannot use this aspect.',
  1:'Major visible failures; a replacement or substantial reconstruction is needed.',
  2:'Understandable prototype, with obvious inconsistencies or missing detail.',
  3:'Convincing and coherent at normal and close inspection; only minor gaps remain.',
  4:'Excellent against multiple exact-model references, including hidden/reverse views; independently reviewed.',
} as const
