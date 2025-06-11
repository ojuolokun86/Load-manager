import { getServerStatus } from './healthMonitor.js';
import fs from 'fs';
const botServers = JSON.parse(fs.readFileSync(new URL('../config/botServers.json', import.meta.url), 'utf-8'));

// Assigns user to the healthiest/least-loaded server
export async function assignServerForUser() {
  const status = await getServerStatus();

  // Always try VPS first, up to 50 bots
  const vps = botServers.find(s => s.id === 'VPS');
  const vpsStatus = status['VPS'];
  if (vps && vpsStatus?.healthy && (vpsStatus.load || 0) < 50) {
    console.log(`[LOAD BALANCER] Assigned server: VPS`);
    return 'VPS';
  }

  // If VPS is full or unhealthy, use other healthy servers (not overloaded)
  const healthyServers = botServers.filter(s => {
    if (s.id === 'VPS') return false;
    const serverStatus = status[s.id];
    return serverStatus?.healthy && (serverStatus.load || 0) < (s.maxLoad || 1);
  });
  if (!healthyServers.length) return null;
  healthyServers.sort((a, b) => (status[a.id].load || 0) - (status[b.id].load || 0));
  const assignedServer = healthyServers[0].id;
  console.log(`[LOAD BALANCER] Assigned server: ${assignedServer}`);
  return assignedServer;
}