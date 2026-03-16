const TABS = [
  { key: 'top',  label: 'Top' },
  { key: 'new',  label: 'New' },
  { key: 'best', label: 'Best' },
]

export default function FeedTabs({ active, onChange }) {
  return (
    <div className="feed-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`feed-tab${active === tab.key ? ' active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
