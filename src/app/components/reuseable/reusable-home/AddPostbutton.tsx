"use client"

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'

function AddPostbutton() {
    const pathname = usePathname()


    const [show, setShow] = React.useState(true);
    React.useEffect(()=>{
        if(pathname == "/shers/submit"){
            setShow(false)
        }else{
            setShow(true)
        }

    },[pathname])
  return (
    <div>
   {
         show&& (
            <Link  href={'/shers/submit'}>
            <div className=' fixed bottom-8 right-8 rounded-full flex items-center justify-center h-12 w-12 bg-sky-700 z-99'>
                 <Plus className='text-white'/>
            </div> 
        </Link>
          )
        }


    </div>
  )
}

export default AddPostbutton