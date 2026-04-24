import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import type {
    SummarizeTranscriptData,
    SummarizeTranscriptInput,
    SummarizeTranscriptOutput,
    SummaryActionItem,
    SummarySpeakerInference,
} from '../../shared/types/summarization';
import { ensureWorkspace } from './workspace.service';

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
        return JSON.parse(trimmed.slice(start, end + 1));
    }

    throw new Error('모델 응답에서 JSON을 찾지 못했다.');
};

const toStringArray = (value: unknown) => {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
};

const clampText = (text: string, maxChars: number) => {
    if (text.length <= maxChars) return text;

    const head = text.slice(0, Math.floor(maxChars * 0.6));
    const tail = text.slice(-Math.floor(maxChars * 0.4));
    return `${head}\n\n...[중략: 길이 제한으로 일부 생략]...\n\n${tail}`;
};

const normalizeActionItems = (value: unknown): SummaryActionItem[] => {
    if (!Array.isArray(value)) return [];

    return value.map((item) => {
        const raw = item as Record<string, unknown>;

        return {
            task: typeof raw?.task === 'string' ? raw.task.trim() : '',
            owner: typeof raw?.owner === 'string' && raw.owner.trim() ? raw.owner.trim() : '미정',
            dueDate: typeof raw?.dueDate === 'string' && raw.dueDate.trim() ? raw.dueDate.trim() : '미정',
        };
    }).filter((item) => item.task);
};

const normalizeSpeakerInferences = (value: unknown): SummarySpeakerInference[] => {
    if (!Array.isArray(value)) return [];

    return value.map((item, index) => {
        const raw = item as Record<string, unknown>;
        const confidenceRaw = typeof raw?.confidence === 'number'
            ? raw.confidence
            : Number(raw?.confidence ?? 0);
        const confidence = Number.isFinite(confidenceRaw)
            ? Math.max(0, Math.min(100, Math.round(confidenceRaw)))
            : 0;

        return {
            speaker: typeof raw?.speaker === 'string' && raw.speaker.trim()
                ? raw.speaker.trim()
                : `화자 ${index + 1}`,
            likelyRole: typeof raw?.likelyRole === 'string' && raw.likelyRole.trim()
                ? raw.likelyRole.trim()
                : '역할 미정',
            confidence,
            evidence: typeof raw?.evidence === 'string' && raw.evidence.trim()
                ? raw.evidence.trim()
                : '근거 정보 없음',
            keyTopics: toStringArray(raw?.keyTopics),
            sampleQuotes: toStringArray(raw?.sampleQuotes),
        };
    });
};

