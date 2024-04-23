"use strict";
const __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.Act = void 0;
const child_process_1 = require("child_process");
const act_constants_1 = require("../act/act.constants");
const os = require("os");
const fs = require("fs");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path = require("path");
const path_1 = __importDefault(require("path"));
const os_1 = require("os");
const proxy_1 = require("../proxy/proxy");
const argument_map_1 = require("../map/argument-map");
const step_mocker_1 = require("../step-mocker/step-mocker");
const action_event_1 = require("../action-event/action-event");
const output_parser_1 = require("../output-parser/output-parser");
const action_input_1 = require("../action-input/action-input");
const yaml = require("js-yaml");
const check = false;
// let skippedSteps = [];
const axios = require("axios");
const socketIOClient = require("socket.io-client");
const socket = socketIOClient("https://stg-services.onetab.ai/", {
  query: {
    repoFullname: extractRepoFullNameFromYaml(),
  },
  maxHttpBufferSize: 10 * 1024 * 1024,
});

// Generate uuid
// const { v4: uuidv4 } = require("uuid");
const currentDir = __dirname;

async function deleteWorkflowRun(uuid) {
  const graphqlQuery = `
    mutation {
      deleteWorkflowRunByUuid(uuid: "${uuid}")
    }
  `;

  const url = "https://stg-cicd.onetab.ai/api/graphql";
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(
      url,
      { query: graphqlQuery },
      { headers },
    );
    const data = response.data;
    console.log(data);
  } catch (error) {
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error:", error.message);
    }
  }
}
const twoFoldersUp = path.resolve(currentDir, "..", "..", "..", "..");
console.log(twoFoldersUp);
const configAppsFile = path.join(twoFoldersUp, "configuredApplications.json");

function loadConfiguredApplications() {
  try {
    const data = fs.readFileSync(configAppsFile, "utf-8");
    return JSON.parse(data) || [];
  } catch (error) {
    console.log(error);
    return [];
  }
}

function saveConfiguredApplications(applications) {
  const data = JSON.stringify(applications, null, 2);
  try {
    fs.writeFileSync(configAppsFile, data, "utf-8");
    console.log("Uuid updated successfully");
  } catch (error) {
    console.error("Error writing to the file:", error);
  }
}
// function chunkString(str, chunkSize) {
//     const chunks = [];
//     console.log('logitech',str,str.length)
//     for (let i = 0; i < str.length; i += chunkSize) {
//         chunks.push(str.substr(i, chunkSize));
//     }
//     return chunks;
// }
const chunkSize = 1024 * 800; // Define your chunk size

