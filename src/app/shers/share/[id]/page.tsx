
import { Metadata } from 'next';
import SherCard from '@/app/components/reuseable/reusable-home/sher-card';
import { sher } from '@/database/team';
import { Inter } from 'next/font/google';
import { useLenis } from '@/utils/lenis';
import Footer from '@/app/components/reuseable/reusable-home/Footer';

// ✅ Change the type to Promise<{ id: string }>


const inter = Inter({
   subsets: ["latin"], 
  variable:"--font-inter"
})

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> // ⬅️ Added Promise wrapper
}): Promise<Metadata> {
  const { id } = await params; 
  
 const event = sher.find(item => item.name == `${id}`);
  
  if (!event) {
    return {
      title: 'Sher Not Found',
    };
  }
  
  return {
    title: 'Shared Sher',
    description: event.caption || 'Check out this amazing sher!',
    openGraph: {
      title: `Poem by ${event.writter} on Emerge Website `,
      description: event.caption,
      images: [event.image],
      url: `https://www.emergeycce.club/shers/share/${id}`, // ⬅️ Use id, not params.id
    },
    twitter: {
      card: 'summary_large_image',
      title: `Sher by ${event.writter}`,
      description: event.caption,
      images: [event.image],
    },
  };
}

// ✅ Make the page component async and update the type
export default async function page({ 
  params 
}: { 
  params: Promise<{ id: string }> // ⬅️ Added Promise wrapper
}) {
  const { id } = await params; // ⬅️ Await params
  
  const event = sher.find(item => item.name == `${id}`);
  



  if (!event) {
    return <div>Sher not found</div>;
  }

  

  return (
    <>
    
    <div className="h-screen w-full bg-white mb-10 md:mb-30 flex flex-col mt-12 md:mt-20 items-center justify-center">
        <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mt-20 mb-10`}>Shared Sher</h2>
      <SherCard 
        writter={event.writter} 
        image={event.image} 
        caption={event.caption}
        idx={1}
        name={event.name}
      />
    </div>

    <Footer/>
    </>
  );
}