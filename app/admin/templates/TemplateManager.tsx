'use client';

import Link from 'next/link';
import { useActionState, useRef, useState } from 'react';
import {
  deleteTemplateAction,
  saveTemplateAction,
  type TemplateState,
} from '../../actions';
import type { EmailTemplate, Submission } from '../../lib/db';
import {
  MAILTO_SAFE_LENGTH,
  PLACEHOLDERS,
  SAMPLE_SUBMISSION,
  STARTER_TEMPLATES,
  mailtoLink,
  renderTemplate,
} from '../../lib/emailTemplate';

const INPUT =
  'min-h-12 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3.5 py-2.5 text-base text-white placeholder:text-[#555] focus:border-[#DC143C] focus:outline-none sm:min-h-0 sm:text-sm';

const LABEL = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#888]';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function TemplateManager({
  templates,
  submissions,
  dbError = false,
}: {
  templates: EmailTemplate[];
  submissions: Submission[];
  dbError?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(templates[0]?.id ?? null);
  const [starter, setStarter] = useState<(typeof STARTER_TEMPLATES)[number] | null>(null);
  // Bumped so "New template" clears an editor that is already on a blank one.
  const [blankCount, setBlankCount] = useState(0);

  // A deleted template drops out of the list, which leaves this null and the
  // editor back on a blank form without any extra bookkeeping.
  const selected = selectedId === null ? null : (templates.find((t) => t.id === selectedId) ?? null);
  const editorKey = selected ? `t${selected.id}` : `new-${blankCount}`;

  function startBlank(seed: (typeof STARTER_TEMPLATES)[number] | null = null) {
    setStarter(seed);
    setSelectedId(null);
    setBlankCount((n) => n + 1);
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      <header className="admin-header px-safe sticky top-0 z-20 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0 truncate">
            <span className="text-sm font-bold text-[#DC143C]">Pins &amp; Needles</span>
            <span className="ml-2 hidden text-xs text-[#555] sm:inline">Email templates</span>
          </div>
          <Link
            href="/admin"
            className="flex min-h-11 shrink-0 items-center rounded-lg border border-[#2a2a2a] px-3 text-xs text-[#888] transition hover:border-[#DC143C] hover:text-white sm:min-h-0 sm:py-1.5"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="px-safe pb-safe mx-auto max-w-6xl py-6 sm:py-8">
        {dbError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="mb-2 font-bold text-red-400">Database Error</p>
            <p className="text-sm text-[#aaa]">
              Could not load your templates. Check the POSTGRES_* environment variables.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* ── Saved templates ── */}
            <aside className="lg:w-64 lg:shrink-0">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h1 className="text-sm font-semibold text-white">
                  Templates
                  <span className="ml-1.5 text-[#555]">{templates.length}</span>
                </h1>
                <button
                  type="button"
                  onClick={() => startBlank()}
                  className="min-h-11 rounded-lg bg-[#DC143C] px-3 text-xs font-semibold text-white transition hover:bg-[#b01030] sm:min-h-0 sm:py-2"
                >
                  + New
                </button>
              </div>

              {templates.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#1e1e1e] p-4 text-xs leading-relaxed text-[#555]">
                  Nothing saved yet. Write one on the right, or start from an example below.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {templates.map((t) => {
                    const active = selected?.id === t.id;
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(t.id)}
                          aria-pressed={active}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                            active
                              ? 'border-[#DC143C] bg-[#DC143C]/10'
                              : 'border-[#1e1e1e] bg-[#111] hover:border-[#DC143C]/50'
                          }`}
                        >
                          <p className="truncate text-sm font-semibold text-white">{t.name}</p>
                          <p className="truncate text-xs text-[#666]">{t.subject}</p>
                          <p className="mt-0.5 text-[10px] text-[#444]">
                            Edited {formatDate(t.updated_at)}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Starters stay available — handy when adding a second or third. */}
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#555]">
                  Start from an example
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_TEMPLATES.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => startBlank(s)}
                      className="min-h-11 rounded-lg border border-[#2a2a2a] px-3 text-xs text-[#888] transition hover:border-[#DC143C] hover:text-white sm:min-h-0 sm:py-1.5"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* ── Editor + preview ── */}
            <div className="min-w-0 flex-1">
              <TemplateEditor
                key={editorKey}
                template={selected}
                starter={selected ? null : starter}
                submissions={submissions}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TemplateEditor({
  template,
  starter,
  submissions,
}: {
  template: EmailTemplate | null;
  starter: (typeof STARTER_TEMPLATES)[number] | null;
  submissions: Submission[];
}) {
  const initial: TemplateState = {};
  const [saveState, saveAction, isSaving] = useActionState(saveTemplateAction, initial);

  const [name, setName] = useState(template?.name ?? starter?.name ?? '');
  const [subject, setSubject] = useState(template?.subject ?? starter?.subject ?? '');
  const [body, setBody] = useState(template?.body ?? starter?.body ?? '');

  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [lastFocused, setLastFocused] = useState<'subject' | 'body'>('body');

  /*
   * Once a new template has been saved, its id comes back in the action state.
   * Reusing it means the next save edits that row instead of creating a
   * second copy of the same email.
   */
  const id = template?.id ?? saveState.savedId ?? null;

  const [previewId, setPreviewId] = useState<number | null>(null);
  const previewSub =
    previewId === null
      ? SAMPLE_SUBMISSION
      : (submissions.find((s) => s.id === previewId) ?? SAMPLE_SUBMISSION);

  const renderedSubject = renderTemplate(subject, previewSub);
  const renderedBody = renderTemplate(body, previewSub);
  const blank = [...new Set([...renderedSubject.blank, ...renderedBody.blank])];
  const unknown = [...new Set([...renderedSubject.unknown, ...renderedBody.unknown])];
  const tooLongForMailto =
    renderedSubject.text.length + renderedBody.text.length > MAILTO_SAFE_LENGTH;

  const [copied, setCopied] = useState(false);

  function insertPlaceholder(token: string) {
    const field = lastFocused === 'subject' ? subjectRef.current : bodyRef.current;
    if (!field) return;

    const text = `{{${token}}}`;
    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? start;
    const next = field.value.slice(0, start) + text + field.value.slice(end);

    if (lastFocused === 'subject') setSubject(next);
    else setBody(next);

    // Put the caret after what was just inserted, once React has re-rendered.
    const caret = start + text.length;
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(caret, caret);
    });
  }

  async function copyBody() {
    try {
      await navigator.clipboard.writeText(renderedBody.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-[#1e1e1e] bg-[#111] p-4 sm:p-5">
      <form action={saveAction}>
        {id !== null && <input type="hidden" name="id" value={id} />}

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="sm:w-56">
            <label htmlFor="template-name" className={LABEL}>
              Template name
            </label>
            <input
              id="template-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Booking confirmation"
              className={INPUT}
            />
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor="template-subject" className={LABEL}>
              Subject line
            </label>
            <input
              id="template-subject"
              name="subject"
              ref={subjectRef}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onFocus={() => setLastFocused('subject')}
              maxLength={200}
              placeholder="Pins &amp; Needles — you’re in!"
              className={INPUT}
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="template-body" className={LABEL}>
            Email
          </label>
          <textarea
            id="template-body"
            name="body"
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onFocus={() => setLastFocused('body')}
            rows={14}
            maxLength={10000}
            placeholder={'Hi {{first_name}},\n\n…'}
            className="min-h-48 w-full resize-y rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3.5 py-3 font-mono text-base leading-relaxed text-white placeholder:text-[#555] focus:border-[#DC143C] focus:outline-none sm:text-sm"
          />
          <p className="mt-1 text-right text-[10px] text-[#444]">{body.length} / 10000</p>
        </div>

        {/* ── Placeholders ── */}
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#555]">
            Insert a detail — goes into the {lastFocused === 'subject' ? 'subject' : 'email'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PLACEHOLDERS.map((p) => (
              <button
                key={p.token}
                type="button"
                onClick={() => insertPlaceholder(p.token)}
                title={`Inserts {{${p.token}}}`}
                className="min-h-11 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2.5 text-xs text-[#aaa] transition hover:border-[#DC143C] hover:text-white sm:min-h-0 sm:py-1.5"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <button
            type="submit"
            disabled={isSaving}
            className="min-h-12 w-full rounded-xl bg-[#DC143C] px-5 text-sm font-bold text-white transition hover:bg-[#b01030] disabled:opacity-60 sm:min-h-0 sm:w-auto sm:py-2.5"
          >
            {isSaving ? 'Saving…' : id !== null ? 'Save changes' : 'Save template'}
          </button>
        </div>

        <p role="status" aria-live="polite" className="mt-2 text-xs empty:hidden">
          {saveState.error ? (
            <span className="text-red-400">{saveState.error}</span>
          ) : saveState.success ? (
            <span className="text-[#666]">✓ Saved</span>
          ) : null}
        </p>
      </form>

      {/* Its own form, so it sits outside the one above rather than nesting. */}
      {id !== null && (
        <div className="mt-4 border-t border-[#1a1a1a] pt-4">
          <DeleteTemplateForm id={id} name={name} />
        </div>
      )}
      </div>

      {/* ── Preview ── */}
      <section className="rounded-xl border border-[#1e1e1e] bg-[#111] p-4 sm:p-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-white">Preview</h2>
          <label className="flex items-center gap-2 text-xs text-[#666]">
            <span className="shrink-0">Filled in for</span>
            <select
              value={previewId === null ? 'sample' : String(previewId)}
              onChange={(e) =>
                setPreviewId(e.target.value === 'sample' ? null : Number(e.target.value))
              }
              aria-label="Preview this template for"
              className="min-h-11 max-w-56 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1.5 text-base text-white focus:border-[#DC143C] focus:outline-none sm:min-h-0 sm:text-sm"
            >
              <option value="sample">Sample comedian</option>
              {submissions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.email ? '' : ' (no email)'}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#555]">
            To
          </p>
          <p className="mb-3 text-sm text-[#aaa]">
            {previewSub.email ?? (
              <span className="text-[#666]">No email on this submission</span>
            )}
          </p>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#555]">
            Subject
          </p>
          <p className="mb-3 text-sm font-semibold break-words text-white">
            {renderedSubject.text || <span className="text-[#444]">(empty)</span>}
          </p>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#555]">
            Email
          </p>
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-[#ddd]">
            {renderedBody.text || <span className="text-[#444]">(empty)</span>}
          </p>
        </div>

        {(blank.length > 0 || unknown.length > 0 || tooLongForMailto) && (
          <ul className="mt-3 flex flex-col gap-1 text-xs">
            {unknown.length > 0 && (
              <li className="text-red-400">
                Not a real placeholder, so it will send as typed: {unknown.join(', ')}
              </li>
            )}
            {blank.length > 0 && (
              <li className="text-yellow-400">
                Blank for this comedian: {blank.join(', ')}
              </li>
            )}
            {tooLongForMailto && (
              <li className="text-yellow-400">
                Long emails can be cut short by the mail app — copy it across instead.
              </li>
            )}
          </ul>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {previewSub.email ? (
            <a
              href={mailtoLink(previewSub.email, renderedSubject.text, renderedBody.text)}
              className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[#DC143C] px-4 text-sm font-bold text-white transition hover:bg-[#b01030] sm:min-h-0 sm:flex-none sm:py-2.5"
            >
              ✉ Open in mail app
            </a>
          ) : (
            <span className="flex min-h-12 flex-1 items-center justify-center rounded-xl border border-dashed border-[#2a2a2a] px-4 text-xs text-[#555] sm:min-h-0 sm:flex-none sm:py-2.5">
              No email address to send to
            </span>
          )}
          <button
            type="button"
            onClick={copyBody}
            className="min-h-12 rounded-xl border border-[#2a2a2a] px-4 text-sm text-[#888] transition hover:border-[#DC143C] hover:text-white sm:min-h-0 sm:py-2.5"
          >
            {copied ? '✓ Copied' : 'Copy email'}
          </button>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-[#555]">
          Nothing is sent from here — picking a comedian opens your own mail app with the
          email filled in, so it comes from your address and lands in your sent folder.
        </p>
      </section>
    </div>
  );
}

/** Two-step delete, matching the dashboard: the first click asks. */
function DeleteTemplateForm({ id, name }: { id: number; name: string }) {
  const initial: TemplateState = {};
  const [state, formAction, isPending] = useActionState(deleteTemplateAction, initial);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="min-h-12 self-start rounded-xl border border-[#2a2a2a] px-4 text-sm text-[#666] transition hover:border-red-500/60 hover:text-red-400 sm:min-h-0 sm:py-2.5"
        >
          Delete template
        </button>
        <p role="status" aria-live="polite" className="text-xs text-red-400 empty:hidden">
          {state.error}
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3"
    >
      <input type="hidden" name="id" value={id} />
      <p className="w-full text-xs text-red-300 sm:w-auto">
        Delete “{name || 'this template'}”? This can&apos;t be undone.
      </p>
      <button
        type="submit"
        disabled={isPending}
        className="min-h-11 rounded-lg bg-red-600 px-3 text-xs font-semibold whitespace-nowrap text-white transition hover:bg-red-700 disabled:opacity-50 sm:min-h-0 sm:py-1.5"
      >
        {isPending ? 'Deleting…' : 'Yes, delete'}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirming(false)}
        className="min-h-11 rounded-lg border border-[#2a2a2a] px-3 text-xs font-semibold whitespace-nowrap text-[#888] transition hover:text-white disabled:opacity-50 sm:min-h-0 sm:py-1.5"
      >
        Cancel
      </button>
      <p role="status" aria-live="polite" className="w-full text-xs text-red-400 empty:hidden">
        {state.error}
      </p>
    </form>
  );
}
