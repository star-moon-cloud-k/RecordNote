import path from 'node:path';
import { app } from 'electron';

import type {
    SummarizeTranscriptInput,
    SummarizeTranscriptOutput,
    SummarizeTranscriptData,
} from '../../shared/types/summarization';

let loadedModel: any = null;
let loadedContext: any = null;
let loadedSession: any = null;

const getResourcesBasePath = () => {
    if (app.isPackaged) {
        return process.resourcesPath;
    }

    return path.join(process.cwd(), 'resources');
};

const getModelPath = () => {
    return path.join(getResourcesBasePath(), 'models', 'summary-model.gguf');
};

const extractJson = (text: string) => {
    const trimmed = text.trim();

    try {
        return JSON.parse(trimmed);
    } catch {
        // continue
    }

    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');

    if (start >= 0 && end > start) {
        const candidate = trimmed.slice(start, end + 1);
        return JSON.parse(candidate);
    }

    throw new Error('모델 응답에서 JSON을 찾지 못했다.');
};

const normalizeSummaryData = (raw: any): SummarizeTranscriptData => {
    return {
        title: typeof raw?.title === 'string' ? raw.title : '',
        summary: typeof raw?.summary === 'string' ? raw.summary : '',
        keyPoints: Array.isArray(raw?.keyPoints)
            ? raw.keyPoints.filter((v: unknown) => typeof v === 'string')
            : [],
        actionItems: Array.isArray(raw?.actionItems)
            ? raw.actionItems.map((item: any) => ({
                task: typeof item?.task === 'string' ? item.task : '',
                owner: typeof item?.owner === 'string' ? item.owner : '',
                dueDate: typeof item?.dueDate === 'string' ? item.dueDate : '',
            }))
            : [],
    };
};

const getSession = async () => {
    if (loadedSession && loadedContext && loadedModel) {
        return loadedSession;
    }

    const nlc: typeof import('node-llama-cpp') =
        await Function('return import("node-llama-cpp")')();

    const { getLlama, LlamaChatSession } = nlc;

    const llama = await getLlama();
    const model = await llama.loadModel({
        modelPath: getModelPath(),
    });

    const context = await model.createContext({
        contextSize: 8192,
    });

    const session = new LlamaChatSession({
        contextSequence: context.getSequence(),
    });

    loadedModel = model;
    loadedContext = context;
    loadedSession = session;

    return session;
};

const buildPrompt = (transcriptText: string) => {
    return `
다음 회의 전사본을 분석해라.
반드시 JSON만 출력한다.
설명 문장, 코드블록, 마크다운은 출력하지 않는다.

조건:
- title: 회의 내용을 대표하는 짧은 제목
- summary: 전체 핵심 요약 2~4문장
- keyPoints: 중요한 포인트 3~6개
- actionItems: 해야 할 일 목록
- owner, dueDate는 불명확하면 "미정"으로 작성

출력 형식:
{
  "title": "string",
  "summary": "string",
  "keyPoints": ["string"],
  "actionItems": [
    {
      "task": "string",
      "owner": "string",
      "dueDate": "string"
    }
  ]
}

회의 전사본:
${transcriptText}
`.trim();
};

export const summarizeTranscript = async (
    input: SummarizeTranscriptInput,
): Promise<SummarizeTranscriptOutput> => {
    try {
        const transcript = input.transcriptText.trim();

        if (!transcript) {
            throw new Error('전사 텍스트가 비어 있다.');
        }

        const session = await getSession();
        const prompt = buildPrompt(transcript);

        const rawText = await session.prompt(prompt, {
            temperature: 0.2,
            topK: 30,
            topP: 0.9,
            minP: 0.05,
            maxTokens: 1200,
        });

        const parsed = extractJson(rawText);
        const data = normalizeSummaryData(parsed);

        return {
            success: true,
            data,
            rawText,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};