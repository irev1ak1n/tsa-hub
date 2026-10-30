import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { describe, it, expect, beforeEach } from 'vitest';
import {
    BACKUP_FORMAT, MAX_FILE_BYTES, addPortfolioFile, buildWorkspaceBackup, deletePortfolioFile, emptyPortfolio,
    getPortfolioFile, importPortfolio, listPortfolioFiles, parseWorkspaceBackup, readPortfolio, replaceWorkspace,
    resetWorkspaceDbForTests, savePortfolio,
} from '../eventWorkspaceDb.js';

const file = (name, text, type = 'text/plain') => new File([text], name, { type });
const backupFile = (data) => new File([typeof data === 'string' ? data : JSON.stringify(data)], 'backup.json', { type: 'application/json' });

async function textOf(id) {
    return (await getPortfolioFile(id)).blob.text();
}

beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    resetWorkspaceDbForTests();
});

describe('workspace persistence', () => {
    it('returns an empty portfolio for an event that has none', async () => {
        expect(await readPortfolio('animatronics')).toEqual(emptyPortfolio('animatronics'));
    });

    it('saves and reloads notes, links, team and awards', async () => {
        const portfolio = {
            ...emptyPortfolio('animatronics'), summary: 'A talking owl', ideas: 'Try servos',
            references: [{ id: 'r1', title: 'Guide', url: 'https://example.com' }],
            team: [{ id: 't1', name: 'Sam', role: 'CAD', contact: '' }],
            awards: [{ id: 'a1', title: 'Regional finalist', result: '2nd', year: '2027' }],
        };
        await savePortfolio(portfolio);
        expect(await readPortfolio('animatronics')).toEqual(portfolio);
    });

    it('keeps each event’s workspace and files separate', async () => {
        await savePortfolio({ ...emptyPortfolio('a'), summary: 'for a' });
        await savePortfolio({ ...emptyPortfolio('b'), summary: 'for b' });
        await addPortfolioFile('a', file('a.txt', 'aaa'));
        await addPortfolioFile('b', file('b.txt', 'bbb'));
        expect((await readPortfolio('a')).summary).toBe('for a');
        expect((await listPortfolioFiles('a')).map((f) => f.name)).toEqual(['a.txt']);
        expect((await listPortfolioFiles('b')).map((f) => f.name)).toEqual(['b.txt']);
    });

    it('stores attachments as blobs and lists metadata only', async () => {
        const meta = await addPortfolioFile('a', file('notes.txt', 'hello world'));
        expect(meta).not.toHaveProperty('blob');
        const [listed] = await listPortfolioFiles('a');
        expect(listed).toMatchObject({ name: 'notes.txt', size: 11, type: 'text/plain' });
        expect(listed).not.toHaveProperty('blob');
        expect(await textOf(meta.id)).toBe('hello world');
        await deletePortfolioFile(meta.id);
        expect(await listPortfolioFiles('a')).toEqual([]);
    });

    it('rejects empty and oversized files, and sanitizes names', async () => {
        await expect(addPortfolioFile('a', file('empty.txt', ''))).rejects.toThrow(/nonempty/);
        const big = { name: 'big.bin', size: MAX_FILE_BYTES + 1, type: 'application/octet-stream' };
        await expect(addPortfolioFile('a', big)).rejects.toThrow(/20 MB/);
        const meta = await addPortfolioFile('a', file('..\\evil/name?.txt', 'x'));
        expect(meta.name).not.toMatch(/[\\/?]/);
    });

    it('enforces the per-event total limit', async () => {
        await savePortfolio(emptyPortfolio('a'));
        for (let i = 0; i < 4; i += 1) {
            await addPortfolioFile('a', new File([new Uint8Array(19 * 1024 * 1024)], 'f' + i + '.bin'));
        }
        await expect(addPortfolioFile('a', new File([new Uint8Array(5 * 1024 * 1024)], 'over.bin'))).rejects.toThrow(/80 MB/);
        expect(await listPortfolioFiles('a')).toHaveLength(4);
    });
});

