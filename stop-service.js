const fs = require("fs");
const path = require("path");

const pidFilePath = path.join(__dirname, "pid.txt");
const fileContent = fs.readFileSync(pidFilePath, "utf-8");
const data = JSON.parse(fileContent);
console.log(data);
function processObject(obj) {
  const pid = obj.pid;
  if (pid) {
    process.kill(pid, "SIGTERM");
    console.log(`Service with PID ${pid} stopped successfully.`);
  } else {
    console.log("Service PID not found. The service may not be running.");
  }
}

data.forEach(processObject);

fs.unlinkSync(pidFilePath);
