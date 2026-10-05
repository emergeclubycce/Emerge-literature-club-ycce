/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import React from 'react'
import { Inter } from 'next/font/google'

import Profilecard from '../components/team/profilecard'
import { useLenis } from '@/utils/lenis'
import {
  president,
  vice_president,
  working_president,
  core,
  semicore,
  coordinator,
  executive,
  getTeamMemberImage,
  TeamMember,
} from '@/database/team'
import Footer from '../components/reuseable/reusable-home/Footer'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

function page() {
  useLenis();

  // Website Developed By: Muchkundraje Thote, Kshitij Kamdi
  const webDevelopers = [
    working_president.find((m) => m.name.toLowerCase().includes('muchkund')),
    semicore.find((m) => m.name.toLowerCase().includes('kshitij')),
  ].filter((m): m is TeamMember => Boolean(m));

  // Website Managed By: Anushka Wankhede, KOMAL Bhelawe, Janhavi Hardas
  const webManagers = [
    semicore.find((m) => m.name.toLowerCase().includes('anushka')),
    core.find((m) => m.name.toLowerCase().includes('komal')),
    executive.find(
      (m) =>
        m.name.toLowerCase().includes('janhavi hardas') ||
        m.email.toLowerCase().includes('thoolkhushi')
    ),
  ].filter((m): m is TeamMember => Boolean(m));

  return (
    <>
      <main className={`${inter.className} min-h-screen w-full flex flex-col pt-30 items-center justify-center`}>
        <h2 className={`${inter.className} text-5xl text-sky-500 text-center font-bold mb-10`}>Team Emerge</h2>

        {/* 1. President */}
        <h2 className={`${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>President</h2>
        <div className="min-h-30 w-full flex flex-wrap items-center gap-4 mb-40 justify-center">
          {president.map((val, inx) => (
            <Profilecard
              key={inx}
              name={val.name}
              role={val.role}
              domain={val.domain}
              imageSrc={getTeamMemberImage(val)}
              linkedIn={val.linkedin}
              instagram={val.instagram}
            />
          ))}
        </div>

        {/* 2. Vice President */}
        <h2 className={`${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Vice President</h2>
        <div className="min-h-30 w-full flex flex-wrap items-center gap-4 mb-40 justify-center">
          {vice_president.map((val, inx) => (
            <Profilecard
              key={inx}
              name={val.name}
              role={val.role}
              domain={val.domain}
              imageSrc={getTeamMemberImage(val)}
              linkedIn={val.linkedin}
              instagram={val.instagram}
            />
          ))}
        </div>

        {/* 3. Working President */}
        <h2 className={`${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Working President</h2>
        <div className="min-h-30 w-full flex flex-wrap items-center gap-4 mb-40 justify-center">
          {working_president.map((val, inx) => (
            <Profilecard
              key={inx}
              name={val.name}
              role={val.role}
              domain={val.domain}
              imageSrc={getTeamMemberImage(val)}
              linkedIn={val.linkedin}
              instagram={val.instagram}
            />
          ))}
        </div>

        {/* 4. Core */}
        <h2 className={`${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Core</h2>
        <div className="min-h-30 w-full flex flex-wrap items-center gap-4 mb-40 justify-center">
          {core.map((val, inx) => (
            <Profilecard
              key={inx}
              name={val.name}
              role={val.role}
              domain={val.domain}
              imageSrc={getTeamMemberImage(val)}
              linkedIn={val.linkedin}
              instagram={val.instagram}
            />
          ))}
        </div>

        {/* 5. Semi Core */}
        <h2 className={`${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Semi Core</h2>
        <div className="min-h-30 w-full flex flex-wrap items-center gap-4 mb-40 justify-center">
          {semicore.map((val, inx) => (
            <Profilecard
              key={inx}
              name={val.name}
              role={val.role}
              domain={val.domain}
              imageSrc={getTeamMemberImage(val)}
              linkedIn={val.linkedin}
              instagram={val.instagram}
            />
          ))}
        </div>

        {/* 6. Coordinator */}
        <h2 className={`${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Coordinator</h2>
        <div className="min-h-30 w-full flex flex-wrap items-center gap-4 mb-40 justify-center">
          {coordinator.map((val, inx) => (
            <Profilecard
              key={inx}
              name={val.name}
              role={val.role}
              domain={val.domain}
              imageSrc={getTeamMemberImage(val)}
              linkedIn={val.linkedin}
              instagram={val.instagram}
            />
          ))}
        </div>

        {/* 7. Executive */}
        <h2 className={`${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Executive</h2>
        <div className="min-h-30 w-full flex flex-wrap items-center gap-4 mb-40 justify-center">
          {executive.map((val, inx) => (
            <Profilecard
              key={inx}
              name={val.name}
              role={val.role}
              domain={val.domain}
              imageSrc={getTeamMemberImage(val)}
              linkedIn={val.linkedin}
              instagram={val.instagram}
            />
          ))}
        </div>

        {/* 8. Website Developed By */}
        <h2 className={`${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Website Developed By</h2>
        <div className="min-h-30 w-full flex flex-wrap items-center gap-4 mb-40 justify-center">
          {webDevelopers.map((val, inx) => (
            <Profilecard
              key={inx}
              name={val.name}
              role={val.role}
              domain={val.domain}
              imageSrc={getTeamMemberImage(val)}
              linkedIn={val.linkedin}
              instagram={val.instagram}
            />
          ))}
        </div>

        {/* 9. Website Managed By */}
        <h2 className={`${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Website Managed By</h2>
        <div className="min-h-30 w-full flex flex-wrap items-center gap-4 mb-40 justify-center">
          {webManagers.map((val, inx) => (
            <Profilecard
              key={inx}
              name={val.name}
              role={val.role}
              domain={val.domain}
              imageSrc={getTeamMemberImage(val)}
              linkedIn={val.linkedin}
              instagram={val.instagram}
            />
          ))}
        </div>

        <Footer />
      </main>
    </>
  )
}

export default page