describe('workspace backups', () => {
    async function seed(eventId) {
        await savePortfolio({
            ...emptyPortfolio(eventId), summary: 'Owl project', project: 'Servos done', ideas: 'LED eyes',
            references: [{ id: 'r', title: 'Docs', url: 'https://example.com' }],
            team: [{ id: 't', name: 'Sam', role: 'CAD', contact: '' }],
            awards: [{ id: 'a', title: 'Finalist', result: '', year: '2027' }],
        });
        await addPortfolioFile(eventId, file('plan.txt', 'the plan'));
        await addPortfolioFile(eventId, new File([new Uint8Array([0, 1, 2, 250, 251, 255])], 'bin.dat', { type: 'application/octet-stream' }));
    }

    it('round-trips text, links, team, awards, files and the plan', async () => {
        await seed('animatronics');
        const plan = { checklist: [{ label: 'Read rules', done: true }], milestones: [{ title: 'Prototype', due: '2027-01-05', status: 'todo' }] };
        const backup = await buildWorkspaceBackup('animatronics', plan);
        expect(backup).toMatchObject({ format: BACKUP_FORMAT, version: 1, eventId: 'animatronics' });
        expect(backup.files).toHaveLength(2);

        // A different device/profile: nothing stored yet.
        globalThis.indexedDB = new IDBFactory();
        resetWorkspaceDbForTests();
        const restored = await importPortfolio('animatronics', backupFile(backup));
        expect(restored.checklist).toEqual(plan.checklist);
        expect(restored.milestones).toEqual(plan.milestones);

        const portfolio = await readPortfolio('animatronics');
        expect(portfolio).toMatchObject({ summary: 'Owl project', project: 'Servos done', ideas: 'LED eyes' });
        expect(portfolio.references[0]).toMatchObject({ title: 'Docs', url: 'https://example.com' });
        expect(portfolio.team[0]).toMatchObject({ name: 'Sam', role: 'CAD' });
        expect(portfolio.awards[0]).toMatchObject({ title: 'Finalist', year: '2027' });

        const files = await listPortfolioFiles('animatronics');
        expect(files.map((f) => f.name).sort()).toEqual(['bin.dat', 'plan.txt']);
        const bin = files.find((f) => f.name === 'bin.dat');
        expect([...new Uint8Array(await (await getPortfolioFile(bin.id)).blob.arrayBuffer())]).toEqual([0, 1, 2, 250, 251, 255]);
        expect(await textOf(files.find((f) => f.name === 'plan.txt').id)).toBe('the plan');
    });

    it('restoring replaces only the chosen event and never duplicates files on repeat', async () => {
        await seed('animatronics');
        await savePortfolio({ ...emptyPortfolio('other'), summary: 'keep me' });
        await addPortfolioFile('other', file('other.txt', 'untouched'));
        const backup = await buildWorkspaceBackup('animatronics');

        await savePortfolio({ ...emptyPortfolio('animatronics'), summary: 'edited after backup' });
        await importPortfolio('animatronics', backupFile(backup));
        await importPortfolio('animatronics', backupFile(backup));

        expect((await readPortfolio('animatronics')).summary).toBe('Owl project');
        expect(await listPortfolioFiles('animatronics')).toHaveLength(2);
        expect((await readPortfolio('other')).summary).toBe('keep me');
        expect((await listPortfolioFiles('other')).map((f) => f.name)).toEqual(['other.txt']);
    });

    it('accepts the data-URL attachment form used by earlier backups', async () => {
        const backup = {
            format: BACKUP_FORMAT, version: 1, eventId: 'a', portfolio: emptyPortfolio('a'),
            files: [{ name: 'old.txt', type: 'text/plain', data: 'data:text/plain;base64,aGVsbG8=' }],
        };
        const parsed = await parseWorkspaceBackup('a', backupFile(backup));
        expect(await parsed.files[0].blob.text()).toBe('hello');
    });

    describe('rejects unsafe or wrong backups without changing anything', () => {
        beforeEach(async () => { await seed('animatronics'); });

        async function expectUntouched(promise, message) {
            await expect(promise).rejects.toThrow(message);
            expect((await readPortfolio('animatronics')).summary).toBe('Owl project');
            expect(await listPortfolioFiles('animatronics')).toHaveLength(2);
        }

        it('not JSON', async () => expectUntouched(importPortfolio('animatronics', backupFile('not json')), /valid JSON/));
        it('wrong format', async () => expectUntouched(importPortfolio('animatronics', backupFile({ format: 'other', version: 1 })), /supported/));
        it('another event’s backup', async () => {
            const other = await buildWorkspaceBackup('animatronics');
            await expectUntouched(importPortfolio('animatronics', backupFile({ ...other, eventId: 'different' })), /different event/);
        });
        it('missing workspace data', async () => {
            await expectUntouched(importPortfolio('animatronics', backupFile({ format: BACKUP_FORMAT, version: 1, eventId: 'animatronics' })), /missing/);
        });
        it('corrupted attachment', async () => {
            const backup = { format: BACKUP_FORMAT, version: 1, eventId: 'animatronics', portfolio: emptyPortfolio('animatronics'), files: [{ name: 'x', data: '***not base64***' }] };
            await expectUntouched(importPortfolio('animatronics', backupFile(backup)), /corrupted/);
        });
        it('attachment without data', async () => {
            const backup = { format: BACKUP_FORMAT, version: 1, eventId: 'animatronics', portfolio: emptyPortfolio('animatronics'), files: [{ name: 'x' }] };
            await expectUntouched(importPortfolio('animatronics', backupFile(backup)), /invalid/);
        });
        it('too many files', async () => {
            const files = Array.from({ length: 101 }, () => ({ name: 'x', data: 'AA==' }));
            const backup = { format: BACKUP_FORMAT, version: 1, eventId: 'animatronics', portfolio: emptyPortfolio('animatronics'), files };
            await expectUntouched(importPortfolio('animatronics', backupFile(backup)), /too many/);
        });
    });

    it('a failed replacement leaves the previous workspace intact (atomic)', async () => {
        await seed('animatronics');
        const badFile = { name: 'bad.bin', type: 'x', createdAt: new Date().toISOString(), blob: () => {} }; // functions cannot be stored
        await expect(replaceWorkspace('animatronics', { ...emptyPortfolio('animatronics'), summary: 'new' }, [badFile])).rejects.toThrow();
        expect((await readPortfolio('animatronics')).summary).toBe('Owl project');
        expect(await listPortfolioFiles('animatronics')).toHaveLength(2);
    });

    it('trims oversized text fields and limits list sizes', async () => {
        const backup = {
            format: BACKUP_FORMAT, version: 1, eventId: 'a',
            portfolio: { ...emptyPortfolio('a'), summary: 'x'.repeat(200000), team: Array.from({ length: 600 }, () => ({ name: 'n'.repeat(9000) })) },
        };
        const parsed = await parseWorkspaceBackup('a', backupFile(backup));
        expect(parsed.portfolio.summary).toHaveLength(100000);
        expect(parsed.portfolio.team).toHaveLength(500);
        expect(parsed.portfolio.team[0].name).toHaveLength(5000);
    });
});
