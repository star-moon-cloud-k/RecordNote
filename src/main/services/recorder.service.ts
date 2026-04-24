import fs from "node:fs/promises";
import path from "path";
import { SaveRecordingInput } from "../../shared/types/recorder";
import { ensureWorkspace } from "./workspace.service";

const sanitizedFileName = (fileName: string) => {
    return fileName.replace(/[^\w.\-]/g, '_');
}


export const saveRecording = async (input: SaveRecordingInput) => {
    try {
        const workspace = await ensureWorkspace();
        const safeFileName = sanitizedFileName(input.fileName);
        const filePath = path.join(workspace.paths.recordingsDir, safeFileName);

        const buffer = Buffer.from(input.arrayBuffer);

        await fs.writeFile(filePath, buffer);

        return {
            success: true,
            filePath,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}