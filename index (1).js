const os = require('os');
const osu = require('os-utils');
const path = require('path');
const chalk = require('chalk')
const gradient = require('gradient-string');
const express = require('express')
const app = express();
const config = require('./config.js')
const disk = require('diskusage');
const pidusage = require('pidusage');
const fs = require('fs');

app.use(express.static('public'));

const customGradient = gradient([
  '#cd30e0',
  '#b34af5',
  '#8d4bfb'
]);

function formatMemorySize(sizeInBytes) {
      return `${(sizeInBytes / 1024 / 1024).toFixed(2)} GB`;
    }

function getCpuUsage() {
  const cpus = os.cpus();
  let user = 0;
  let nice = 0;
  let sys = 0;
  let idle = 0;
  let irq = 0;
  for (let cpu in cpus) {
    user += cpus[cpu].times.user;
    nice += cpus[cpu].times.nice;
    sys += cpus[cpu].times.sys;
    idle += cpus[cpu].times.idle;
    irq += cpus[cpu].times.irq;
  }
  const total = user + nice + sys + idle + irq;

  return {
    total: total,
    idle: idle
  };
}

let startMeasure = getCpuUsage();

function calculateCpuUsage() {
  const endMeasure = getCpuUsage();
  const idleDifference = endMeasure.idle - startMeasure.idle;
  const totalDifference = endMeasure.total - startMeasure.total;
  const percentageCpu = 100 - (100 * idleDifference / totalDifference);
  startMeasure = endMeasure;
  return percentageCpu;
}

app.get('/' + config.apikey, async (req, res) => {
res.send({ success: true, key: config.apikey })
})

app.get('/stats', async (req, res) => {
  
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const usedMem = totalMem - freeMem;

  let totalDisk = 0;
  let usedDisk = 0;

  try {
    const diskInfo = await disk.check('/');
    totalDisk = diskInfo.total;
    usedDisk = diskInfo.total - diskInfo.free;
  } catch (err) {
    console.error('Error getting disk usage:', err);
  }

  const cpuCore = os.cpus().length;
  const cpuValue = cpuCore * 100;

  const cpuUsage = calculateCpuUsage();
    
    fs.readFile('/proc/meminfo', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  function getValue(label) {
    const regex = new RegExp(`${label}:\\s+(\\d+) kB`, 'i');
    const match = data.match(regex);
    return match ? parseInt(match[1], 10) : null;
  }

  const memTotal = getValue('MemTotal');
  const memFree = getValue('MemFree');
  const memAvailable = getValue('MemAvailable');
  const buffers = getValue('Buffers');
  const cached = getValue('Cached');
  const slab = getValue('Slab');

  const usedMemory = memTotal - memAvailable;

  const realUsedMemory = (memTotal - memFree - buffers - cached - slab) * 1024 ;
        
  res.json({
    osType: os.type(),
    upTime: os.uptime(),
    totalMem: totalMem,
    freeMem: freeMem,
    usedMem: realUsedMemory,
    cpuUsage: cpuUsage,
    numCpus: os.cpus().length,
    maxCpuUsage: cpuValue,
    usedDisk: usedDisk,
    totalDisk: totalDisk,
    maxMemUsage: Math.max(usedMem, freeMem),
    hostname: config.hostname,
    logo: config.logo,
    color: config.color
  });
         });
});

app.get('*', async (req, res) => {
  res.redirect("/");
})

app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(config.PORT, async () => {
const str = customGradient('Az api sikeresen elindult.');
/*
const str1 = customGradient(" ███████╗██████╗ ██╗  ██╗")
const str2 = customGradient(" ██╔════╝██╔══██╗██║ ██╔╝")
const str3 = customGradient(" ███████╗██████╔╝█████╔╝ ")
const str4 = customGradient(" ╚════██║██╔══██╗██╔═██╗ ")
const str5 = customGradient(" ███████║██║  ██║██║  ██╗")
const str6 = customGradient(" ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝")
console.log(str1);
console.log(str2);
console.log(str3);
console.log(str4);
console.log(str5);
console.log(str6);
console.log("")
*/
    
    const data = await fetch('https://api.ipify.org?format=json', {
            method: "GET",
        }).then(res => {
            return res.json();
        });
    
 /*   const data2 = await fetch('http://' + data.ip + ":" + config.PORT + "/stats", {
            method: "GET",
        }).then(res => {
            return res.json();
        });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

await sleep(1500);
    
  console.log(str);
  console.log(customGradient("--------------------------------"))
  console.log(customGradient("- Cpu usage: " + data2.cpuUsage.toFixed(2) + "%"))
  console.log(customGradient("- Memory usage: " + formatMemorySize(data2.usedMem)))
  console.log(customGradient("- Disk usage: " + formatMemorySize(data2.usedDisk)))
  console.log(customGradient("--------------------------------"))
  */
    console.log(str);
});
