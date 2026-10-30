'use strict';
// Advisory release-readiness report. Never mistake CI success for a certified v1.0.
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const exists = p => fs.existsSync(path.join(root, p));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const checks = [
  {id:'LOCKFILE',pass:exists('package-lock.json'),detail:'Committed npm lockfile required for npm ci and reproducible installs'},
  {id:'SOURCE',pass:['src/game.ts','src/tactics.ts','src/pixi-layer.ts'].every(exists),detail:'Core TypeScript sources exist'},
  {id:'REGRESSION',pass:exists('qa-v094.cjs')&&exists('qa-v094-browser.py'),detail:'v0.94 regression suites exist (presence only; not executed here)'},
  {id:'CAMPAIGN_EVIDENCE',pass:exists('evidence/v095-legitimate-campaign.json'),detail:'Independent legitimate five-sector victory evidence must be reviewed manually'},
  {id:'PHYSICAL_DEVICE_EVIDENCE',pass:exists('evidence/v095-physical-devices.json'),detail:'Real-device matrix evidence must be reviewed manually'},
  {id:'RELEASE_DOCS',pass:exists('AUDITORIA-LANZAMIENTO-v094.md'),detail:'Launch audit document exists'}
];
const report={version:pkg.version,releaseCertified:false,checks,blocking:checks.filter(c=>!c.pass).map(c=>c.id)};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--strict')&&report.blocking.length)process.exitCode=1;
