"use strict";
const __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepMocker = void 0;
const step_mocker_types_1 = require("../step-mocker/step-mocker.types");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const yaml_1 = require("yaml");
class StepMocker {
  constructor(workflowFile, cwd) {
    this.workflowFile = workflowFile;
    this.cwd = cwd;
  }

  async mock(mockSteps) {
    const filePath = this.getWorkflowPath();
    const workflow = await this.readWorkflowFile(filePath);
    for (const job of Object.keys(mockSteps)) {
      for (const mockStep of mockSteps[job]) {
        const step = this.locateStep(workflow, job, mockStep);
        if (step) {
          if (step.uses) {
            delete step.uses;
          }
          step.run = mockStep.mockWith;
        } else {
          throw new Error("Could not find step");
        }
      }
    }
    return this.writeWorkflowFile(filePath, workflow);
  }

  locateStep(workflow, jobId, step) {
    return workflow.jobs[jobId]?.steps.find((s) => {
      if ((0, step_mocker_types_1.isStepIdentifierUsingId)(step)) {
        return step.id === s.id;
      }
      if ((0, step_mocker_types_1.isStepIdentifierUsingName)(step)) {
        return step.name === s.name;
      }
      if ((0, step_mocker_types_1.isStepIdentifierUsingUses)(step)) {
        return step.uses === s.uses;
      }
      if ((0, step_mocker_types_1.isStepIdentifierUsingRun)(step)) {
        return step.run === s.run;
      }
      return false;
    });
  }

  getWorkflowPath() {
    if (
      (0, fs_1.existsSync)(path_1.default.join(this.cwd, this.workflowFile))
    ) {
      return path_1.default.join(this.cwd, this.workflowFile);
    }
    if (this.cwd.endsWith(".github")) {
      return path_1.default.join(this.cwd, "workflows", this.workflowFile);
    } else if (
      (0, fs_1.existsSync)(
        path_1.default.join(
          this.cwd,
          ".github",
          "workflows",
          this.workflowFile,
        ),
      )
    ) {
      return path_1.default.join(
        this.cwd,
        ".github",
        "workflows",
        this.workflowFile,
      );
    } else {
      throw new Error(`Could not locate ${this.workflowFile}`);
    }
  }

  async readWorkflowFile(location) {
    return (0, yaml_1.parse)((0, fs_1.readFileSync)(location, "utf8"));
  }

  async writeWorkflowFile(location, data) {
    return (0, fs_1.writeFileSync)(
      location,
      (0, yaml_1.stringify)(data),
      "utf8",
    );
  }
}
exports.StepMocker = StepMocker;
