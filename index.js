#!/usr/bin/env node

const fs = require("fs");
const readline = require("readline");
const path = require("path");
const Table = require("cli-table3");
const { spawn } = require("child_process");
const yaml = require("yaml");
const os = require("os");
const args = process.argv.splice(process.execArgv.length + 2);
const userCommand = args[0];
const packageJson = require("./package.json");
const platform = os.platform();
const { v4: uuidv4 } = require("uuid");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getVersion() {
  return packageJson.version;
}
function generateNumericAppId() {
  const uuid = uuidv4(); // Generate a UUID
  const numericId = parseInt(uuid.replace(/\D/g, "").substring(0, 5)); // Convert UUID to a numeric value
  return numericId.toString().padStart(5, "0"); // Ensure 5-digit length
}

async function processFix() {
  return new Promise((resolve, reject) => {
    const psCommand =
      "ps ax | grep stg-cli/client.js | grep -v grep | awk '{print $1}'";
    const data = spawn("sh", ["-c", psCommand]);

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
function addPidToFile(pid) {
  const pidFilePath = path.join(__dirname, "..", "pid.txt");
  fs.appendFileSync(pidFilePath, pid + "\n", "utf-8");
}

function removePidFromFile(pid) {
  const pidFilePath = path.join(__dirname, "..", "pid.txt");
  const data = fs.readFileSync(pidFilePath, "utf-8");
  const pidArray = data.trim().split("\n");
  const updatedPids = pidArray.filter((p) => p !== pid);
  fs.writeFileSync(pidFilePath, updatedPids.join("\n"), "utf-8");
}
async function initializePackage() {
  const currentDir = process.cwd();
  const configFilePath = path.join(__dirname, "init.json");
  const pidFilePath = path.join(__dirname, "pid.json");
  const nohupFilePath = path.join(__dirname, "nohup.out");
  // const pidTextPath = path.join(__dirname, "..", "pid.txt");

  try {
    let initializedProjects = [];
    let initialized = false;

    if (!fs.existsSync(configFilePath)) {
      fs.writeFileSync(
        configFilePath,
        JSON.stringify({ initialized, initializedProjects }, null, 2),
        "utf-8",
      );
    } else {
      // Read data from init.json
      const data = fs.readFileSync(configFilePath, "utf-8");
      const jsonData = JSON.parse(data);
      initialized = jsonData.initialized || false;
      initializedProjects = jsonData.initializedProjects || [];
    }

    const projectName = path.basename(currentDir);
    if (initializedProjects.includes(projectName)) {
      console.log(`The project '${projectName}' has already been initialized.`);
      process.exit(1);
    }

    // Check if the project has already been initialized by checking the config file
    const projectInitialized = initializedProjects.some(
      (project) => project.projectName === projectName,
    );

    if (projectInitialized) {
      console.log(`The project '${projectName}' has already been initialized.`);
      process.exit(1);
    }

    // if (initialized) {
    //   console.log(`The project '${projectName}' has already been initialized.`);
    //   process.exit(1);
    // }

    // if (platform === "win32") {
    //   if (fs.existsSync(pidTextPath)) {
    //     // Read PIDs from pid.txt and kill the processes
    //     const pids = fs.readFileSync(pidTextPath, "utf-8").trim().split("\n");
    //     pids.forEach((pid) => killProcess(pid));
    //   }
    // } else {
    //   try {
    //     // Call processFix here if needed
    //     // await processFix();
    //   } catch (error) {
    //     console.error("Error during processFix:", error);
    //   }
    // }
    const child = spawn("node", [path.join(__dirname, "client.js")], {
      detached: true,
      stdio: [
        "ignore",
        fs.openSync(nohupFilePath, "a"),
        fs.openSync(nohupFilePath, "a"),
      ],
      cwd: currentDir,
    });
    const pid = child.pid.toString();
    const appId = generateNumericAppId();

    // Update init.json with the generated appId
    initializedProjects.push({ projectName, appId });
    fs.writeFileSync(
      configFilePath,
      JSON.stringify({ initialized: true, initializedProjects }, null, 2),
      "utf-8",
    );

    if (platform === "win32") {
      addPidToFile(pid);
    }

    const configAppsFile = path.join(__dirname, "configuredApplications.json");
    if (!fs.existsSync(configAppsFile)) {
      fs.writeFileSync(configAppsFile, "[]", "utf-8");
    }

    // Add entry to configuredApplications.json
    const configuredApp = {
      appId,
      repoId: null,
      status: null,
      path: null,
      uuid: null,
      appName: projectName, // Assuming appName is the same as projectName
    };
    updateConfiguredApplications(configuredApp);

    // Update pid.json file with the PID value
    try {
      const data = fs.readFileSync(pidFilePath, "utf-8");
      const existingData = JSON.parse(data);
      existingData.push({ projectName, pid, appId });
      fs.writeFileSync(
        pidFilePath,
        JSON.stringify(existingData, null, 2),
        "utf-8",
      );
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      fs.writeFileSync(
        pidFilePath,
        JSON.stringify([{ projectName, pid, appId }], null, 2),
        "utf-8",
      );
    }

    child.unref();
    console.log(`The project '${projectName}' is initialized successfully.`);
    process.exit(1);
  } catch (error) {
    console.error("Error initializing the package:", error);
    process.exit(1);
  }
}

function updateConfiguredApplications(newAppData) {
  const configAppsFile = path.join(__dirname, "configuredApplications.json");
  try {
    const configuredApplications = loadConfiguredApplications();
    configuredApplications.push(newAppData);
    fs.writeFileSync(
      configAppsFile,
      JSON.stringify(configuredApplications, null, 2),
      "utf-8",
    );
  } catch (error) {
    console.error("Error updating configuredApplications.json:", error);
  }
}

function saveConfiguredApplications(applications) {
  const configAppsFile = path.join(__dirname, "configuredApplications.json");
  const data = JSON.stringify(applications, null, 2);
  try {
    fs.writeFileSync(configAppsFile, data, "utf-8");
    console.log("File written successfully");
  } catch (error) {
    console.error("Error writing to the file:", error);
  }
}

function loadConfiguredApplications() {
  try {
    const data = fs.readFileSync(
      `${__dirname}/configuredApplications.json`,
      "utf-8",
    );
    return JSON.parse(data) || [];
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return [];
  }
}

async function start(appId) {
  console.log("Application ID:", appId);

  const configApps = loadConfiguredApplications();
  if (configApps?.length) {
    const app = configApps.filter((item) => item?.appId === appId);
    if (app?.length) {
      const lastIndexApp = app?.length === 1 ? app[0] : app[app?.length - 1];
      if (lastIndexApp?.status === "active") {
        console.log(
          `The application with appId: ${appId} is already running...`,
        );
        rl.close();
      } else {
        lastIndexApp.status = "active";
        saveConfiguredApplications(configApps);
        console.log(`The application with appId: ${appId} is started.`);
      }
    } else {
      console.log("No application found with the appId:", appId);
      rl.close();
    }
  } else {
    console.log("You haven't configured any application yet.");
    rl.close();
  }
}

async function stop(appId) {
  console.log("Application ID:", appId);

  const configApps = loadConfiguredApplications();
  if (configApps?.length) {
    const app = configApps.filter((item) => item.appId === appId);
    if (app?.length) {
      const lastIndexApp = app?.length === 1 ? app[0] : app[app?.length - 1];
      if (lastIndexApp?.status === "stopped") {
        console.log(`The application with appId: ${appId} is already stopped.`);
        rl.close();
      } else {
        lastIndexApp.status = "stopped"; // Update application status to STOPPED
        saveConfiguredApplications(configApps);
        console.log(`The application with appId: ${appId} is stopped.`);
      }
    } else {
      console.log("No application found with the appId:", appId);
      rl.close();
    }
  } else {
    console.log("You haven't configured any application yet.");
    rl.close();
  }
}

function findYmlFiles(jsonPayload) {
  const configApps = loadConfiguredApplications();
  const currentDir = process.cwd();
  const ymlFiles = [];

  function traverseDir(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      if (fs.statSync(filePath).isDirectory()) {
        if (
          path.basename(filePath) !== "node_modules" &&
          path.basename(filePath) !== "ios" &&
          path.basename(filePath) !== "android"
        ) {
          traverseDir(filePath);
        }
      } else if (file.endsWith("onetab-pipeline.yml")) {
        ymlFiles.push(filePath);
      }
    }
  }

  traverseDir(currentDir);
  console.log("YML files:", ymlFiles);

  if (ymlFiles?.length) {
    const pushEventPayload = JSON.parse(jsonPayload);
    const branchPush = pushEventPayload?.ref.replace("refs/heads/", "");

    let lastIndexApp = null;
    let filterConfigApps = null;
    if (configApps?.length) {
      filterConfigApps = configApps.filter(
        (obj) => obj?.repoId === pushEventPayload?.repository?.id,
      );
      if (filterConfigApps?.length) {
        lastIndexApp = filterConfigApps[filterConfigApps?.length - 1];
      }
    }

    const configAppsFile = path.join(__dirname, "configuredApplications.json");

    if (
      filterConfigApps?.length === 0 ||
      configApps?.length === 0 ||
      lastIndexApp?.status === "active"
    ) {
      for (const ymlFile of ymlFiles) {
        const fileContent = fs.readFileSync(ymlFile, "utf8");
        const workflowConfig = yaml.parse(fileContent);
        const ymlBranch = workflowConfig.on.push.branches[0];
        const app = {
          uuid: null,
          appId: null,
          repoId: pushEventPayload?.repository?.id,
          appName: pushEventPayload?.repository?.full_name,
          commitId: pushEventPayload?.head_commit?.id,
          status: "active",
          path: ymlFile,
          pushEventPayload,
          branch: branchPush,
          projectName: path.basename(currentDir),
        };
        if (
          filterConfigApps?.length === 0 ||
          configApps?.length === 0 ||
          lastIndexApp?.status === "active"
        ) {
          // Set appId from init.json
          const initFilePath = path.join(__dirname, "init.json");
          const initData = fs.readFileSync(initFilePath, "utf-8");
          const { initializedProjects } = JSON.parse(initData);
          const project = initializedProjects.find(
            (project) => project.projectName === app.projectName,
          );
          if (project) {
            app.appId = project.appId;
          } else {
            console.log(`Project '${app.appName}' not found in init.json`);
            continue; // Skip adding app to configApps if projectId not found
          }
          configApps.push(app);
          if (ymlBranch === branchPush) {
            saveConfiguredApplications(configApps, configAppsFile);
            return ymlFiles;
          } else {
            console.log("Branch mismatch");
          }
        } else {
          console.log("condition not match");
        }
      }
    } else {
      console.log("Failed to locate onetab-pipeline yml file.");
    }
  }
}

async function table() {
  const configApps = loadConfiguredApplications();
  if (configApps?.length) {
    const header = ["App ID", "Repo ID", "App Name", "Status", "Path", "UUID"];
    const table = new Table({
      head: header,
    });

    const tableData = [];
    configApps.forEach((app) => {
      const index = tableData.findIndex((obj) => obj?.appId === app?.appId);
      if (index === -1) {
        // Replace null values with a placeholder string
        const rowData = [
          app?.appId || "-",
          app?.repoId || "-",
          app?.appName || "-",
          app?.status || "ready",
          app?.path || "-",
          app?.uuid || "-",
        ];
        table.push(rowData);
      } else {
        // Replace null values with a placeholder string
        const rowData = [
          app?.appId || "-",
          app?.repoId || "-",
          app?.appName || "-",
          app?.status || "-",
          app?.path || "-",
          app?.uuid || "-",
        ];
        table.splice(index, 1, rowData);
      }
      tableData.push({
        appId: app?.appId,
        repoId: app?.repoId,
        appName: app?.appName,
        status: app?.status,
        path: app?.path,
        uuid: app?.uuid,
      });
    });
    return table.toString();
  }
  return "No data to display.";
}

function processObject(obj, index) {
  const pid = obj.pid;
  if (pid) {
    try {
      process.kill(pid, "SIGTERM");
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      console.log("The service has already been killed.");
    }
    console.log(`Service with PID ${pid} stopped successfully.`);
  } else {
    console.log(
      "Service PID not found. The service may not be running.",
      index,
    );
  }
}
async function kill(appId) {
  const pidFilePath = path.join(__dirname, "pid.json");
  const initPath = path.join(__dirname, "init.json");
  const configurePath = path.join(__dirname, "configuredApplications.json");
  const nohupPath = path.join(__dirname, "nohup.out");
  const actPidFilePath = path.join(
    __dirname,
    "kie-act-js",
    "build",
    "src",
    "act",
    "act_pid.json",
  ); // Adjusted path to act_pid.json

  try {
    if (!appId) {
      const fileContent = fs.existsSync(pidFilePath)
        ? fs.readFileSync(pidFilePath, "utf-8")
        : "[]";
      const data = JSON.parse(fileContent);

      data.forEach(processObject);

      [pidFilePath, initPath, configurePath, nohupPath, actPidFilePath].forEach(
        (filePath) => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        },
      );

      console.log("All services stopped and related files deleted.");
      return;
    }

    const fileContent = fs.existsSync(pidFilePath)
      ? fs.readFileSync(pidFilePath, "utf-8")
      : "[]";
    const data = JSON.parse(fileContent);

    const filteredData = data.filter((obj) => obj.appId === appId);

    if (filteredData.length === 0) {
      console.log(`No service found for appId '${appId}'.`);
      return;
    }
    filteredData.forEach((obj) => {
      const pid = obj.pid;
      if (pid) {
        try {
          process.kill(pid, "SIGTERM");
        } catch (error) {
          console.log(`Error killing service with PID ${pid}:`, error);
        }
        console.log(
          `Service with PID ${pid} for appId '${appId}' stopped successfully.`,
        );
      } else {
        console.log(
          `Service PID not found for appId '${appId}'. The service may not be running.`,
        );
      }
    });
    const initContent = fs.existsSync(initPath)
      ? fs.readFileSync(initPath, "utf-8")
      : "{}";
    const initJsonData = JSON.parse(initContent);
    const updatedInitializedProjects = initJsonData.initializedProjects
      ? initJsonData.initializedProjects.filter((obj) => obj.appId !== appId)
      : [];
    fs.writeFileSync(
      initPath,
      JSON.stringify(
        { initialized: true, initializedProjects: updatedInitializedProjects },
        null,
        2,
      ),
      "utf-8",
    );

    const configContent = fs.existsSync(configurePath)
      ? fs.readFileSync(configurePath, "utf-8")
      : "[]";
    const configJsonData = JSON.parse(configContent);
    const updatedConfigApps = configJsonData.filter(
      (app) => app?.appId !== appId,
    );
    fs.writeFileSync(
      configurePath,
      JSON.stringify(updatedConfigApps, null, 2),
      "utf-8",
    );

    // Remove the appId's PID data from pid.json
    const updatedData = data.filter((obj) => obj.appId !== appId);
    fs.writeFileSync(
      pidFilePath,
      JSON.stringify(updatedData, null, 2),
      "utf-8",
    );

    console.log(`App with appId '${appId}' has been terminated.`);
  } catch (error) {
    console.error("Error killing the service:", error);
  }
}

module.exports = { findYmlFiles, processFix };

switch (userCommand) {
  case "init":
    initializePackage();
    break;

  case "start":
    (async () => {
      start(args[1]);
      process.exit(1);
    })();
    break;
  case "stop":
    (async () => {
      stop(args[1]);
      process.exit(1);
    })();
    break;
  case "apps":
    (async () => {
      const appsTable = await table();
      console.log(appsTable);
      process.exit(1);
    })();
    break;

  case "kill":
    (async () => {
      kill(args[1]);
      process.exit(1);
    })();
    break;

  case "-v": // Handle version command
    (async () => {
      console.log(` v${getVersion()}`);
      process.exit(1);
    })();
    break;
  case "-help":
    (async () => {
      console.info(`
      Usage: stg-cli <command>
      Command List:
        1. stg-cli init 
        2. stg-cli start appId 
        3. stg-cli stop appId 
        4. stg-cli apps 
        5. stg-cli kill
        6. stg-cli -help 
        7. stg-cli -v
      `);
      process.exit(1);
    })();
    break;
  default:
    console.log(
      'Run command "stg-cli -help" to see the list of available commands.',
    );
}
