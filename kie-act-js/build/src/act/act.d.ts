import { RunOpts, Step, Workflow } from "../act/act.type";
import { EventJSON } from "../action-event/action-event.types";
export declare class Act {
    private secrets;
    private cwd;
    private workflowFile;
    private env;
    private matrix;
    private platforms;
    private event;
    private input;
    private containerOpts;
    constructor(cwd?: string, workflowFile?: string, defaultImageSize?: string);
    setCwd(cwd: string): this;
    setWorkflowFile(workflowFile: string): this;
    setSecret(key: string, val: string): this;
    deleteSecret(key: string): this;
    clearSecret(): this;
    setEnv(key: string, val: string): this;
    deleteEnv(key: string): this;
    clearEnv(): this;
    setGithubToken(token: string): this;
    setGithubStepSummary(file: string): this;
    setEvent(event: EventJSON): this;
    setInput(key: string, val: string): this;
    deleteInput(key: string): this;
    clearInput(): this;
    setMatrix(key: string, val: string[]): this;
    deleteMatrix(key: string): this;
    clearMatrix(): this;
    setPlatforms(key: string, val: string): this;
    deletePlatforms(key: string): this;
    clearPlatforms(): this;
    setContainerArchitecture(val: string | undefined): this;
    setContainerDaemonSocket(val: string | undefined): this;
    setCustomContainerOpts(val: string | undefined): this;
    clearAllContainerOpts(): this;
    /**
     * List available workflows.
     * If working directory is not specified then node's current working directory is used
     * You can also list workflows specific to an event by passing the event name
     * @param cwd
     * @param workflowFile
     * @param event
     */
    list(event?: string, cwd?: string, workflowFile?: string): Promise<Workflow[]>;
    dryRun(event?: string, cwd?: string, workflowFile?: string, uuid?:string): Promise<Workflow[]>;
    runJob(jobId: string, opts?: RunOpts): Promise<Step[]>;
    runEvent(event: string, opts?: RunOpts): Promise<Step[]>;
    runEventAndJob(event: string, jobId: string, opts?: RunOpts): Promise<Step[]>;
    private handleStepMocking;
    private act;
    private parseRunOpts;
    /**
     * Run the actual act binary. Pass any necessary env or secrets formatted according to the cli's requirements
     * @param cmd
     * @param opts
     * @returns
     */
    private run;
    /**
     * Produce a .actrc file in the home directory of the user if it does not exist
     * @param defaultImageSize
     */
    private setDefaultImage;
    private logRawOutput;
}