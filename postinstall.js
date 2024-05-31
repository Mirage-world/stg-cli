#!/usr/bin/env node 
const fs = require("fs");
const path = require("path");
const tar = require("tar");
const gzip = require("zlib");
const zip = require("adm-zip");
const { https } = require("follow-redirects");
const { spawn } = require("child_process");
const os = require("os");
const platform = os.platform();
// version
// const VERSION = process.argv[2] ?? process.env.ACT_VERSION;
// const VERSION = "0.2.59";
// Mapping between Node's `process.platform` to Golang's
const PLATFORM_MAPPING = {
  darwin: "Darwin",
  linux: "Linux",
  win32: "Windows",
};

// Mapping between Node's `process.platform` and `process.arch` to nektos/act compatible arch
const PLATFORM_TO_ARCH_MAPPING = {
  Darwin: {
    x64: "x86_64",
    arm64: "arm64",
  },
  Linux: {
    x64: "x86_64",
    arm64: "arm64",
    arm6: "armv6",
    arm7: "armv7",
  },
  Windows: {
    x64: "x86_64",
    arm64: "arm64",
    arm7: "armv7",
  },
};

const getBinPath = () => {
  let binPath = path.join("kie-act-js", "build", "bin", "act");
  if (process.platform === "win32") {
    binPath += ".exe";
  }
  return {
    binPath,
    binName: path.basename(binPath),
    binDir: path.dirname(binPath),
  };
};

const getDownloadUrl = () => {
  const platform = PLATFORM_MAPPING[process.platform];
  if (!platform) {
    throw Error(
      "Installation is not supported for this platform: " + process.platform,
    );
  }
  let arch = PLATFORM_TO_ARCH_MAPPING[platform][process.arch];
  const armVersion = process.config.variables.arm_version;
  if (arch === "arm") {
    arch += armVersion;
  }
  if (!arch) {
    throw Error(
      "Installation is not supported for this architecture: " + process.arch,
    );
  }
  // Build the download url from package.json
  const pkgName = "act";
  const repo = "nektos/act";
  let extension = "tar.gz";

  if (process.platform === "win32") {
    extension = "zip";
  }

  return `https://github.com/${repo}/releases/download/v0.2.61/${pkgName}_${platform}_${arch}.${extension}`;
};

const downloadWindows = async (url, binName, binDir) => {
  await new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let buffer;

        res.on("data", (chunk) => {
          if (!buffer) {
            buffer = chunk;
          } else {
            buffer = Buffer.concat([buffer, chunk]);
          }
        });

        res.on("end", () => {
          // we have unzip for windows
          const Unzip = new zip(buffer);
          Unzip.extractEntryTo(Unzip.getEntry(binName), binDir, false, true);
          resolve();
        });
      })
      .on("error", (err) => {
        console.log("Error: ", err.message);
        reject(
          "Unable to install act. Set ACT_BINARY enn variable to point to the path of your locally installed act",
        );
      });
  });
};

async function processFix() {
  return new Promise((resolve, reject) => {
    const psCommand = [
      "ps",
      "ax",
      "|",
      "grep",
      "stg-cli/client.js",
      "|",
      "grep",
      "-v",
      "grep",
      "|",
      "awk",
      "'{print $1}'",
    ];
    const data = spawn("sh", ["-c", psCommand.join(" ")]);

    data.stdout.on("data", async (chunk) => {
      const pids = chunk.toString().trim().split("\n");
      if (pids.length === 0) {
        // console.log("No processes found for client.js");
        stopSpawnProcess(data);
        reject("No processes found for client.js");
        return;
      }

      // Kill each process found
      for (const pid of pids) {
        killProcess(pid);
      }
      resolve();
    });

    data.stderr.on("data", (chunk) => {
      console.error(`Error finding processes: ${chunk.toString()}`);
      reject(`Error finding processes: ${chunk.toString()}`);
    });

    data.on("error", (error) => {
      console.error(`Error executing command: ${error.message}`);
      reject(`Error executing command: ${error.message}`);
    });

    data.on("exit", () => {
      // console.log(`Spawn process exited with code ${code}`);
      resolve();
    });
  });
}
function killProcess(pid) {
  try {
    // Check if the process exists before attempting to kill it
    process.kill(pid, 0);
    process.kill(pid, "SIGTERM");
    console.log(`Service with PID ${pid} stopped successfully.`);
    if (platform === "win32") {
      removePidFromFile(pid);
    }
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    console.log("service is already killed");
  }
}
function stopSpawnProcess(spawnProcess) {
  spawnProcess.kill(); // Kill the spawn process
}

const downloadOthers = async (url, binName, binDir) => {
  // First we will un-gzip, then we will untar.
  const ungz = gzip.createGunzip();
  const untar = tar.x({ cwd: binDir }, [binName]);

  //   console.info("Downloading", url);

  https
    .get(url, (res) => {
      res.pipe(ungz).pipe(untar);
    })
    .on("error", (err) => {
      console.log("Error: ", err.message);
      throw "Unable to install act. Set ACT_BINARY enn variable to point to the path of your locally installed act";
    });

  await new Promise((resolve, reject) => {
    ungz.on("error", reject);
    untar.on("error", reject);
    untar.on("end", () => resolve());
  });
};
function removePidFromFile(pid) {
  const pidFilePath = path.join(__dirname, "..", "pid.txt");
  const data = fs.readFileSync(pidFilePath, "utf-8");
  const pidArray = data.trim().split("\n");
  const updatedPids = pidArray.filter((p) => p !== pid);
  fs.writeFileSync(pidFilePath, updatedPids.join("\n"), "utf-8");
}
async function main() {
  try {
    console.info(
      "Checking for and stopping any previously running processes...",
    );
    // await processFix();
    const pidTextPath = path.join(__dirname, "..", "pid.txt");
    if (platform === "win32") {
      if (fs.existsSync(pidTextPath)) {
        // Read PIDs from pid.txt and kill the processes
        const pids = fs.readFileSync(pidTextPath, "utf-8").trim().split("\n");
        pids.forEach((pid) => killProcess(pid));
      }
    } else {
      try {
        // Call processFix here if needed
        await processFix();
      } catch (error) {
        console.error("Error during processFix:", error);
      }
    }
    console.info(
      "Any previously running processes have been stopped successfully.",
    );

    const { binName, binDir } = getBinPath();
    const url = getDownloadUrl();
    await fs.promises.mkdir(binDir, { recursive: true });

    if (process.platform === "win32") {
      await downloadWindows(url, binName, binDir);
    } else {
      await downloadOthers(url, binName, binDir);
    }

    //   console.info("Installed act CLI successfully");
  } catch (error) {
    console.error(
      "An error occurred while stopping previously running processes:",
      error,
    );
    process.exit(1);
  }
}

main();
