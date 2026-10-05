import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Instagram, LucideLinkedin } from 'lucide-react'

interface profileProb {
  name: string
  post?: string
  role?: string
  domain?: string | null
  index?: number
  imageSrc?: string
  linkedIn?: string
  instagram?: string
}

function ProfileCard({ name, post, role, domain, index, imageSrc, linkedIn, instagram }: profileProb) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const roleText = role || post || '';
  const domainText = domain && domain.trim() ? domain.trim() : '';
  const subtitle = domainText && roleText
    ? `${domainText} • ${roleText}`
    : (domainText || roleText);

  const initialSrc = imageSrc || (index !== undefined ? `/Team-Image/${index}.jpg` : '/image/logo-2.png');
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  const validLinkedIn = Boolean(
    linkedIn &&
    linkedIn.trim() !== '' &&
    !['no', 'no linkedin', '-', 'none'].includes(linkedIn.trim().toLowerCase()) &&
    (linkedIn.startsWith('http') || linkedIn.startsWith('www.') || linkedIn.includes('linkedin.com'))
  );
  const formattedLinkedIn = linkedIn && !linkedIn.startsWith('http') ? `https://${linkedIn}` : linkedIn;

  const validInstagram = Boolean(
    instagram &&
    instagram.trim() !== '' &&
    !['no', 'none', '-'].includes(instagram.trim().toLowerCase()) &&
    (instagram.startsWith('http') || instagram.startsWith('www.') || instagram.includes('instagram.com'))
  );
  const formattedInstagram = instagram && !instagram.startsWith('http') ? `https://${instagram}` : instagram;

  return (
    <div className="h-[28rem] w-80 border p-2 border-zinc-200 bg-white shadow-2xl rounded-2xl overflow-hidden">
      <div className="relative h-[90%] w-full rounded-t-2xl overflow-hidden">
        {/* Skeleton Loader */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-zinc-200 animate-pulse" />
        )}
        {/* Profile Image */}
        <Image
          src={currentSrc}
          alt={name ? `${name} - Emerge Team` : "profile"}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className={`object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            if (currentSrc.startsWith('/team-images/')) {
              setCurrentSrc(currentSrc.replace('/team-images/', '/Team-images/'));
            } else if (!currentSrc.includes('logo')) {
              setCurrentSrc('/image/logo-2.png');
            }
            setImgLoaded(true);
          }}
        />
        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 w-full h-30 bg-gradient-to-t from-white to-transparent"></div>
        <div className='h-30 w-10  absolute top-0 right-0 p-2 flex flex-col gap-3 '>
          {validLinkedIn && formattedLinkedIn &&
            <Link href={formattedLinkedIn} target="_blank" rel="noopener noreferrer">
              <div className='h-6 w-6 outline-2 outline-zinc-500 shadow-2xl  rounded-2xl bg-white cursor-pointer flex items-center justify-center'>
                <LucideLinkedin fill='#0073B2' color='#0073B2' size={15} />
              </div>
            </Link>
          }
          {validInstagram && formattedInstagram &&
            <Link href={formattedInstagram} target="_blank" rel="noopener noreferrer">
              <div className='h-6 w-6   rounded-2xl bg-white cursor-pointer flex items-center justify-center'>
                <Instagram size={15} />
              </div>
            </Link>
          }
        </div>
      </div>

      {/* Text Content */}
      <div className="relative -m-7 text-center px-4 ">
        <h2 className=" inter font-bold text-xl opacity-90">{name.trim()}</h2>
        <p className="text-gray-600 capitalize text-sm">  {subtitle}  </p>
      </div>
    </div>
  )
}

export default ProfileCard
