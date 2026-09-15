#!/usr/bin/env node
/**
 * 将 extension/ 打包为 public/downloads/jenrimark-view-extension.zip
 * 供 /view/ 页面下载，便于换设备安装。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extDir = path.join(root, 'extension');
const outDir = path.join(root, 'public', 'downloads');
const zipFile = path.join(outDir, 'jenrimark-view-extension.zip');

if (!fs.existsSync(path.join(extDir, 'manifest.json'))) {
  console.error('extension/manifest.json not found');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);

function zipWithZipCli() {
  return spawnSync('zip', ['-r', zipFile, '.', '-x', '*.DS_Store'], {
    cwd: extDir,
    stdio: 'inherit',
  });
}

function zipWithTar() {
  return spawnSync('tar', ['-a', '-cf', zipFile, '.'], {
    cwd: extDir,
    stdio: 'inherit',
  });
}

function zipWithPowerShell() {
  const glob = path.join(extDir, '*');
  const ps = `Compress-Archive -Path '${glob}' -DestinationPath '${zipFile}' -Force`;
  return spawnSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'inherit' });
}

let result;
if (process.platform === 'win32') {
  result = zipWithPowerShell();
  if (result.status !== 0) result = zipWithTar();
} else {
  result = zipWithZipCli();
  if (result.status !== 0) result = zipWithTar();
}

if (result.status !== 0) {
  console.error('Failed to create zip. Install zip (mac/linux) or use Windows PowerShell 5+.');
  process.exit(1);
}

const stat = fs.statSync(zipFile);
console.log(`Created ${zipFile} (${(stat.size / 1024).toFixed(1)} KB)`);
