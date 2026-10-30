// Built-in preparation checklists for My Event workspaces. These are general
// planning tips written for TSA Hub, not official TSA requirements.

export const WORKSPACE_TEMPLATES = [
    {
        id: 'starter',
        name: 'General starter',
        steps: [
            'Read the official rules and eligibility requirements',
            'Check the event theme, deadlines, and submission instructions',
            'Brainstorm ideas and select a project direction',
            'Assign responsibilities and plan the work',
            'Build or research the first prototype or draft',
            'Review progress and collect feedback',
            'Improve and test the final deliverables',
            'Prepare the documentation and presentation',
            'Double-check requirements before submission',
        ],
    },
    {
        id: 'build',
        name: 'Design & build project',
        categories: ['Engineering & Design', 'Manufacturing & Transportation', 'Architecture & Construction', 'Science & Health'],
        steps: [
            'List the rule constraints your design must meet',
            'Sketch two or three concepts and pick one',
            'Make a materials list and budget',
            'Create drawings, CAD, or a model of the design',
            'Build and test a first prototype',
            'Record test results and what you changed',
            'Keep dated photos or screenshots of your process',
            'Finish the documentation or portfolio pages',
        ],
    },
    {
        id: 'digital',
        name: 'Digital & coding project',
        categories: ['Computing & Coding', 'Digital Media'],
        steps: [
            'Confirm required file formats, length, and size limits',
            'Write a short plan, script, or storyboard',
            'Set up shared storage and version backups for your files',
            'Produce a rough first version and review it with your team',
            'Test on a different device or player than the one you built on',
            'Check credits, permissions, and any required citations',
            'Export the final files exactly as the rules require',
        ],
    },
    {
        id: 'presentation',
        name: 'Presentation & leadership',
        categories: ['Communication & Leadership', 'Business & Marketing'],
        steps: [
            'Confirm the time limit and what you may bring or use',
            'Outline the key message and supporting points',
            'Draft your slides, notes, or script',
            'Rehearse out loud against a timer',
            'Practice answering likely questions',
            'Get feedback from an advisor or classmate and revise',
            'Prepare a backup copy of anything you present from',
        ],
    },
    {
        id: 'conference',
        name: 'Conference readiness',
        steps: [
            'Confirm your registration and team members with your advisor',
            'Check the official dates and deadlines for your event',
            'Upload or print any required competition components',
            'Review the dress code and conduct expectations',
            'Pack everything your event allows or requires',
            'Plan arrival time, room, and schedule for your event',
        ],
    },
];

export function templatesForEvent(event) {
    const category = event?.category || '';
    const matched = WORKSPACE_TEMPLATES.filter((t) => t.categories?.includes(category));
    const general = WORKSPACE_TEMPLATES.filter((t) => !t.categories);
    return [...matched, ...general];
}

// Labels from a template that the checklist does not already contain.
export function newTemplateLabels(template, existing = []) {
    const present = new Set(existing.map((row) => String(row.label || '').trim().toLowerCase()));
    return template.steps.filter((label) => !present.has(label.toLowerCase()));
}
