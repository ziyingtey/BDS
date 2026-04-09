import { useMemo, useState } from 'react'
import './App.css'

const initialCounters = [
  { id: 1, name: 'Counter A', service: 'General Banking', isOpen: true },
  { id: 2, name: 'Counter B', service: 'Card Services', isOpen: true },
  { id: 3, name: 'Counter C', service: 'Wealth Management', isOpen: false },
]

const queueSeed = ['Q-101', 'Q-102', 'Q-103', 'Q-104', 'Q-105', 'Q-106', 'Q-107']
const initialBranches = [
  { id: 1, name: 'BDS KL Sentral', crowdLevel: 'Low', isAvailable: true, slotCapacity: 8, slotBooked: 5 },
  { id: 2, name: 'BDS Mid Valley', crowdLevel: 'High', isAvailable: false, slotCapacity: 8, slotBooked: 8 },
  { id: 3, name: 'BDS Damansara', crowdLevel: 'Low', isAvailable: true, slotCapacity: 10, slotBooked: 4 },
]

function App() {
  const [activeView, setActiveView] = useState('ops')
  const [counters, setCounters] = useState(initialCounters)
  const [branches, setBranches] = useState(initialBranches)
  const [queueList, setQueueList] = useState(queueSeed)
  const [currentlyServing, setCurrentlyServing] = useState('Q-100')
  const [crowdLevel, setCrowdLevel] = useState('Moderate')
  const [estimatedWait, setEstimatedWait] = useState(18)
  const [ticketIssuedToday, setTicketIssuedToday] = useState(124)
  const [avgServiceMins, setAvgServiceMins] = useState(7)

  const openCounterCount = useMemo(
    () => counters.filter((counter) => counter.isOpen).length,
    [counters],
  )

  const queueAhead = queueList.length

  const toggleCounter = (id) => {
    setCounters((prev) =>
      prev.map((counter) =>
        counter.id === id ? { ...counter, isOpen: !counter.isOpen } : counter,
      ),
    )
  }

  const callNext = () => {
    if (queueList.length === 0) return

    const [nextTicket, ...rest] = queueList
    setCurrentlyServing(nextTicket)
    setQueueList(rest)
    setTicketIssuedToday((prev) => prev + 1)
    setEstimatedWait((prev) => Math.max(5, prev - 2))
    setAvgServiceMins((prev) => Math.max(4, prev - 0.2))

    if (rest.length <= 2) {
      setCrowdLevel('Low')
    } else if (rest.length >= 8) {
      setCrowdLevel('High')
    } else {
      setCrowdLevel('Moderate')
    }
  }

  const toggleBranchUnavailable = (id) => {
    setBranches((prev) =>
      prev.map((branch) =>
        branch.id === id ? { ...branch, isAvailable: !branch.isAvailable } : branch,
      ),
    )
  }

  const updateBranchCrowd = (id, crowd) => {
    setBranches((prev) =>
      prev.map((branch) => (branch.id === id ? { ...branch, crowdLevel: crowd } : branch)),
    )
  }

  const updateSlotCap = (id, cap) => {
    setBranches((prev) =>
      prev.map((branch) =>
        branch.id === id
          ? { ...branch, slotCapacity: Math.max(branch.slotBooked, cap) }
          : branch,
      ),
    )
  }

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <h1>BDS Staff Dashboard</h1>
          <p>Mock real-time queue and branch crowd monitoring</p>
        </div>
        {activeView === 'ops' ? (
          <button
            className="primaryButton"
            onClick={callNext}
            disabled={queueList.length === 0}
          >
            {queueList.length === 0 ? 'Queue Empty' : 'Call Next Queue'}
          </button>
        ) : null}
      </header>

      <section className="viewTabs">
        <button
          className={activeView === 'ops' ? 'tab activeTab' : 'tab'}
          onClick={() => setActiveView('ops')}
        >
          Queue Operations
        </button>
        <button
          className={activeView === 'branch' ? 'tab activeTab' : 'tab'}
          onClick={() => setActiveView('branch')}
        >
          Branch Controls
        </button>
      </section>

      {activeView === 'ops' ? (
        <>
          <section className="statsGrid">
            <article className="card">
              <h2>Crowd Status</h2>
              <p className={`status ${crowdLevel.toLowerCase()}`}>{crowdLevel}</p>
            </article>
            <article className="card">
              <h2>Currently Serving</h2>
              <p className="metric">{currentlyServing}</p>
            </article>
            <article className="card">
              <h2>Queue Ahead</h2>
              <p className="metric">{queueAhead}</p>
            </article>
            <article className="card">
              <h2>Estimated Wait</h2>
              <p className="metric">{estimatedWait} mins</p>
            </article>
            <article className="card">
              <h2>Tickets Issued Today</h2>
              <p className="metric">{ticketIssuedToday}</p>
            </article>
            <article className="card">
              <h2>Avg Service Time</h2>
              <p className="metric">{avgServiceMins.toFixed(1)} mins</p>
            </article>
          </section>

          <section className="panel">
            <h2>Counter Status Management</h2>
            <p>{openCounterCount} counters open</p>
            <div className="counterList">
              {counters.map((counter) => (
                <div className="counterRow" key={counter.id}>
                  <div>
                    <strong>{counter.name}</strong>
                    <p>{counter.service}</p>
                  </div>
                  <button
                    className={counter.isOpen ? 'openToggle' : 'closedToggle'}
                    onClick={() => toggleCounter(counter.id)}
                  >
                    {counter.isOpen ? 'Open' : 'Closed'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Live Queue Feed</h2>
            <div className="queueList">
              {queueList.length === 0 ? (
                <p>All customers served. Queue is clear.</p>
              ) : (
                queueList.map((ticket, index) => (
                  <div key={ticket} className="queueItem">
                    <span>{ticket}</span>
                    <span>{index + 1} ahead</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="panel">
          <h2>Branch Availability and Slot Capacity</h2>
          <p>Control overcrowded branches and booking slot limits.</p>
          <div className="branchList">
            {branches.map((branch) => (
              <div className="branchCard" key={branch.id}>
                <div className="branchTitleRow">
                  <strong>{branch.name}</strong>
                  <span className={!branch.isAvailable ? 'badge danger' : 'badge ok'}>
                    {!branch.isAvailable ? 'Unavailable' : 'Available'}
                  </span>
                </div>
                <div className="branchControls">
                  <label>
                    Crowd Level
                    <select
                      value={branch.crowdLevel}
                      onChange={(event) => updateBranchCrowd(branch.id, event.target.value)}
                    >
                      <option>Low</option>
                      <option>Moderate</option>
                      <option>High</option>
                    </select>
                  </label>
                  <label>
                    Slot Capacity
                    <input
                      type="number"
                      min={branch.slotBooked}
                      value={branch.slotCapacity}
                      onChange={(event) => updateSlotCap(branch.id, Number(event.target.value))}
                    />
                  </label>
                  <p>
                    Booked: {branch.slotBooked}/{branch.slotCapacity}
                  </p>
                  <button
                    className={!branch.isAvailable ? 'closedToggle' : 'openToggle'}
                    onClick={() => toggleBranchUnavailable(branch.id)}
                  >
                    {!branch.isAvailable ? 'Set Available' : 'Set Unavailable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export default App
