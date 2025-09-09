'use client'

import React from 'react'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { Inter } from 'next/font/google'


const inter = Inter({
  variable: "--font-inter"
})

function Nav() {
  return (
    <div className={`${inter.className} font-medium fixed top-0 flex items-center justify-between px-10 py-2 text-[#3A4146] z-50  h-20 w-full `}>
      <div className='h-15 w-15 rounded-full overflow-hidden border-[1px] border-gray-400  '>
        <Image src='/image/image.png' alt='logo' width={100} height={100} />
      </div>

      <div className=' hidden   md:flex items-center justify-center gap-10 cursor-pointer'>
        <Link href={'/'}>
          <h1>Home</h1>
        </Link>
        <Link href={'/about-us'}>
          <h2>About us</h2>
        </Link>

        <Link href={'/shers'}>
          <h2>Shers </h2>
        </Link>
        <Link href={'/event'}>
          <h2>Events</h2>
        </Link>
        <Link href={'/team'}>
          <h4>Team</h4>
        </Link>

        <Link href={'/auth/login'}>
          <button className='px-2 py-2 bg-sky-500 rounded text-white'>Login</button>
        </Link>


      </div>

      <Menu className='md:hidden block' />

    </div>
  )
}

export default Nav