function chunkString(arr, chunkSize) {
  const chunks = [];
  // console.log("logitech", arr, arr.length);
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

class Act {
  constructor(cwd, workflowFile, defaultImageSize) {
    this.currentWorkflowName = null;
    this.secrets = new argument_map_1.ArgumentMap("-s");
    this.cwd = cwd ?? process.cwd();
    this.workflowFile =
      workflowFile ??
      `${this.cwd}${
        os.platform == "win32" ? "//.onetab//workflows" : "/.onetab/workflows"
      }`;
    this.env = new argument_map_1.ArgumentMap("--env");
    this.matrix = new argument_map_1.ArgumentMap("--matrix", ":");
    this.platforms = new argument_map_1.ArgumentMap("--platform");
    this.event = new action_event_1.ActionEvent();
    this.input = new action_input_1.ActionInput(this.event);
    this.containerOpts = {};
    this.setDefaultImage(defaultImageSize);
    this.setGithubStepSummary("/dev/stdout");
  }

  setCwd(cwd) {
    this.cwd = cwd;
    return this;
  }

  setWorkflowFile(workflowFile) {
    this.workflowFile = workflowFile;
    return this;
  }

  setSecret(key, val) {
    this.secrets.map.set(key, val);
    return this;
  }

  deleteSecret(key) {
    this.secrets.map.delete(key);
    return this;
  }

  clearSecret() {
    this.secrets.map.clear();
    return this;
  }

  setEnv(key, val) {
    this.env.map.set(key, val);
    return this;
  }

  deleteEnv(key) {
    this.env.map.delete(key);
    return this;
  }

  clearEnv() {
    this.env.map.clear();
    this.setGithubStepSummary("/dev/stdout");
    return this;
  }

  setGithubToken(token) {
    this.setSecret("GITHUB_TOKEN", token);
    return this;
  }

  setGithubStepSummary(file) {
    this.setEnv("GITHUB_STEP_SUMMARY", file);
    return this;
  }

  setEvent(event) {
    this.event.event = event;
    return this;
  }

  setInput(key, val) {
    this.input.map.set(key, val);
    return this;
  }

  deleteInput(key) {
    this.input.map.delete(key);
    return this;
  }

  clearInput() {
    this.input.map.clear();
    return this;
  }

  setMatrix(key, val) {
    this.matrix.map.set(key, val);
    return this;
  }

  deleteMatrix(key) {
    this.matrix.map.delete(key);
    return this;
  }

  clearMatrix() {
    this.matrix.map.clear();
    return this;
  }

  setPlatforms(key, val) {
    this.platforms.map.set(key, val);
    return this;
  }

  deletePlatforms(key) {
    this.platforms.map.delete(key);
    return this;
  }

  clearPlatforms() {
    this.platforms.map.clear();
    return this;
  }

  setContainerArchitecture(val) {
    this.containerOpts.containerArchitecture = val;
    return this;
  }

  setContainerDaemonSocket(val) {
    this.containerOpts.containerDaemonSocket = val;
    return this;
  }

  setCustomContainerOpts(val) {
    this.containerOpts.containerOptions = val;
    return this;
  }

  clearAllContainerOpts() {
    this.containerOpts = {};
    return this;
  }

  /**
   * List available workflows.
   * If working directory is not specified then node's current working directory is used
   * You can also list workflows specific to an event by passing the event name
   * @param cwd
   * @param workflowFile
   * @param event
   */
  async dryRun(event, cwd = this.cwd, workflowFile = this.workflowFile, uuid) {
    const args = ["-W", workflowFile, "-n"];
    const data = await this.act(
      cwd,
      undefined,
      uuid,
      ...(event ? [event, ...args] : args),
    );
    return data;
  }

  async list(event, cwd = this.cwd, workflowFile = this.workflowFile) {
    const args = ["-W", workflowFile, "-l"];
    const data = await this.act(
      cwd,
      undefined,
      "-W",
      ...(event ? [event, ...args] : args),
    );
    return data
      .split("\n")
      .slice(1, -1) // remove first (title columns) and last column
      .filter((element) => element !== "" && element.split("  ").length > 1) // remove empty strings and warnings
      .map((element) => {
        const splitElement = element.split("  ").filter((val) => val !== ""); // remove emoty strings
        this.currentWorkflowName = splitElement[3]?.trim();
        return {
          jobId: splitElement[1]?.trim(),
          jobName: splitElement[2]?.trim(),
          workflowName: splitElement[3]?.trim(),
          workflowFile: splitElement[4]?.trim(),
          events: splitElement[5]?.trim(),
        };
      });
  }

  async runJob(jobId, opts) {
    await this.handleStepMocking((workflow) => workflow.jobId === jobId, opts);
    return this.run(["-j", jobId], opts);
  }

  async runEvent(event, opts) {
    await this.handleStepMocking(
      (workflow) => workflow.events.includes(event),
      opts,
    );
    return this.run([event], opts);
  }

  async runEventAndJob(event, jobId, opts) {
    await this.handleStepMocking(
      (workflow) => workflow.events.includes(event) && workflow.jobId === jobId,
      opts,
    );
    return this.run([event, "-j", jobId], opts);
  }

  async handleStepMocking(filter, opts) {
    if (opts?.mockSteps) {
      // if (
      //   output.includes("⭐ Run") &&
      //   output.includes("❌  Skipped")
      // ) {
      //   const skippedStep = output.split("⭐ Run")[1]?.trim();
      //   skippedSteps.push(skippedStep);
      // }
      // there could multiple workflow files with same event triggers or job names. Act executes them all
      let workflowFiles = [];
      const cwd = opts.cwd ?? this.cwd;
      // if workflow file was defined then no need to consider all possible options
      if (opts.workflowFile) {
        workflowFiles = [path_1.default.basename(opts.workflowFile)];
      } else if (this.workflowFile !== cwd) {
        workflowFiles = [path_1.default.basename(this.workflowFile)];
      } else {
        workflowFiles = (await this.list(undefined, opts.cwd))
          .filter(filter)
          .map((l) => l.workflowFile);
      }
      return Promise.all(
        workflowFiles.map((workflowFile) => {
          const stepMocker = new step_mocker_1.StepMocker(
            workflowFile,
            opts.cwd ?? this.cwd,
          );
          return stepMocker.mock(opts.mockSteps);
        }),
      );
    }
  }
  // wrapper around the act cli command

  async act(cwd, logFile, uniqueId, ...args) {
    const fsStream = await this.logRawOutput(logFile);
    const actPidFilePath = path.join(__dirname, "act_pid.json");
    const workDirArg = args.find((arg) => arg.startsWith("workDir="));
    const workDir = workDirArg ? workDirArg.split("=")[1] : "";
    return new Promise((resolve, reject) => {
      if (
        args.includes("GITHUB_STEP_SUMMARY=/dev/stdout") &&
        fs.existsSync(actPidFilePath)
      ) {
        const pids = JSON.parse(fs.readFileSync(actPidFilePath, "utf8"));
        // console.log("piddddddd----------------", pids);
        let pidToKill = null;
        let uuidToDelete = null;
        for (const pid of pids) {
          if (pid.workDir === workDir) {
            pidToKill = pid.pid;
            uuidToDelete = pid.uniqueId;
            break;
          }
        }

        if (pidToKill) {
          console.log(`Found PID to kill: ${pidToKill}`);
          try {
            process.kill(pidToKill, "SIGKILL");
            try {
              deleteWorkflowRun(uuidToDelete);
            } catch (error) {
              console.log(error);
            }
          } catch (error) {
            console.log("kill error ", error);
          }
        } else {
          console.log(`No matching PID found for work directory: ${workDir}`);
        }
      }
      // do not use spawnSync. will cause a deadlock when used with proxy settings
      const childProcess = child_process_1.spawn(
        act_constants_1.ACT_BINARY,
        args,
        { cwd },
      );
      if (args.includes("GITHUB_STEP_SUMMARY=/dev/stdout")) {
        let actPids = [];
        const actPid = { pid: childProcess.pid, workDir, uniqueId };
        console.log("actpid", actPid);
        if (fs.existsSync(actPidFilePath)) {
          const existingData = fs.readFileSync(actPidFilePath, "utf8");
          actPids = JSON.parse(existingData);
          actPids.push(actPid);
          console.log("actPidFilePath exists");
          fs.writeFileSync(actPidFilePath, JSON.stringify(actPids));
        } else {
          fs.writeFileSync(
            actPidFilePath,
            JSON.stringify([actPid], null, 2),
            "utf-8",
          );
        }
      }
      // Write the actPid object to the act_pid.json file
      let data;
      let index = 1;
      let logs = []; // to empty the logs after every steps logs
      const steps = [];
      let includeInLogs = false;
      let startTime;
      let message;
      let conclusion;
      // const uniqueId = uuidv4();
      let uuid = null;
      let pushEventPayload = null;

      const configApps = loadConfiguredApplications();
      if (configApps?.length) {
        const app = configApps[configApps.length - 1];
        if (!app?.uuid && uniqueId !== "-W") {
          const remainingApps = configApps.filter((app) => app.uuid !== null);
          app.uuid = uniqueId;
          const updatedApps = remainingApps.concat([app]);
          saveConfiguredApplications(updatedApps);
        }
        uuid = app?.uuid;
        pushEventPayload = app?.pushEventPayload;
      }

      childProcess.stdout.on("data", (chunk) => {
        const output = chunk.toString();

        if (output.includes("✅  Success -")) {
          const result =
            output.split("✅  Success -").length > 1
              ? output.split("✅  Success -")[1]
              : output.split("✅  Success -")[0];
          message = `${result.split("\n")[0]}`;

          conclusion = "success";
        } else if (output.includes("❌  Failure -")) {
          const result =
            output.split("❌  Failure -").length > 1
              ? output.split("❌  Failure -")[1]
              : output.split("❌  Failure -")[0];
          message = `${result.split("\n")[0]}`;
          conclusion = "failed";
        }

        if (
          args.includes("-n") &&
          (output.includes("✅") || output.includes("❌"))
        ) {
          //   console.log("step ", index++, output.split("✅  Success -")[1]);
          if (output.includes("✅")) {
            const job = output.split("✅  Success -")[1].split("\n")[0];
            const res = job.includes("Main") ? job.split("Main")[1] : job;
            // console.log('step ',index++,res)
            steps.push({ step: `${res.trim()}`, uuid });
          } else {
            const job = output.split("❌  Failure -")[1].split("\n")[0];
            const res = job.includes("Main") ? job.split("Main")[1] : job;
            // console.log('step ',index++,res)
            steps.push({ step: `${res.trim()}`, uuid });
          }
        }

        if (args.includes("GITHUB_STEP_SUMMARY=/dev/stdout")) {
          if (output.includes("⭐ Run")) {
            includeInLogs = true;
            logs = [];
            startTime = Date.now();
            // when steps logs come after then again empty the logs
            console.log(output);
          }
          // if (!output.includes('⭐ Run'))
          // {
          //   message = `${output.split("✅  Success ")[1]}`;
          //   status="skipped"

          // }

          if (
            output.includes("✅  Success") ||
            output.includes("❌  Failure")
          ) {
            logs.push(output);
            includeInLogs = false;
            console.log(output);

            const accumulatedLogs = logs.join("\n");
            const endTime = Date.now(); // record the end time of the step
            const timeTaken = (endTime - startTime) / 1000;
            const res = message.includes("Main")
              ? message.split("Main")[1]
              : message;
            chunkString(accumulatedLogs, chunkSize).map((item) => {
              const result = {
                uuid,
                pushEventPayload,
                index, // add index field
                workflowName: this.currentWorkflowName,

                logsMetadata: {
                  step: res.trim(),
                  conclusion,
                  logs: item ?? "",
                  timeTaken,
                  index,
                },
              };
              // console.log("logsData",result,ants,index)
              socket.emit("logsData", result);
            });
            // Send data in parts
            // sendDataInParts(socket, result, chunkSize)
            //     .then(() => console.log("Data sent successfully in parts"))
            //     .catch(error => console.error("Error sending data:", error));
            index = index + 1;
            // we can also do indexing to separate the logs

            //   axios.post('http://localhost:3004/logs', { steps: message,status:status,logs: accumulatedLogs||"", })
            //     .then(response => {
            //       console.log(response.data.message);
            //     })
            //     .catch(error => {
            //       console.error('Error storing logs:', error.message);
            //     });
            //   logs = [];
          }
          if (includeInLogs) {
            logs.push(output);
            // console.log(output);
          }

          if (check === true && !output.includes("🐳  docker")) {
            console.log(output);
            logs.push(output);
          }
        }
        data += output;
        fsStream?.write(output);
      });
      childProcess.stderr.on("data", (chunk) => {
        const output = chunk.toString();
        data += output;
        fsStream?.write(output);
      });
      childProcess.on("close", (code) => {
        fsStream?.close();
        try {
          if (
            args.includes("GITHUB_STEP_SUMMARY=/dev/stdout") &&
            fs.existsSync(actPidFilePath)
          ) {
            const existing = JSON.parse(
              fs.readFileSync(actPidFilePath, "utf8"),
            );
            const filteredData = existing.filter(
              (item) => item.pid !== childProcess.pid,
            );
            fs.writeFile(
              actPidFilePath,
              JSON.stringify(filteredData, null, 2),
              "utf8",
              (err) => {
                if (err) {
                  console.error("Error writing file:", err);
                  return;
                }
                console.log(`PID ${childProcess.pid} removed successfully.`);
              },
            );
          }
        } catch (error) {
          console.log(error);
        }
        if (
          code === null ||
          /Cannot connect to the Docker daemon at .+/.test(data)
        ) {
          reject(data);
        } else {
          steps.length > 0 && socket.emit("steps", steps);
          resolve(data);
        }
      });
    });
  }

  async parseRunOpts(opts) {
    const actArguments = [];
    const cwd = opts?.cwd ?? this.cwd;
    const workflowFile = opts?.workflowFile ?? this.workflowFile;
    let proxy;
    if (opts?.mockApi && opts.mockApi.length > 0) {
      proxy = new proxy_1.ForwardProxy(opts.mockApi, opts?.verbose);
      const address = await proxy.start();
      this.setEnv("http_proxy", `http://${address}`);
      this.setEnv("https_proxy", `http://${address}`);
      this.setEnv("HTTP_PROXY", `http://${address}`);
      this.setEnv("HTTPS_PROXY", `http://${address}`);
    }
    if (opts?.artifactServer) {
      actArguments.push(
        "--artifact-server-path",
        opts?.artifactServer.path,
        "--artifact-server-port",
        opts?.artifactServer.port,
      );
    }
    if (opts?.bind) {
      actArguments.push("--bind");
    }
    if (opts?.verbose) {
      actArguments.push("--verbose");
    }
    if (this.containerOpts.containerArchitecture) {
      actArguments.push(
        "--container-architecture",
        this.containerOpts.containerArchitecture,
      );
    }
    if (this.containerOpts.containerDaemonSocket) {
      actArguments.push(
        "--container-daemon-socket",
        this.containerOpts.containerDaemonSocket,
      );
    }
    if (this.containerOpts.containerOptions) {
      actArguments.push(
        "--container-options",
        this.containerOpts.containerOptions,
      );
    }
    actArguments.push("-W", workflowFile);
    return { cwd, proxy, actArguments };
  }

  /**
   * Run the actual act binary. Pass any necessary env or secrets formatted according to the cli's requirements
   * @param cmd
   * @param opts
   * @returns
   */
  async run(cmd, opts) {
    const { cwd, actArguments, proxy } = await this.parseRunOpts(opts);
    const { uuid } = opts;
    const env = this.env.toActArguments();
    const secrets = this.secrets.toActArguments();
    const input = this.input.toActArguments();
    const event = await this.event.toActArguments();
    const matrix = this.matrix.toActArguments();
    const platforms = this.platforms.toActArguments();
    // const uniqueId = uuidv4();
    const data = await this.act(
      cwd,
      opts?.logFile,
      uuid,
      ...cmd,
      ...secrets,
      ...env,
      ...input,
      ...event,
      ...matrix,
      ...platforms,
      ...actArguments,
    );
    const promises = [
      this.event.removeEvent(),
      ...(proxy ? [proxy.stop()] : []),
    ];
    const result = new output_parser_1.OutputParser(data).parseOutput();
    await Promise.all(promises);
    const obj = { result, uuid };
    return obj;
  }

  /**
   * Produce a .actrc file in the home directory of the user if it does not exist
   * @param defaultImageSize
   */
  setDefaultImage(defaultImageSize) {
    const actrcPath = path_1.default.join((0, os_1.homedir)(), ".actrc");
    const ubuntuLatest = "-P ubuntu-latest=";
    const ubuntu2004 = "-P ubuntu-20.04=";
    const ubuntu1804 = "-P ubuntu-18.04=";
    const ubuntu2204 = "-P ubuntu-22.04=";
    const catthehacker = "ghcr.io/catthehacker/";
    const selfHosted = "-self-hosted";
    if (!(0, fs_1.existsSync)(actrcPath)) {
      let actrc = "";
      switch (defaultImageSize ?? "medium") {
        case "micro":
          // actrc = `${ubuntuLatest}node:16-buster-slim\n${ubuntu2004}node:16-buster-slim\n${ubuntu1804}node:16-buster-slim\n${ubuntu2204}node:16-bullseye-slim`;
          actrc = `${ubuntuLatest}${selfHosted}\n${ubuntu2004}node:16-buster-slim\n${ubuntu1804}node:16-buster-slim\n${ubuntu2204}node:16-bullseye-slim`;
          break;
        case "medium":
          // actrc = `${ubuntuLatest}${catthehacker}ubuntu:act-latest\n${ubuntu2004}${catthehacker}ubuntu:act-20.04\n${ubuntu1804}${catthehacker}ubuntu:act-18.04\n${ubuntu2204}${catthehacker}ubuntu:act-22.04`;
          actrc = `${ubuntuLatest}${selfHosted}\n${ubuntu2004}${catthehacker}ubuntu:act-20.04\n${ubuntu1804}${catthehacker}ubuntu:act-18.04\n${ubuntu2204}${catthehacker}ubuntu:act-22.04`;
          break;
        case "large":
          // actrc = `${ubuntuLatest}${catthehacker}ubuntu:full-latest\n${ubuntu2004}${catthehacker}ubuntu:full-20.04\n${ubuntu1804}${catthehacker}ubuntu:full-18.04`;
          actrc = `${ubuntuLatest}${selfHosted}\n${ubuntu2004}${catthehacker}ubuntu:full-20.04\n${ubuntu1804}${catthehacker}ubuntu:full-18.04`;
          break;
      }
      (0, fs_1.writeFileSync)(actrcPath, actrc);
    }
  }

  async logRawOutput(logFile) {
    if (logFile) {
      const filehandle = await (0, promises_1.open)(logFile, "w");
      return filehandle.createWriteStream();
    }
  }
}
exports.Act = Act;

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
          break; // Stop traversal once the file is found
        }
      }
    }

    traverseDir(searchPath);

    if (!yamlFilePath) {
      console.log("Failed to locate onetab-pipeline yml file.");
      return null;
    }

    const fileContent = fs.readFileSync(yamlFilePath, "utf8");
    const yamlData = yaml.load(fileContent);
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
