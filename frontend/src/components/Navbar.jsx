import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="navbar">
      <NavLink to="/" className="navbar-logo" style={{ textDecoration: 'none' }}>
        <span className="navbar-logo-mark">HN</span>
        <span className="navbar-logo-text">Reader</span>
      </NavLink>
      <nav className="navbar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Feed
        </NavLink>
        <NavLink
          to="/bookmarks"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Bookmarks
        </NavLink>
      </nav>
    </header>
  )
}
