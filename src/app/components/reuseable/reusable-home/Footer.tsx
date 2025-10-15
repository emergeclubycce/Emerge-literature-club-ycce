import React from 'react'
import Image from 'next/image'

function Footer() {
  return (
    <footer className='h-50 w-full border-t-[1px] border-gray-300  flex flex-col items-center justify-center'>
                <div className='h-15 w-15 rounded-full overflow-hidden border-[1px] border-gray-400  '>
                         <Image src='/image/logo.png' alt='logo' width={100} height={100} />
                </div>
               
                 <h1 className='mt-7 md:text-[16px] text-sm text-center px-2'>
                        Designed & Developed with ❤️ by  <a href="https://github.com/MUCHKUNDRAJE"><span className='hover:underline'>  Muchkundraje thote  </span> </a>
                 </h1>
      </footer>
  )
}

export default Footer