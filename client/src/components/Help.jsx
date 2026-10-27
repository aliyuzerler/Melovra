import { Window } from './ui/Window.jsx';
import { SHORTCUTS } from '../lib/keyboard.js';
import { useStore } from '../state/store.js';

export function Help() {
  const st = useStore.getState();
  const openApi = () => { useStore.setState({ settingsTab: 'api' }); st.openWindow('settings'); };
  return (
    <Window name="help" title="Yardım — kısayollar ve Claude" icon="keyboard" minW={420} minH={300}>
      <div className="help">
        <h3>Claude ile müzik yap (MCP)</h3>
        <p>Melovra, Claude'un kanallar oluşturması, davul, akor ve melodileri yazması,
          yüklediğiniz ve kaydettiğiniz sample'ları kullanması (bit hızlarını, sample rate'lerini, ses yüksekliklerini,
          temposunu, tonunu ve perdelerini görür; dosyaları klasörlere yerleştirir, düzenleyip oto-tune edebilir), şarkıyı düzenlemesi,
          mikslemesi, render alıp mixdown'ı analiz etmesi, sürüm kaydetmesi ve oynatması için 70'ten fazla araca sahip
          bir MCP sunucusu sunar — hepsi bu pencerede canlı yürür.</p>
        <p><button className="btn primary" onClick={openApi}>Ayarlar → API & MCP'yi Aç</button> ile Claude Code ve Claude Desktop için kopyala-yapıştır kurulumunu görün ve kişisel API token'ınızı oluşturun.</p>
        <p>Dene: <i>“80 BPM'de caz akorlarıyla bir lo-fi beat yap, -14 LUFS'a miksle, sonra çal.”</i></p>
        <h3>Klavye kısayolları</h3>
        <table className="shortcuts">
          <tbody>
            {SHORTCUTS.map(([k, d]) => <tr key={k}><td><kbd>{k}</kbd></td><td>{d}</td></tr>)}
          </tbody>
        </table>
      </div>
    </Window>
  );
}
