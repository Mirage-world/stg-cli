const socketIOClient = require("socket.io-client");
const os = require("os");
// const shell = require("shelljs");
const { findYmlFiles } = require("./index.js");
const { Act } = require("./kie-act-js/build/src/index.js");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const yaml = require("yaml");
const act = new Act();
const pidFilePath = path.join(__dirname, "pid.json");

function startClient() {
  // const socket = socketIOClient("https://services.onetab.ai/");
  // const socket = socketIOClient("http://localhost:3008/");
  // const socket = socketIOClient("https://stg-services.onetab.ai/");

  // const dockerCommandQueue = [];
  // let isExecutingDockerCommand = false;
  const socket = socketIOClient("https://stg-services.onetab.ai/", {
    query: {
      repoFullname: extractRepoFullNameFromYaml(),
    },
    maxHttpBufferSize: 10 * 1024 * 1024,
  });

  async function executeDockerCommands(uuid) {
    try {
      // const platform = os.platform();
      // const dockerCommand =
      //   platform === "win32"
      //     ? "start Docker.exe"
      //     : platform === "darwin"
      //     ? "open -a Docker"
      //     : "docker";
      await datafetch(uuid);
      // await new Promise((resolve, reject) => {
      //   // shell.exec(dockerCommand, { async: true }, (code, stdout, stderr) => {
      //   //   if (code === 0) {
      //   // console.log("Docker command executed successfully");
      //   datafetch(uuid).then(resolve).catch(reject);
      //   // } else {
      //   //   console.error("Error executing Docker command:", stderr);
      //   //   reject(new Error(stderr));
      //   // }
      //   // });
      // });
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      console.error("A Pipeline has been Terminated");
    }
  }

  socket.on("sendDataToPackage", async (payload) => {
    console.log(`Client: Received payload from backend: ${payload}`);
    const jsonPayload = JSON.stringify(payload.gitPayload);
    const userAccount = payload.userAccount;
    console.log(`Client: Received json payload from backend: ${jsonPayload}`);
    if (payload) {
      const fileContent = fs.existsSync(pidFilePath)
        ? fs.readFileSync(pidFilePath, "utf-8")
        : "[]";
      const currentDir = process.cwd();
      const lastWord = currentDir.substring(currentDir.lastIndexOf('/') + 1);
      const filecheck = JSON.parse(fileContent);
      const ymlFiles = findYmlFiles(jsonPayload, userAccount);
      // console.log(ymlFiles, '-----------------------------------------------------------------');
      if (ymlFiles?.length) {
        if (filecheck.find(project => project.pathKey === currentDir && project.runStatus === true) || filecheck.every(project => project.runStatus === false)) {
          filecheck.forEach(project => {
            if (project.pathKey === currentDir) {
              project.runStatus = true;
            }
          });
          fs.writeFileSync(pidFilePath, JSON.stringify(filecheck, null, 2), 'utf-8');
          executeDockerCommands(payload.uuid);

        }
        else {
          filecheck.forEach(project => {
            if (project.projectName === lastWord) {
              project.Queue = true;
            }
          });
          const data = await act.list();
          const queuedLogsData = {
            jsonPayload,
            conclusion: "queued",
            workflowName: data[1]?.workflowName,

          };
          socket.emit("queuedLogsData", queuedLogsData);

          const indpid = filecheck.findIndex(project => project.projectName === lastWord)
          fs.writeFileSync(pidFilePath, JSON.stringify(filecheck, null, 2), 'utf-8');
          const intervalId = setInterval(() => {
            const fileContents = fs.existsSync(pidFilePath)
              ? fs.readFileSync(pidFilePath, "utf-8")
              : "[]";
            const filechecks = JSON.parse(fileContents);
            if (filechecks.every(project => project.runStatus === false) && filechecks.slice(0, indpid).every(project => project.Queue === false)) {
              clearInterval(intervalId);
              filechecks.forEach(project => {
                if (project.projectName === lastWord) {
                  project.Queue = false;
                }
              });

              fs.writeFileSync(pidFilePath, JSON.stringify(filechecks, null, 2), 'utf-8');


              filechecks.forEach(project => {
                if (project.projectName === lastWord) {
                  project.runStatus = true;
                }
              });
              fs.writeFileSync(pidFilePath, JSON.stringify(filechecks, null, 2), 'utf-8');
              executeDockerCommands(payload.uuid);

            }
          }, 1000);
        }
      } else {
        console.log(
          "sorry we can't push an event because either you stopped your application or  branch mismatch",
        );
      }
    }
  });

  const workStep = async (uuid) => {
    try {
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
      console.log("YML files:", ymlFiles[0]);
      const fileContents = fs.readFileSync(ymlFiles[0], "utf8");
      const yamlObject = yaml.parse(fileContents);
      if (yamlObject) {
        const firstJobInWorkflow = yamlObject.jobs;
        const data = firstJobInWorkflow[Object.keys(firstJobInWorkflow)].steps;
        const steps = [];
        data.forEach(function (obj, index) {
          const res = obj?.name ?? obj?.uses ?? obj?.run;
          steps.push({ step: res.trim(), uuid, index: index + 1 });
        });
        console.log(steps);
        steps.length > 0 && socket.emit("steps", steps);
      } else {
        console.error(
          'Invalid YAML file format. Ensure it contains "workflows" property.',
        );
      }
    } catch (error) {
      console.log(error);
    }
  };
  const datafetch = async (uuid) => {
    let uniqueId = uuid;
    if (uuid === null) {
      uniqueId = uuidv4();
    }
    const data = await act.list();
    console.log("workflow list-->", data);
    await workStep(uniqueId);
    const currentDir = process.cwd();
    const homedir = os.homedir();
    const relativePath = path.relative(homedir, currentDir);
    const result = await act
      .setEnv("relativePath", relativePath)
      .setEnv("workDir", currentDir)
      .runEvent("push", { verbose: true, uuid: uniqueId });
    for (let i = 0; i < result.result.length; i++) {
      result.result[i].output = null;
    }
    const fileContent = fs.existsSync(pidFilePath)
      ? fs.readFileSync(pidFilePath, "utf-8")
      : "[]";
    const lastWord = currentDir.substring(currentDir.lastIndexOf('/') + 1);
    const filecheck = JSON.parse(fileContent);

    filecheck.forEach(project => {
      if (project.projectName === lastWord) {
        project.runStatus = false;
      }
    });
    fs.writeFileSync(pidFilePath, JSON.stringify(filecheck, null, 2), 'utf-8');
    socket.emit("workflowResult", result);
  };
}

function extractRepoFullNameFromYaml(searchPath = process.cwd()) {
  try {
    let yamlFilePath = null;

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
          yamlFilePath = filePath;
          break;
        }
      }
    }

    traverseDir(searchPath);

    if (!yamlFilePath) {
      console.log("Failed to locate onetab-pipeline yml file.");
      return null;
    }

    const fileContent = fs.readFileSync(yamlFilePath, "utf8");
    const yamlData = yaml.parse(fileContent);
    const repoFullName = yamlData?.repoFullName;

    return repoFullName;
  } catch (error) {
    console.error(
      "Error extracting repository full name from onetab-pipeline.yml:",
      error.message,
    );
    return null;
  }
}

startClient();