import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      <div className='bg-[#fdfcf3] relative'>
        <div className='w-screen max-w-[1250px] p-2 mx-auto flex items-center justify-between gap-2'>
          {/* Logo */}
          <div className='w-[138px] h-[60px]'>
            <img className='block w-[100%] h-[100%]' src="/logo.png" alt="YogaPatha - Certified Yoga Trainers India" />
          </div>

          {/* Desktop Navigation */}
          <nav className='hidden lg:flex'>
            <ul className='flex items-center space-x-4 xl:space-x-8'>
              <li>
                <NavLink
                  to={"/"}
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='text-[#336b6e] hover:text-[#bb9f58] font-medium transition-colors duration-200 py-2 px-3 rounded-md hover:bg-white/50'
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={"/services"}
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='text-[#336b6e] hover:text-[#bb9f58] font-medium transition-colors duration-200 py-2 px-3 rounded-md hover:bg-white/50'
                >
                  Services
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={"/about_us"}
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='text-[#336b6e] hover:text-[#bb9f58] font-medium transition-colors duration-200 py-2 px-3 rounded-md hover:bg-white/50'
                >
                  About Us
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/yttc"
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='text-[#336b6e] hover:text-[#bb9f58] font-medium transition-colors duration-200 py-2 px-3 rounded-md hover:bg-white/50'
                >
                  YTTC
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/contact_us"
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='text-[#336b6e] hover:text-[#bb9f58] font-medium transition-colors duration-200 py-2 px-3 rounded-md hover:bg-white/50'
                >
                  Contact
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/media"
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='text-[#336b6e] hover:text-[#bb9f58] font-medium transition-colors duration-200 py-2 px-3 rounded-md hover:bg-white/50'
                >
                  Media
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/blogs"
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='text-[#336b6e] hover:text-[#bb9f58] font-medium transition-colors duration-200 py-2 px-3 rounded-md hover:bg-white/50'
                >
                  Blogs
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/locations"
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='text-[#336b6e] hover:text-[#bb9f58] font-medium transition-colors duration-200 py-2 px-3 rounded-md hover:bg-white/50'
                >
                  Locations
                </NavLink>
              </li>
              <li className='px-1 py-2 bg-[#336b6e] rounded-2xl hover:opacity-90 transition-all duration-200'>
                <NavLink
                  to={"/trainer_login"}
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='text-[#bb9f58] font-bold transition-colors duration-200 py-2 px-3 rounded-md'
                >
                  Trainer Login/Signup
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className='lg:hidden flex flex-col items-center justify-center w-8 h-8 space-y-1 cursor-pointer rounded-md p-1'
            aria-label="Toggle mobile menu"
          >
            <span
              className={`block w-5 h-0.5 bg-gray-800 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                }`}
            ></span>
            <span
              className={`block w-5 h-0.5 bg-gray-800 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''
                }`}
            ></span>
            <span
              className={`block w-5 h-0.5 bg-gray-800 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                }`}
            ></span>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={`lg:hidden absolute top-full left-0 z-[99] right-0 bg-[#fdfcf3] border-t border-gray-200 transition-all duration-300 ease-in-out ${isMobileMenuOpen
            ? 'opacity-100 visible transform translate-y-0'
            : 'opacity-0 invisible transform -translate-y-2'
            }`}
        >
          <nav className='max-w-[1250px] mx-auto p-4'>
            <ul className='space-y-2'>
              <li>
                <NavLink
                  to={"/"}
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='block text-[#336b6e] hover:text-blue-600 font-medium transition-colors duration-200 py-3 px-4 rounded-md hover:bg-white/50'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={"/services"}
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='block text-[#336b6e] hover:text-blue-600 font-medium transition-colors duration-200 py-3 px-4 rounded-md hover:bg-white/50'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Services
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={"/about_us"}
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='block text-[#336b6e] hover:text-blue-600 font-medium transition-colors duration-200 py-3 px-4 rounded-md hover:bg-white/50'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About Us
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/contact_us"
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='block text-[#336b6e] hover:text-blue-600 font-medium transition-colors duration-200 py-3 px-4 rounded-md hover:bg-white/50'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/yttc"
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='block text-[#336b6e] hover:text-blue-600 font-medium transition-colors duration-200 py-3 px-4 rounded-md hover:bg-white/50'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  YTTC
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/media"
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='block text-[#336b6e] hover:text-blue-600 font-medium transition-colors duration-200 py-3 px-4 rounded-md hover:bg-white/50'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Media
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/blogs"
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='block text-[#336b6e] hover:text-blue-600 font-medium transition-colors duration-200 py-3 px-4 rounded-md hover:bg-white/50'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Blogs
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/locations"
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='block text-[#336b6e] hover:text-blue-600 font-medium transition-colors duration-200 py-3 px-4 rounded-md hover:bg-white/50'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Locations
                </NavLink>
              </li>
              <li className='px-1 py-2 bg-[#336b6e] rounded-2xl'>
                <NavLink
                  to={"/trainer_login"}
                  style={({ isActive }) => isActive ? { color: '#bb9f58' } : {}}
                  className='block text-[#bb9f58] font-bold hover:text-blue-600 transition-colors duration-200 py-3 px-4 rounded-md hover:bg-white/50'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Trainer Login/Signup
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </div >
    </>
  )
}

export default Header