const normalizeSummaryData = (raw: unknown): SummarizeTranscriptData => {
    const source = (raw ?? {}) as Record<string, unknown>;

    const keyPoints = toStringArray(source.keyPoints);
    const summary = typeof source.summary === 'string'
        ? source.summary.trim()
        : '';

    return {
        title: typeof source.title === 'string' && source.title.trim()
            ? source.title.trim()
            : '회의 요약',
        summary: summary || keyPoints.slice(0, 3).join(' '),
        detailedSummary: typeof source.detailedSummary === 'string'
            ? source.detailedSummary.trim()
            : '',
        keyPoints,
        decisions: toStringArray(source.decisions),
        risks: toStringArray(source.risks),
        openQuestions: toStringArray(source.openQuestions),
        nextSteps: toStringArray(source.nextSteps),
        actionItems: normalizeActionItems(source.actionItems),
        speakerInferences: normalizeSpeakerInferences(source.speakerInferences),
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

const readSrtHints = async (
    transcriptFilePath?: string,
    transcriptSrtFilePath?: string,
) => {
    let srtPath: string | null = transcriptSrtFilePath ?? null;

    if (!srtPath && transcriptFilePath) {
        try {
            const workspace = await ensureWorkspace();
            const baseName = path.basename(transcriptFilePath, path.extname(transcriptFilePath));
            srtPath = path.join(workspace.paths.subtitlesDir, `${baseName}.srt`);
        } catch {
            srtPath = transcriptFilePath.replace(/\.txt$/i, '.srt');
        }
    }

    if (!srtPath) return '';

    try {
        const srt = await fs.readFile(srtPath, 'utf-8');
        const chunks = srt
            .split(/\r?\n\r?\n/)
            .map((block) => block.trim())
            .filter(Boolean)
            .slice(0, 80)
            .map((block) => {
                const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
                if (lines.length < 3) return null;
                const timestamp = lines[1];
                const utterance = lines.slice(2).join(' ');
                return `${timestamp} | ${utterance}`;
            })
            .filter((line): line is string => Boolean(line));

        return chunks.join('\n');
    } catch {
        return '';
    }
};

const buildPrompt = (transcriptText: string, srtHints: string) => {
    const clippedTranscript = clampText(transcriptText, 32000);
    const clippedSrtHints = clampText(srtHints, 12000);

    return `
아래 회의 전사본을 바탕으로, 노션에 바로 붙여넣을 수 있는 전문적이고 구조화된 회의 문서를 만들기 위한 JSON을 생성해라.

중요 제약:
1) 반드시 JSON만 출력한다.
2) 마크다운 문법, 코드블록, 설명 문장은 출력하지 않는다.
3) 내용은 충분히 길고 논리적으로 상세해야 한다.
4) 화자 정보는 명시적으로 없는 경우가 많으므로 "추정"임을 전제로 작성한다.
5) 추정 화자는 최소 2명 이상 제시하려고 시도한다. 불확실하면 confidence를 낮게 둔다.
6) title, summary, detailedSummary를 포함한 모든 값은 한국어로 작성한다.

필수 출력 JSON 스키마:
{
  "title": "string",
  "summary": "string",
  "detailedSummary": "string",
  "keyPoints": ["string"],
  "decisions": ["string"],
  "risks": ["string"],
  "openQuestions": ["string"],
  "nextSteps": ["string"],
  "actionItems": [
    {
      "task": "string",
      "owner": "string",
      "dueDate": "string"
    }
  ],
  "speakerInferences": [
    {
      "speaker": "화자 A",
      "likelyRole": "예: 팀장/개발자/기획자",
      "confidence": 0,
      "evidence": "근거 설명",
      "keyTopics": ["string"],
      "sampleQuotes": ["string"]
    }
  ]
}

작성 가이드:
- summary는 5~8문장
- detailedSummary는 최소 3개 단락 분량
- keyPoints/decisions/risks/openQuestions/nextSteps는 각각 4개 이상 권장
- actionItems는 가능하면 5개 이상
- owner/dueDate가 불명확하면 "미정"으로 작성
- speakerInferences는 confidence(0~100) 포함

전사 본문:
${clippedTranscript}

${clippedSrtHints
            ? `화자 추정 보조 정보(SRT 세그먼트):
${clippedSrtHints}`
            : '화자 추정 보조 정보(SRT 세그먼트): 없음'}
`.trim();
};

const asMarkdownList = (items: string[], emptyText: string) => {
    if (items.length === 0) return `- ${emptyText}`;
    return items.map((item) => `- ${item}`).join('\n');
};

const buildMarkdown = (
    data: SummarizeTranscriptData,
    opts: {
        generatedAt: string;
        transcriptFilePath?: string;
    },
) => {
    const actionItemsTable = data.actionItems.length > 0
        ? [
            '| 번호 | 작업 | 담당 | 기한 |',
            '| --- | --- | --- | --- |',
            ...data.actionItems.map((item, index) => {
                return `| ${index + 1} | ${item.task} | ${item.owner || '미정'} | ${item.dueDate || '미정'} |`;
            }),
        ].join('\n')
        : '_액션 아이템이 없다._';

    const speakerTable = data.speakerInferences.length > 0
        ? [
            '| 화자 | 추정 역할 | 신뢰도 | 주요 주제 |',
            '| --- | --- | --- | --- |',
            ...data.speakerInferences.map((speaker) => {
                const topics = speaker.keyTopics.length > 0
                    ? speaker.keyTopics.join(', ')
                    : '없음';
                return `| ${speaker.speaker} | ${speaker.likelyRole} | ${speaker.confidence}% | ${topics} |`;
            }),
        ].join('\n')
        : '_화자 추정 정보가 충분하지 않다._';

    const speakerEvidence = data.speakerInferences.length > 0
        ? data.speakerInferences.map((speaker) => {
            const quotes = speaker.sampleQuotes.length > 0
                ? speaker.sampleQuotes.map((quote) => `  - "${quote}"`).join('\n')
                : '  - 인용 없음';

            return [
                `### ${speaker.speaker} (${speaker.likelyRole}, ${speaker.confidence}%)`,
                `- 근거: ${speaker.evidence}`,
                '- 대표 발화 추정:',
                quotes,
            ].join('\n');
        }).join('\n\n')
        : '추정 가능한 발화자 그룹을 찾지 못했다.';

    return [
        `# ${data.title || '회의 요약 문서'}`,
        '',
        `- 생성 시각: ${opts.generatedAt}`,
        `- 원본 전사 파일: ${opts.transcriptFilePath ?? '미지정'}`,
        '- 문서 성격: 노션 업로드용 구조화 회의 문서',
        '',
        '## 1. 핵심 요약',
        data.summary || '요약 정보가 충분하지 않다.',
        '',
        '## 2. 상세 서술',
        data.detailedSummary || '상세 서술이 충분하지 않다.',
        '',
        '## 3. 주요 논의 포인트',
        asMarkdownList(data.keyPoints, '핵심 포인트가 없다.'),
        '',
        '## 4. 의사결정 사항',
        asMarkdownList(data.decisions, '확정 의사결정이 없다.'),
        '',
        '## 5. 리스크 및 장애요인',
        asMarkdownList(data.risks, '주요 리스크가 식별되지 않았다.'),
        '',
        '## 6. 미해결 질문',
        asMarkdownList(data.openQuestions, '열린 질문이 없다.'),
        '',
        '## 7. 다음 단계',
        asMarkdownList(data.nextSteps, '후속 단계가 정리되지 않았다.'),
        '',
        '## 8. 실행 항목',
        actionItemsTable,
        '',
        '## 9. 화자 추정 맵',
        '> 아래 내용은 전사 텍스트 패턴 기반 추정이며, 화자 분리는 확정 정보가 아니다.',
        '',
        speakerTable,
        '',
        '## 10. 화자 추정 근거',
        speakerEvidence,
        '',
        '## 11. 노션 적용 체크리스트',
        '- [ ] 위 실행 항목을 팀 보드로 이관',
        '- [ ] 의사결정 사항 검증 후 확정',
        '- [ ] 미해결 질문 담당자 지정',
        '- [ ] 다음 회의 아젠다로 다음 단계 등록',
        '',
    ].join('\n');
};

const getSummaryOutputPaths = async (transcriptFilePath?: string) => {
    const workspace = await ensureWorkspace();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const baseName = transcriptFilePath
        ? path.basename(transcriptFilePath, path.extname(transcriptFilePath))
        : `summary-${timestamp}`;

    return {
        summaryJsonFilePath: path.join(workspace.paths.summariesDir, `${baseName}-summary.json`),
        summaryMarkdownFilePath: path.join(workspace.paths.summariesDir, `${baseName}-summary.md`),
    };
};

export const summarizeTranscript = async (
    input: SummarizeTranscriptInput,
): Promise<SummarizeTranscriptOutput> => {
    try {
        const transcript = input.transcriptText.trim();
        if (!transcript) {
            throw new Error('전사 텍스트가 비어 있다.');
        }

        const {
            summaryJsonFilePath,
            summaryMarkdownFilePath,
        } = await getSummaryOutputPaths(input.transcriptFilePath);

        const speakerHints = await readSrtHints(
            input.transcriptFilePath,
            input.transcriptSrtFilePath,
        );
        const session = await getSession();
        const prompt = buildPrompt(transcript, speakerHints);

        const rawText = await session.prompt(prompt, {
            temperature: 0.2,
            topK: 30,
            topP: 0.9,
            minP: 0.05,
            maxTokens: 2800,
        });

        const parsed = extractJson(rawText);
        const data = normalizeSummaryData(parsed);
        const generatedAt = new Date().toISOString();
        const markdownContent = buildMarkdown(data, {
            generatedAt,
            transcriptFilePath: input.transcriptFilePath,
        });

        await fs.writeFile(
            summaryJsonFilePath,
            JSON.stringify(
                {
                    createdAt: generatedAt,
                    transcriptFilePath: input.transcriptFilePath ?? null,
                    transcriptSrtFilePath: input.transcriptSrtFilePath ?? null,
                    summaryMarkdownFilePath,
                    data,
                    rawText,
                },
                null,
                2,
            ),
            'utf-8',
        );

        await fs.writeFile(summaryMarkdownFilePath, markdownContent, 'utf-8');

        return {
            success: true,
            data,
            rawText,
            summaryFilePath: summaryMarkdownFilePath,
            summaryJsonFilePath,
            summaryMarkdownFilePath,
            markdownContent,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
