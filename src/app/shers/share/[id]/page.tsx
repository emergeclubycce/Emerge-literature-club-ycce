import { Metadata } from 'next';
import SherCard from '@/app/components/reuseable/reusable-home/sher-card';
import { sher } from '@/database/team';

// ✅ Change the type to Promise<{ id: string }>
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> // ⬅️ Added Promise wrapper
}): Promise<Metadata> {
  const { id } = await params; 
  const event = sher[parseInt(id)];
  
  if (!event) {
    return {
      title: 'Sher Not Found',
    };
  }
  
  return {
    title: 'Shared Sher',
    description: event.caption || 'Check out this amazing sher!',
    openGraph: {
      title: `Sher by ${event.writter}`,
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
  const event = sher[parseInt(id)]; // Convert string id to number

  if (!event) {
    return <div>Sher not found</div>;
  }

  return (
    <div className="h-screen w-full bg-white flex items-center justify-center">
      <SherCard 
        writter={event.writter} 
        image={event.image} 
        caption={event.caption}
        idx={1}
      />
    </div>
  );
}