import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { staffApi, apiBase, getStoredApiBase, setStoredApiBase } from './staffApi'

const POLL_MS = 4000
const STORAGE_BRANCH = 'bds_staff_branch_id'

const SERVICE_OPTIONS = [
  'General Banking',
  'Card Services',
  'Wealth Management',
]

export default function App() {
  const [activeTab, setActiveTab] = useState('ops')
  const [apiUrlInput, setApiUrlInput] = useState(() => getStoredApiBase() || import.meta.env.VITE_API_BASE_URL || '')
  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_BRANCH)
      return v ? Number(v) : null
    } catch {
      return null
    }
  })
  const [dash, setDash] = useState(null)
  const [slots, setSlots] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [lastOk, setLastOk] = useState(null)

  const [simService, setSimService] = useState('General Banking')
  const [simSlot, setSimSlot] = useState('')

  const applyApiUrl = () => {
    setStoredApiBase(apiUrlInput)
    setBranches([])
    setBranchId(null)
    setDash(null)
    setError('')
    window.location.reload()
  }

  const refresh = useCallback(async () => {
    if (!branchId) return
    setError('')
    try {
      const [d, s] = await Promise.all([
        staffApi.dashboard(branchId),
        staffApi.listSlots(branchId),
      ])
      setDash(d)
      setSlots(Array.isArray(s) ? s : [])
      setLastOk(new Date())
      if (!simSlot && s?.length) setSimSlot(s[0].label)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [branchId, simSlot])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setError('')
      try {
        const list = await staffApi.listBranches()
        if (cancelled) return
        const arr = Array.isArray(list) ? list : []
        setBranches(arr)
        let nextId = branchId
        try {
          const s = localStorage.getItem(STORAGE_BRANCH)
          const n = s ? Number(s) : null
          if (n && arr.some((b) => b.id === n)) nextId = n
        } catch {
          /* ignore */
        }
        if (!nextId && arr.length) nextId = arr[0].id
        else if (nextId && !arr.some((b) => b.id === nextId)) nextId = arr[0]?.id ?? null
        if (nextId) {
          setBranchId(nextId)
          try {
            localStorage.setItem(STORAGE_BRANCH, String(nextId))
          } catch {
            /* ignore */
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load branches once on mount; API URL changes trigger full page reload
  }, [])

  useEffect(() => {
    if (!branchId) return
    refresh()
    const t = setInterval(refresh, POLL_MS)
    return () => clearInterval(t)
  }, [branchId, refresh])

  const onChangeBranch = (id) => {
    const n = Number(id)
    setBranchId(n)
    try {
      localStorage.setItem(STORAGE_BRANCH, String(n))
    } catch {
      /* ignore */
    }
  }

  const onCallNext = async () => {
    if (!branchId) return
    setBusy(true)
    setError('')
    try {
      await staffApi.callNext(branchId)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const onToggleCounter = async (counter, nextOpen) => {
    if (!branchId) return
    setBusy(true)
    setError('')
    try {
      await staffApi.updateCounter(branchId, counter.id, {
        isOpen: nextOpen,
        closedReason: nextOpen ? null : 'Lunch',
      })
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const onSimulator = async () => {
    if (!branchId || !simSlot) return
    setBusy(true)
    setError('')
    try {
      await staffApi.simulatorJoin(branchId, {
        serviceType: simService,
        timeSlotLabel: simSlot,
      })
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const onPatchPolicy = async (patch) => {
    if (!branchId) return
    setBusy(true)
    setError('')
    try {
      await staffApi.patchPolicy(branchId, patch)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const branchName = useMemo(() => {
    const b = branches.find((x) => x.id === branchId)
    return b?.name ?? '—'
  }, [branches, branchId])

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <h1>BDS Branch Staff Dashboard</h1>
          <p>
            Live data from API <code>{apiBase()}</code>
            {lastOk ? ` · updated ${lastOk.toLocaleTimeString()}` : ''}
          </p>
        </div>
        <div className="headerActions">
          {activeTab === 'ops' ? (
            <button className="primaryButton" onClick={onCallNext} disabled={busy || !dash?.waitingCount}>
              {dash?.waitingCount ? 'Call next customer' : 'No queue'}
            </button>
          ) : null}
        </div>
      </header>

      <section className="configBar">
        <label className="configField">
          API base URL
          <input
            type="url"
            value={apiUrlInput}
            onChange={(e) => setApiUrlInput(e.target.value)}
            placeholder="http://localhost:5062"
          />
        </label>
        <button type="button" className="secondaryButton" onClick={applyApiUrl}>
          Apply &amp; reload
        </button>
        <label className="configField">
          Branch
          <select
            value={branchId ?? ''}
            onChange={(e) => onChangeBranch(e.target.value)}
            disabled={!branches.length}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="secondaryButton" onClick={refresh} disabled={busy || !branchId}>
          Refresh now
        </button>
      </section>

      {error ? (
        <div className="errorBanner" role="alert">
          {error}
        </div>
      ) : null}

      <section className="viewTabs">
        {['ops', 'counters', 'branch', 'simulator'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'tab activeTab' : 'tab'}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'ops'
              ? 'Queue operations'
              : tab === 'counters'
                ? 'Counters & lunch'
                : tab === 'branch'
                  ? 'Branch policy'
                  : 'Customer simulator'}
          </button>
        ))}
      </section>

      {!dash && branchId ? (
        <p className="muted">Loading dashboard…</p>
      ) : null}

      {dash && activeTab === 'ops' ? (
        <>
          <section className="statsGrid">
            <article className="card">
              <h2>Crowd level</h2>
              <p className={`status ${String(dash.crowdLevel || '').toLowerCase()}`}>{dash.crowdLevel}</p>
            </article>
            <article className="card">
              <h2>Now serving</h2>
              <p className="metric">{dash.nowServingLabel}</p>
            </article>
            <article className="card">
              <h2>Waiting</h2>
              <p className="metric">{dash.waitingCount}</p>
            </article>
            <article className="card">
              <h2>Est. wait (next)</h2>
              <p className="metric">
                {Math.round(dash.estimatedWaitNextMinutes)} min
                <span className="subtle"> ({dash.estimateSource})</span>
              </p>
            </article>
            <article className="card">
              <h2>Counters open</h2>
              <p className="metric">
                {dash.openCounters}/{dash.totalCounters}
              </p>
            </article>
            <article className="card">
              <h2>Last issued #</h2>
              <p className="metric">Q-{dash.lastIssuedNumber}</p>
            </article>
          </section>

          <section className="panel">
            <h2>Waiting tickets — {branchName}</h2>
            <div className="queueList">
              {!dash.waitingTickets?.length ? (
                <p className="muted">No customers waiting.</p>
              ) : (
                dash.waitingTickets.map((t, i) => (
                  <div className="queueItem" key={t.id}>
                    <span>
                      <strong>{t.queueLabel}</strong> · {t.serviceType}
                    </span>
                    <span>
                      {i + 1} in line · {t.timeSlotLabel}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      ) : null}

      {dash && activeTab === 'counters' ? (
        <section className="panel">
          <h2>Counters &amp; lunch policy</h2>
          <p className="muted">
            Closing counters is limited: minimum open counters and max simultaneous &quot;Lunch&quot; closures
            (see backend <code>appsettings.json</code> → Staff:LunchPolicy).
          </p>
          <div className="counterList">
            {dash.counters?.map((c) => (
              <div className="counterRow" key={c.id}>
                <div>
                  <strong>{c.label}</strong>
                  <p>{c.serviceType}</p>
                  {!c.isOpen && c.closedReason ? <p className="muted">Reason: {c.closedReason}</p> : null}
                </div>
                <div className="counterActions">
                  <button
                    type="button"
                    className={c.isOpen ? 'openToggle' : 'closedToggle'}
                    disabled={busy}
                    onClick={() => onToggleCounter(c, !c.isOpen)}
                  >
                    {c.isOpen ? 'Close (lunch)' : 'Open'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {dash && activeTab === 'branch' ? (
        <section className="panel">
          <h2>Branch policy — {branchName}</h2>
          <div className="branchControls">
            <label>
              Crowd level
              <select
                value={dash.crowdLevel}
                onChange={(e) => onPatchPolicy({ crowdLevel: e.target.value })}
                disabled={busy}
              >
                <option>Low</option>
                <option>Moderate</option>
                <option>High</option>
              </select>
            </label>
            <label className="checkboxRow">
              <input
                type="checkbox"
                checked={dash.bookingDisabled}
                onChange={(e) => onPatchPolicy({ bookingDisabled: e.target.checked })}
                disabled={busy}
              />
              Block new queue bookings (overcrowded / maintenance)
            </label>
          </div>
        </section>
      ) : null}

      {dash && activeTab === 'simulator' ? (
        <section className="panel">
          <h2>Customer simulator</h2>
          <p className="muted">
            Adds one queue ticket using the seeded simulator account (no mobile app). Same rules as real
            booking: slot capacity, overcrowding, booking disabled.
          </p>
          <div className="simulatorRow">
            <label>
              Service
              <select value={simService} onChange={(e) => setSimService(e.target.value)}>
                {SERVICE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Time slot
              <select value={simSlot} onChange={(e) => setSimSlot(e.target.value)}>
                {slots.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label} ({s.booked}/{s.capacity})
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="primaryButton" onClick={onSimulator} disabled={busy || !simSlot}>
              Simulate join queue
            </button>
          </div>
        </section>
      ) : null}
    </main>
  )
}
