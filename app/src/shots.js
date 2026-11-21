// Fixed scenes for screenshots. `?shot=cover` shows the poster alone,
// `?shot=editor` shows the editor with a photo loaded. Extra query keys
// pick the layout, grade, sample photo, title and subtitle. Once the
// scene has painted, window.__shotReady is set for the screenshot tool.
export function shotState(query) {
  const shot = query.get('shot') || 'editor';
  if (shot === 'cover') document.body.classList.add('shot-cover');
  return {
    shot,
    layout: query.get('layout') || 'triptych',
    grade: query.get('grade') || 'sunset',
    photo: query.get('photo') || 'pier',
    title: query.get('title') || 'Vice Nights',
    subtitle: query.get('subtitle') || 'A Leonida Story',
    size: query.get('size') || 'square',
  };
}

export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
