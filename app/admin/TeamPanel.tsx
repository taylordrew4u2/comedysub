'use client';

import { useState, useTransition } from 'react';
import { deleteTeamMemberAction, saveTeamMemberAction } from '../actions';
import type { TeamMember } from '../lib/db';
import { toHttpUrl } from '../lib/normalize';
import {
  dangerButton,
  field,
  fieldLabel,
  ghostButton,
  help,
  primaryButton,
  sectionTitle,
} from './ui';

type Draft = Omit<TeamMember, 'id'> & { id: number | null };

const BLANK: Draft = {
  id: null,
  name: '',
  role: '',
  bio: '',
  photo_url: '',
  sort_order: 0,
  is_active: true,
};

export default function TeamPanel({ team: initial }: { team: TeamMember[] }) {
  const [team, setTeam] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  function add() {
    setError(null);
    const nextOrder = team.reduce((max, m) => Math.max(max, m.sort_order), 0) + 1;
    setDraft({ ...BLANK, sort_order: nextOrder });
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);

    const data = new FormData();
    if (draft.id !== null) data.set('id', String(draft.id));
    data.set('name', draft.name);
    data.set('role', draft.role);
    data.set('bio', draft.bio);
    data.set('photo_url', draft.photo_url);
    data.set('sort_order', String(draft.sort_order));
    data.set('is_active', draft.is_active ? 'true' : 'false');

    const result = await saveTeamMemberAction({}, data);
    setSaving(false);

    if (result.error || result.savedId === undefined) {
      setError(result.error ?? 'Failed to save.');
      return;
    }

    const saved: TeamMember = { ...draft, id: result.savedId };
    setTeam((rows) => {
      const next = rows.some((m) => m.id === saved.id)
        ? rows.map((m) => (m.id === saved.id ? saved : m))
        : [...rows, saved];
      return next.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    });
    setDraft(null);
  }

  function remove(member: TeamMember) {
    if (!window.confirm(`Remove ${member.name} from the website?`)) return;

    const previous = team;
    setTeam((rows) => rows.filter((m) => m.id !== member.id));
    setError(null);

    startTransition(async () => {
      const result = await deleteTeamMemberAction(member.id);
      if (result.error) {
        setTeam(previous);
        setError(result.error);
      }
    });
  }

  const preview = draft ? toHttpUrl(draft.photo_url) : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className={sectionTitle}>Team</h2>
          <p className="mt-1 max-w-lg text-sm font-light text-ink-soft">
            The therapists shown under “Our team”. Hide the section entirely by
            unticking everyone.
          </p>
        </div>
        <button type="button" onClick={add} className={primaryButton}>
          Add someone
        </button>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-6 border-l-2 border-gold bg-gold-wash/50 px-4 py-3 text-sm font-light text-green-deep"
        >
          {error}
        </p>
      ) : null}

      {draft ? (
        <div className="mt-6 rounded-sm border border-gold/50 bg-white p-5 sm:p-6">
          <h3 className="font-serif text-xl font-light text-green-deep">
            {draft.id === null ? 'New team member' : 'Editing team member'}
          </h3>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className={fieldLabel} htmlFor="team-name">
                Name
              </label>
              <input
                id="team-name"
                type="text"
                value={draft.name}
                maxLength={120}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className={`mt-2 ${field}`}
              />
            </div>

            <div>
              <label className={fieldLabel} htmlFor="team-role">
                Role
              </label>
              <input
                id="team-role"
                type="text"
                value={draft.role}
                maxLength={120}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                className={`mt-2 ${field}`}
                placeholder="Massage Therapist"
              />
            </div>

            <div className="sm:col-span-2">
              <label className={fieldLabel} htmlFor="team-bio">
                Short bio
              </label>
              <textarea
                id="team-bio"
                rows={3}
                value={draft.bio}
                maxLength={1000}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                className={`mt-2 ${field} resize-y`}
              />
            </div>

            <div>
              <label className={fieldLabel} htmlFor="team-photo">
                Photo link
              </label>
              <input
                id="team-photo"
                type="url"
                value={draft.photo_url}
                maxLength={500}
                onChange={(e) => setDraft({ ...draft, photo_url: e.target.value })}
                className={`mt-2 ${field}`}
                placeholder="https://…"
              />
              <p className={help}>
                Leave empty and their initial is shown instead.
              </p>
            </div>

            <div>
              <label className={fieldLabel} htmlFor="team-order">
                Position in the list
              </label>
              <input
                id="team-order"
                type="number"
                value={draft.sort_order}
                onChange={(e) =>
                  setDraft({ ...draft, sort_order: parseInt(e.target.value, 10) || 0 })
                }
                className={`mt-2 ${field}`}
              />
              <p className={help}>Lower numbers come first.</p>
            </div>

            {preview ? (
              <div className="sm:col-span-2">
                <p className={fieldLabel}>Preview</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt=""
                  className="mt-2 h-24 w-24 rounded-full border border-green-wash object-cover"
                />
              </div>
            ) : null}

            <label className="flex items-center gap-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                className="h-4 w-4 accent-[#3f5138]"
              />
              <span className="text-sm font-light text-ink">Show them on the website</span>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={save} disabled={saving} className={primaryButton}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              disabled={saving}
              className={ghostButton}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {team.length === 0 ? (
        <p className="mt-8 rounded-sm border border-dashed border-green-wash px-6 py-14 text-center text-sm font-light text-ink-soft">
          Nobody listed yet — the “Our team” section is hidden until you add someone.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {team.map((member) => {
            const photo = toHttpUrl(member.photo_url);
            return (
              <li
                key={member.id}
                className="flex flex-col gap-4 rounded-sm border border-green-wash bg-white p-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-green-wash">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-serif text-xl font-light text-green-soft">
                        {member.name.trim().charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-serif text-lg font-light text-green-deep">
                        {member.name}
                      </h3>
                      {member.is_active ? null : (
                        <span className="rounded-full bg-cream-dim px-3 py-1 text-[10px] font-light uppercase tracking-[0.16em] text-ink-soft">
                          Hidden
                        </span>
                      )}
                    </div>
                    {member.role ? (
                      <p className="mt-1 text-[11px] font-light uppercase tracking-[0.16em] text-gold-deep">
                        {member.role}
                      </p>
                    ) : null}
                    {member.bio ? (
                      <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-ink-soft">
                        {member.bio}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setDraft({ ...member });
                    }}
                    className={ghostButton}
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => remove(member)} className={dangerButton}>
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
