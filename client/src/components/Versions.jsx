import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../state/store.js';
import { api } from '../state/api.js';
import { Window } from './ui/Window.jsx';
import { Icon } from './ui/Icon.jsx';

/** Named snapshots of the current project (also created by Claude via save_version). */
export function Versions() {
  const project = useStore((s) => s.project);
  const open = useStore((s) => s.windows.versions?.open);
  const versionsRev = useStore((s) => s.versionsRev);
  const st = useStore.getState();
  const [list, setList] = useState(null);
  const pid = project?.id;

  const load = useCallback(() => {
    if (!pid) return;
    api.listVersions(pid).then(setList).catch((e) => useStore.getState().toast(e.message, 'error'));
  }, [pid]);
  useEffect(() => { if (open) load(); }, [open, load, versionsRev]);

  if (!project) return null;
  const save = async () => {
    const name = await st.prompt({ title: 'Sürüm kaydet', value: `${project.name} — ${new Date().toLocaleString()}` });
    if (name === null) return;
    try {
      await api.saveVersion(pid, name);
      st.toast('Sürüm kaydedildi', 'success');
      load();
    } catch (e) { st.toast(e.message, 'error'); }
  };
  const restore = async (v) => {
    if (!(await st.confirm({ title: `"${v.name}" geri yüklensin mi?`, message: 'Mevcut durum değiştirilecek (korumak istiyorsanız önce bir sürüm kaydedin). Ctrl+Z ile geri alabilirsiniz.', okLabel: 'Geri Yükle' }))) return;
    try {
      const r = await api.restoreVersion(pid, v.id);
      st.setProjectFromServer(r.project);
      st.toast('Sürüm geri yüklendi', 'success');
    } catch (e) { st.toast(e.message, 'error'); }
  };
  const remove = async (v) => {
    if (!(await st.confirm({ title: `"${v.name}" sürümü silinsin mi?`, danger: true, okLabel: 'Sil' }))) return;
    await api.deleteVersion(pid, v.id).catch((e) => st.toast(e.message, 'error'));
    load();
  };

  return (
    <Window name="versions" title={`Sürümler — ${project.name}`} icon="history" minW={360} minH={220}
      toolbar={<button className="btn tiny primary" onClick={save}><Icon name="plus" size={12} /> Sürüm kaydet</button>}>
      <div className="versions">
        {list === null && <div className="spinner" />}
        {list?.length === 0 && <p className="empty-hint">Henüz sürüm yok. Büyük değişikliklerden önce bir tane kaydedin — Claude da denemeden önce sürüm kaydedebilir (save_version).</p>}
        {list?.map((v) => (
          <div key={v.id} className="version-row">
            <div className="version-info">
              <b>{v.name}</b>
              <span className="muted">{new Date(v.createdAt).toLocaleString()} · {v.bpm} BPM · {v.channels} kanal · {v.patterns} pattern</span>
            </div>
            <button className="btn tiny" onClick={() => restore(v)}>Geri Yükle</button>
            <button className="tbtn small" title="Sil" onClick={() => remove(v)}><Icon name="trash" size={13} /></button>
          </div>
        ))}
      </div>
    </Window>
  );
}
