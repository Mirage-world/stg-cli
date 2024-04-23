import { MockStep } from "../step-mocker/step-mocker.types";
export declare class StepMocker {
    private workflowFile;
    private cwd;
    constructor(workflowFile: string, cwd: string);
    mock(mockSteps: MockStep): Promise<void>;
    private locateStep;
    private getWorkflowPath;
    private readWorkflowFile;
    private writeWorkflowFile;
}
