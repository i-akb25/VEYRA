"use client";

import type { ApplicationRecord, ApplicationStatus } from "@/lib/types";

const statuses: Array<[ApplicationStatus, string]> = [["saved", "Saved"], ["applied", "Applied"], ["interview", "Interview"], ["rejected", "Rejected"], ["offer", "Offer"]];

type Props = { records: ApplicationRecord[]; activeStatus: ApplicationStatus; onStatusChange: (status: ApplicationStatus) => void; onUpdate: (record: ApplicationRecord) => void; onRemove: (id: string) => void };

export function ApplicationWorkspace({ records, activeStatus, onStatusChange, onUpdate, onRemove }: Props) {
  const visible = records.filter((record) => record.status === activeStatus);
  return (
    <div className="applications-view">
      <div className="pipeline-tabs">{statuses.map(([status, label]) => <button key={status} className={activeStatus === status ? "active" : ""} onClick={() => onStatusChange(status)}>{label}<span>{records.filter((record) => record.status === status).length}</span></button>)}</div>
      {visible.length === 0 && <div className="empty-state compact"><span>○</span><h3>No roles in {activeStatus}.</h3><p>Move jobs into this stage from search results or another application record.</p></div>}
      <div className="application-list">{visible.map((record) => <article key={record.id} className="application-card">
        <div className="application-head"><div><p>{record.job.company} · {record.job.location}</p><h3>{record.job.title}</h3></div><a href={record.job.url} target="_blank" rel="noopener noreferrer">Listing ↗</a></div>
        <div className="application-fields">
          <label><span>Stage</span><select value={record.status} onChange={(event) => onUpdate({ ...record, status: event.target.value as ApplicationStatus, updatedAt: new Date().toISOString() })}>{statuses.map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></label>
          <label><span>Deadline</span><input type="date" value={record.deadline} onChange={(event) => onUpdate({ ...record, deadline: event.target.value, updatedAt: new Date().toISOString() })} /></label>
          <label><span>Follow-up</span><input type="date" value={record.followUp} onChange={(event) => onUpdate({ ...record, followUp: event.target.value, updatedAt: new Date().toISOString() })} /></label>
        </div>
        <label><span>Private notes</span><textarea rows={3} value={record.notes} onChange={(event) => onUpdate({ ...record, notes: event.target.value, updatedAt: new Date().toISOString() })} placeholder="Contact, referral, interview preparation…" /></label>
        <button className="remove-record" onClick={() => onRemove(record.id)}>Remove from workspace</button>
      </article>)}</div>
    </div>
  );
}
