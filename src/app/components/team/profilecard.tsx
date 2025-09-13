import React from 'react'
import Image from 'next/image'


function ProfileCard() {
  return (
    <div className="h-[28rem] w-80 border p-2 border-zinc-200 bg-white shadow-2xl rounded-2xl overflow-hidden">
      <div className="relative h-[90%] w-full rounded-t-2xl overflow-hidden">
        {/* Profile Image */}
        <Image 
          src="/image/1.jpg" 
          alt="profile" 
          fill 
          className="object-cover"
        />
        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 w-full h-30 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      {/* Text Content */}
      <div className="relative -m-7 text-center px-4 ">
        <h2 className=" inter font-bold text-xl opacity-90">Muchkudraje Thote</h2>
        <p className="text-gray-600">Technical <span className='text-blue-400'>Head</span> </p>
      </div>

      
    


      

     
    
    </div>
  )
}

export default ProfileCard
