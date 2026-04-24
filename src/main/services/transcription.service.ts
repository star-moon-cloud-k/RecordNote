import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { app } from 'electron';
import { ensureWorkspace } from './workspace.service';
import type {
    StartTranscriptionInput,
    StartTranscriptionOutput,
} from '../../shared/types/transcription';

const runCommand = (
    command: string,
    args: string[],
    extraEnv: NodeJS.ProcessEnv = {},
): Promise<{ stdout: string; stderr: string }> => {
    return new Promise((resolve, reject) => {
        console.log('[transcription] runCommand');
        console.log('  command:', command);
        console.log('  args:', args);
        console.log('  extraEnv:', extraEnv);

        const child = spawn(command, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
                ...process.env,
                ...extraEnv,
            },
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });

        child.on('error', (error) => {
            console.error('[transcription] spawn error:', error);
            reject(error);
        });

        child.on('close', (code) => {
            console.log('[transcription] process closed');
            console.log('  exitCode:', code);
            console.log('  stdout:', stdout);
            console.log('  stderr:', stderr);

            if (code === 0) {
                resolve({ stdout, stderr });
                return;
            }

            reject(
                new Error(
                    `Command failed: ${command} ${args.join(' ')}\nexitCode=${code}\nstdout=${stdout}\nstderr=${stderr}`,
                ),
            );
        });
    });
};

const getResourcesBasePath = () => {
    if (app.isPackaged) {
        return process.resourcesPath;
    }

    return path.join(process.cwd(), 'resources');
};

const getRuntimePaths = () => {
    const resourcesBase = getResourcesBasePath();

    return {
        ffmpegBin: path.join(resourcesBase, 'bin', 'ffmpeg'),
        whisperBin: path.join(resourcesBase, 'bin', 'whisper-cli'),
        whisperLibDir: path.join(resourcesBase, 'lib'),
        whisperModel: path.join(resourcesBase, 'models', 'ggml-large-v3.bin'),
    };
};

const getBaseName = (filePath: string) => {
    return path.basename(filePath, path.extname(filePath));
};

export const startTranscription = async (
    input: StartTranscriptionInput,
): Promise<StartTranscriptionOutput> => {
    try {
        console.log('[transcription] start');
        console.log('  sourceFilePath:', input.sourceFilePath);

        const workspace = await ensureWorkspace();
        const { ffmpegBin, whisperBin, whisperLibDir, whisperModel } = getRuntimePaths();

        console.log('[transcription] runtime paths');
        console.log('  ffmpegBin:', ffmpegBin);
        console.log('  whisperBin:', whisperBin);
        console.log('  whisperModel:', whisperModel);

        await fs.access(ffmpegBin);
        await fs.access(whisperBin);
        await fs.access(whisperLibDir);
        await fs.access(whisperModel);
        await fs.access(input.sourceFilePath);

        const baseName = getBaseName(input.sourceFilePath);
        const wavFilePath = path.join(workspace.paths.processingDir, `${baseName}.wav`);
        const tempTranscriptBasePath = path.join(workspace.paths.processingDir, `${baseName}_transcript`);
        const transcriptFilePath = path.join(workspace.paths.transcriptsDir, `${baseName}.txt`);
        const transcriptSrtFilePath = path.join(workspace.paths.subtitlesDir, `${baseName}.srt`);
        const language = 'ko';

        console.log('[transcription] output paths');
        console.log('  wavFilePath:', wavFilePath);
        console.log('  tempTranscriptBasePath:', tempTranscriptBasePath);
        console.log('  transcriptFilePath:', transcriptFilePath);
        console.log('  transcriptSrtFilePath:', transcriptSrtFilePath);

        await runCommand(ffmpegBin, [
            '-y',
            '-i',
            input.sourceFilePath,
            '-ar',
            '16000',
            '-ac',
            '1',
            '-c:a',
            'pcm_s16le',
            wavFilePath,
        ]);

        await fs.access(wavFilePath);

        await runCommand(
            whisperBin,
            [
                '-m',
                whisperModel,
                '-f',
                wavFilePath,
                '-l',
                language,
                '-otxt',
                '-osrt',
                '-of',
                tempTranscriptBasePath,
            ],
            {
                DYLD_LIBRARY_PATH: whisperLibDir,
            },
        );

        const tempTranscriptFilePath = `${tempTranscriptBasePath}.txt`;
        const tempTranscriptSrtFilePath = `${tempTranscriptBasePath}.srt`;

        await fs.access(tempTranscriptFilePath);
        await fs.access(tempTranscriptSrtFilePath);
        await fs.rm(transcriptFilePath, { force: true });
        await fs.rm(transcriptSrtFilePath, { force: true });
        await fs.rename(tempTranscriptFilePath, transcriptFilePath);
        await fs.rename(tempTranscriptSrtFilePath, transcriptSrtFilePath);

        await fs.access(transcriptFilePath);
        await fs.access(transcriptSrtFilePath);

        const text = await fs.readFile(transcriptFilePath, 'utf-8');

        console.log('[transcription] success');
        console.log('  transcript chars:', text.length);

        return {
            success: true,
            wavFilePath,
            transcriptFilePath,
            transcriptSrtFilePath,
            text,
        };
    } catch (error) {
        console.error('[transcription] failed:', error);

        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
