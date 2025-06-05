import { getServerStatus } from './healthMonitor.js';
import fs from 'fs';
const botServers = JSON.parse(fs.readFileSync(new URL('../config/botServers.json', import.meta.url), 'utf-8'));

// Assigns user to the healthiest/least-loaded server
export async function assignServerForUser() {
  const status = await getServerStatus();
  // Filter only healthy servers and not overloaded
  const healthyServers = botServers.filter(s => {
    const serverStatus = status[s.id];
    return serverStatus?.healthy && (serverStatus.load || 0) < (s.maxLoad || 1);
  });
  if (!healthyServers.length) return null;
  // Pick the one with the lowest load
  healthyServers.sort((a, b) => (status[a.id].load || 0) - (status[b.id].load || 0));
  const assignedServer = healthyServers[0].id;
  console.log(`[LOAD BALANCER] Assigned server: ${assignedServer}`);
  return assignedServer;
}