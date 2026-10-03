"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { profileFromResume, readResume } from "@/lib/resume";
import type { CandidateProfile } from "@/lib/types";

type Props = { profile: CandidateProfile; saved: boolean; onChange: (profile: CandidateProfile) => void; onSave: () => void; onUseForSearch: () => void };

export function ResumeProfile({ profile, saved, onChange, onSave, onUseForSearch }: Props) {
  const [resumeState, setResumeState] = useState("");

  async function parseResume(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setResumeState("Reading locally…");
    try {
      const text = await readResume(file);
      onChange(profileFromResume(text, profile));
      setResumeState(`Extracted from ${file.name}. Review before saving.`);
    } catch (error) {
      setResumeState(error instanceof Error ? error.message : "Could not read this resume.");
    } finally {
      event.target.value = "";
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); onSave(); }

  return (
    <aside className="profile-panel" id="profile">
      <div className="panel-title"><span>Private profile</span><small className={saved ? "saved" : ""}>{saved ? "Saved locally ✓" : "Not saved"}</small></div>
      <p className="panel-copy">Upload a resume or enter details manually. Resume parsing happens inside this browser; the file is never sent to VEYRA.</p>
      <label className="upload-control">
        <span>Parse resume locally</span>
        <input type="file" accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={parseResume} />
      </label>
      {resumeState && <p className="local-status" role="status">{resumeState}</p>}
      <form onSubmit={submit}>
        <label><span>Target roles</span><input value={profile.role} onChange={(event) => onChange({ ...profile, role: event.target.value })} placeholder="Software, electrical, automation" /></label>
        <label><span>Skills</span><textarea value={profile.skills} onChange={(event) => onChange({ ...profile, skills: event.target.value })} placeholder="React, TypeScript, PLC, control systems…" rows={4} /></label>
        <label><span>Education</span><input value={profile.education} onChange={(event) => onChange({ ...profile, education: event.target.value })} placeholder="B.Tech Electrical Engineering" /></label>
        <div className="field-pair">
          <label><span>Graduation year</span><input inputMode="numeric" maxLength={4} value={profile.graduationYear} onChange={(event) => onChange({ ...profile, graduationYear: event.target.value.replace(/\D/g, "") })} placeholder="2025" /></label>
          <label><span>Experience level</span><select value={profile.experienceLevel} onChange={(event) => onChange({ ...profile, experienceLevel: event.target.value as CandidateProfile["experienceLevel"] })}><option value="any">Any</option><option value="fresher">Fresher</option><option value="entry">0–2 years</option><option value="experienced">3+ years</option></select></label>
        </div>
        <label><span>Experience detail</span><input value={profile.experience} onChange={(event) => onChange({ ...profile, experience: event.target.value })} placeholder="Graduate / 1 year" /></label>
        <label><span>Preferred locations</span><input value={profile.locations} onChange={(event) => onChange({ ...profile, locations: event.target.value })} placeholder="India, Bihar, Bengaluru, Remote" /></label>
        <label className="check-label"><input type="checkbox" checked={profile.recentGraduate} onChange={(event) => onChange({ ...profile, recentGraduate: event.target.checked })} /><span>Recent graduate</span></label>
        <label className="check-label"><input type="checkbox" checked={profile.remoteOnly} onChange={(event) => onChange({ ...profile, remoteOnly: event.target.checked })} /><span>Prioritise remote roles</span></label>
        <button className="button secondary" type="submit">{saved ? "Profile saved ✓" : "Save profile locally"}</button>
        <button className="use-profile" type="button" onClick={onUseForSearch} disabled={!profile.role.trim()}>Use profile in search →</button>
      </form>
      <p className="privacy-note"><span>●</span> Raw resume text is discarded after extraction. Only the fields above are stored.</p>
    </aside>
  );
}
