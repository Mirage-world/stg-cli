import { ResponseMocker } from "@kie/mock-github";
import { MockStep } from "../step-mocker/step-mocker.types";
export declare type Workflow = {
    jobId: string;
    jobName: string;
    workflowName: string;
    workflowFile: string;
    events: string;
};
export declare type Step = {
    name: string;
    status: number;
    output: string;
    groups?: Group[];
};
export declare type Group = {
    name: string;
    output: string;
};
export declare type RunOpts = {
    bind?: boolean;
    cwd?: string;
    workflowFile?: string;
    artifactServer?: {
        path: string;
        port: string;
    };
    mockApi?: ResponseMocker<unknown, number>[];
    mockSteps?: MockStep;
    logFile?: string;
    verbose?: boolean;
    uuid?:string;
};
export declare type ContainerOpts = {
    containerArchitecture?: string;
    containerDaemonSocket?: string;
    containerOptions?: string;
};